navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var pafcal = {};
pafcal.canvas = document.createElement("canvas");
pafcal.tempCanvas = document.createElement("canvas");

pafcal.constants = {
    WIDTH: 640,
    HEIGHT: 480,
    HD_CONSTRAINTS: {
        video: {
            mandatory: {
                minWidth: 1280,
                minHeight: 720
            }
        }
    },
    TIME: 15000,
    BACKGROUND_FRAMES: 15,
    TRACKER_SIZE: 30,
    BACKGROUND_SUBSTRACTION_SETTING: true,
    BACKGROUND_COLOR: '#C0C0C0'
};

if (window.Worker) {
    var worker = new Worker("js/pafcal/pafcal.worker.js");

    pafcal.start = function(configuration) {
        _setUpCanvas();
        _setUpTracker();
        _setUpBackgroundFeedback();
        _setUpRecording(worker);

        if (pafcal.constants.BACKGROUND_SUBSTRACTION_SETTING === true) {
            _startCountdown(worker);
        } else {
            _sendImage('IMAGE', worker);
        }
    };

    pafcal.configure = function(object) {
        for (var property in object) {
            if (object.hasOwnProperty(property) && pafcal.constants.hasOwnProperty(property)) {
                pafcal.constants[property] = object[property];
            }
        }
        worker.postMessage({ type: 'CONFIG', data: object });
    };

    pafcal.click = function(point) {
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */ , true /* cancelable */ ,
            window, null,
            point.x, point.y, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/ , null
        );
        var el = document.elementFromPoint(point.x, point.y);
        el.dispatchEvent(ev);
    };

    pafcal.showTracker = function(point, color) {
        var tracker = document.getElementById("PAFCAL_TRACKER"),
            widthRatio = (document.documentElement.clientWidth - 80) / pafcal.constants.WIDTH,
            heightRatio = (document.documentElement.clientHeight - 50) / pafcal.constants.HEIGHT,
            trackerX = (point.x - pafcal.constants.TRACKER_SIZE / 2) * widthRatio,
            trackerY = (point.y - pafcal.constants.TRACKER_SIZE / 2) * heightRatio;

        tracker.style.display = "initial";
        tracker.style.background = color;
        tracker.style.left = trackerX + "px";
        tracker.style.top = trackerY + "px";
        tracker.style.right = null;
        tracker.style.bottom = null;
    };

    pafcal.miss = function(color) {
        var tracker = document.getElementById("PAFCAL_TRACKER");
        tracker.style.display = "initial";
        tracker.style.background = color;
        tracker.style.top = null;
        tracker.style.left = null;
        tracker.style.right = "30px";
        tracker.style.bottom = "30px";
    };

    pafcal.setUpCommunications = function(e) {
        switch (e.data.type) {

            case 'COLOR_TEST':
                // var canvas = document.getElementById("resultCanvas");
                // var ctx = canvas.getContext('2d');
                // var imageData = ctx.createImageData(pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                // for (var i = 0; i < e.data.data.col.length; i++) {
                //     var point = _getPointBasedOnIndex(i, e.data.data),
                //         index = (point.y * pafcal.constants.WIDTH + point.x) * 4;
                //     imageData.data[index + 3] = 255;
                //     imageData.data[index + 1] = 255;
                // }
                // ctx.putImageData(imageData, 0, 0);

                // var videoCanvas = document.getElementById("videoCanvas");
                // videoCanvas.getContext('2d').drawImage(pafcal.video, 0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                break;
            case 'CONVEX_HULL':
                break;
                var canvas = document.getElementById("resultCanvas");
                var ctx = canvas.getContext('2d');
                var imageData = ctx.createImageData(pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                for (var i = 0; i < e.data.data.image.col.length; i++) {
                    var point = _getPointBasedOnIndex(i, e.data.data.image),
                        index = (point.y * pafcal.constants.WIDTH + point.x) * 4;
                    imageData.data[index + 3] = 255;
                    imageData.data[index + 1] = 255;
                }
                ctx.putImageData(imageData, 0, 0);

                var points = e.data.data.points;
                ctx.beginPath();
                ctx.lineWidth = "6";
                ctx.strokeStyle = "red";
                ctx.moveTo(points[0].x, points[0].y);

                for (var i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                var videoCanvas = document.getElementById("videoCanvas");
                videoCanvas.getContext('2d').drawImage(pafcal.video, 0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                break;
            case 'IMAGE':
                _sendImage('IMAGE', worker);
                break;
            case 'MOVE':
                pafcal.showTracker(e.data.data.point, e.data.data.color);
                break;
                var canvas = document.getElementById("resultCanvas");
                var ctx = canvas.getContext('2d');
                var qwer = ctx.createImageData(pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                for (var i = 0; i < e.data.data.image.size; i++) {
                    var point = _getPointBasedOnIndex(i, e.data.data.image),
                        index = (point.y * pafcal.constants.WIDTH + point.x) * 4;
                    qwer.data[index + 3] = 255;
                    qwer.data[index + 1] = 255;
                }
                ctx.putImageData(qwer, 0, 0);

                var points = e.data.data.convexHull;
                ctx.beginPath();
                ctx.lineWidth = "6";
                ctx.strokeStyle = "red";
                ctx.moveTo(points[0].x, points[0].y);

                for (var i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.stroke();

                break;
            case 'CLICK':
                pafcal.showTracker(e.data.data.point, e.data.data.color);
                var widthRatio = (document.documentElement.clientWidth - 80) / pafcal.constants.WIDTH,
                    heightRatio = (document.documentElement.clientHeight - 50) / pafcal.constants.HEIGHT,
                    trackerX = (e.data.data.point.x - pafcal.constants.TRACKER_SIZE / 2) * widthRatio,
                    trackerY = (e.data.data.point.y - pafcal.constants.TRACKER_SIZE / 2) * heightRatio;
                pafcal.click({ x: trackerX, y: trackerY });
                break;
                var canvas = document.getElementById("resultCanvas");
                var ctx = canvas.getContext('2d');
                var qwer = ctx.createImageData(pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                for (var i = 0; i < e.data.data.image.size; i++) {
                    var point = _getPointBasedOnIndex(i, e.data.data.image),
                        index = (point.y * pafcal.constants.WIDTH + point.x) * 4;
                    qwer.data[index + 3] = 255;
                    qwer.data[index + 1] = 255;
                }
                ctx.putImageData(qwer, 0, 0);

                var points = e.data.data.convexHull;
                ctx.beginPath();
                ctx.lineWidth = "6";
                ctx.strokeStyle = "red";
                ctx.moveTo(points[0].x, points[0].y);

                for (var i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.stroke();
                break;
            case 'MISS':
                pafcal.miss(e.data.data);
                break;
                var canvas = document.getElementById("resultCanvas");
                var ctx = canvas.getContext('2d');
                var qwer = ctx.createImageData(pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                ctx.putImageData(qwer, 0, 0);
                break;
            default:
                break;
        }
    }

} else {
    throw new Error("Workers not supported in this browser!");
}

function _setUpCanvas() {
    pafcal.canvas.width = pafcal.constants.WIDTH;
    pafcal.canvas.height = pafcal.constants.HEIGHT;
};

function _setUpTracker() {
    var tracker = document.createElement("div");
    tracker.id = "PAFCAL_TRACKER";
    tracker.style.display = "none";
    tracker.style.position = "fixed";
    tracker.style.borderRadius = "50%";
    tracker.style.width = pafcal.constants.TRACKER_SIZE + "px";
    tracker.style.height = pafcal.constants.TRACKER_SIZE + "px";

    document.body.appendChild(tracker);
};

function _setUpBackgroundFeedback() {
    var background = document.createElement("div"),
        text = document.createElement("p");

    background.id = "BACKGROUND_FEEDBACK_RECT";
    background.style.textAlign = "center";
    background.style.display = "none";
    background.style.position = "fixed";
    background.style.width = "300px";
    background.style.height = "150px";
    background.style.fontSize = "45px";
    background.style.right = "10px";
    background.style.bottom = "10px";
    background.style.background = pafcal.constants.BACKGROUND_COLOR;

    text.id = "BACKGROUND_FEEDBACK_TEXT";

    background.appendChild(text);
    document.body.appendChild(background);
};

function _setUpRecording(worker) {
    pafcal.video = document.createElement('video');
    navigator.getMedia(
        pafcal.constants.HD_CONSTRAINTS,
        function(stream) {
            if (navigator.mozGetUserMedia) {
                pafcal.video.mozSrcObject = stream;
            } else {
                var vendorURL = window.URL || window.webkitURL;
                pafcal.video.src = vendorURL.createObjectURL(stream);
            }
            pafcal.video.play();
        },
        function(err) {
            throw new Error('Error occured when streaming video!');
        }
    );
    pafcal.video.onplay = function(ev) {
        console.log("on play");
        worker.onmessage = pafcal.setUpCommunications;
    };
};

function _startCountdown(worker) {
    var seconds = 3,
        interval = null;

    interval = window.setInterval(function() {
        _showCountdown(worker, seconds);
        if (seconds === 0) clearInterval(interval);
        seconds--;
    }, 1000)
};

function _showCountdown(worker, seconds) {
    var background = document.getElementById("BACKGROUND_FEEDBACK_RECT"),
        text = document.getElementById("BACKGROUND_FEEDBACK_TEXT"),
        interval = null,
        iterations = 0;

    if (seconds > 0) {
        text.innerHTML = seconds;
        background.style.display = "initial";
    } else {
        text.innerHTML = "Recording...";
        interval = window.setInterval(function() {
            iterations++;
            if (iterations === pafcal.constants.BACKGROUND_FRAMES) {
                clearInterval(interval);
                _sendImage('FINAL_BACKGROUND_IMAGE', worker, iterations);
                _deleteBackground();
            } else {
                _sendImage('BACKGROUND_IMAGE', worker, iterations);
            }
        }, pafcal.constants.TIME / pafcal.constants.BACKGROUND_FRAMES);
    }
};

function _deleteBackground() {
    var background = document.getElementById("BACKGROUND_FEEDBACK_RECT"),
        text = document.getElementById("BACKGROUND_FEEDBACK_TEXT");

    document.body.removeChild(background);
};

function _sendImage(type, worker, extra) {
    var imageData = null,
        faceData = null,
        scale = Math.min(160 / pafcal.constants.WIDTH, 160 / pafcal.constants.HEIGHT),
        w = (pafcal.constants.WIDTH * scale) | 0,
        h = (pafcal.constants.HEIGHT * scale) | 0;
    console.log("image");
    pafcal.tempCanvas.width = w;
    pafcal.tempCanvas.height = h;

    pafcal.canvas.getContext("2d").drawImage(pafcal.video, 0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
    imageData = pafcal.canvas.getContext("2d").getImageData(0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);

    pafcal.tempCanvas.getContext("2d").drawImage(pafcal.video, 0, 0, w, h);
    faceData = pafcal.tempCanvas.getContext("2d").getImageData(0, 0, w, h);

    var videoCanvas = document.getElementById("videoCanvas");
    videoCanvas.getContext('2d').drawImage(pafcal.video, 0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);

    switch (type) {
        case 'IMAGE':
            worker.postMessage({ type: type, data: { image: imageData, jsfeat: faceData } });
            break;
        case 'BACKGROUND_IMAGE':
            worker.postMessage({ type: type, data: { image: imageData, count: extra } });
            break;
        case 'FINAL_BACKGROUND_IMAGE':
            worker.postMessage({ type: type, data: { image: imageData, count: extra } });
            break;
        default:
            break;
    }
};

function _getBestRect(rects, scale) {
    var length = rects.length,
        max = -Infinity,
        best = undefined;

    if (length === 0) return null;
    for (var i = 0; i < length; i++) {
        if (rects[i].confidence > max) {
            max = rects[i].confidence;
            best = rects[i];
        }
    }

    // var rect = new Rectangle(new Point(best.x * scale | 0, best.y * scale | 0), best.width * scale | 0, best.height * scale | 0);

    // postMessage({ type: 'FACE', data: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } });

    return new Rectangle(new Point(best.x * scale | 0, best.y * scale | 0), best.width * scale | 0, best.height * scale | 0);
};

function _getPointBasedOnIndex(index, sparseImage) {
    var col = sparseImage.col[index],
        left = 0,
        right = sparseImage.rowCount;

    while (left <= right) {
        var middle = Math.floor((left + right) / 2);

        if (sparseImage.row[middle] <= index && sparseImage.row[middle + 1] <= index) {
            left = middle + 1;
            continue;
        }
        if (sparseImage.row[middle] > index) {
            right = middle - 1;
            continue;
        }
        return new Point(col, middle);
    }
    throw new Error("Can't find point!");
}
