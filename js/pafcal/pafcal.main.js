navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var pafcal = {};
pafcal.canvas = document.createElement("canvas");
pafcal.tempCanvas = document.createElement("canvas");

pafcal.constants = {
    WIDTH: 640,
    HEIGHT: 480,
    MOVE_COLOR: '#00CC66',
    CLICK_COLOR: '#0080FF',
    MISS_COLOR: '#FF8000',
    BACKGROUND_COLOR: '#C0C0C0',
    TIME: 15000,
    TRACKER_SIZE: 30,
    BACKGROUND_SUBSTRACTION_SETTING: true,
    BACKGROUND_FRAMES: 15,

    HD_CONSTRAINTS: {
        video: {
            mandatory: {
                minWidth: 1280,
                minHeight: 720
            }
        }
    }
};

var _videoStream = null;
var _start = undefined;
var _initialTime = undefined;
var _totalTime = 0;
pafcal._finalInfo = {
    TOTAL_TIME_SECONDS: null,
    TOTAL_FRAMES_CAPTURED: 0,
    TOTAL_HANDS_DETECTED: 0,
    DETECTION_TIME_MILISECONDS: null,
    TOTAL_CLICKS: 0
}

if (window.Worker) {
    var worker = new Worker("js/pafcal/pafcal.worker.js");

    pafcal.start = function(configuration) {
        window._initialTime = new Date().getTime();
        _setUpCanvas();
        _setUpTracker();
        _setUpBackgroundFeedback();
        _setUpRecording(worker);
        window._start = !pafcal.constants.BACKGROUND_SUBSTRACTION_SETTING;
        console.log("BACKGROUND_EXTRACTION", (pafcal.constants.BACKGROUND_SUBSTRACTION_SETTING) ? "ON" : "OFF");

        if (pafcal.constants.BACKGROUND_SUBSTRACTION_SETTING === true) {
            _startCountdown(worker);
        } else {
            _setUpControlEvents();
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

    pafcal.stop = function() {
        var videoTrack = _videoStream.getTracks()[0];
        videoTrack.stop();
        _videoStream.removeTrack(videoTrack);
        worker.terminate();

        pafcal._finalInfo.TOTAL_TIME_SECONDS = (new Date().getTime() - window._initialTime) / 1000;
        pafcal._finalInfo.DETECTION_TIME_MILISECONDS = window._totalTime / pafcal._finalInfo.TOTAL_HANDS_DETECTED;
        console.log(pafcal._finalInfo);
    }

    pafcal.pause = function() {
        window._start = !window._start;
        if (window._start === true) {
            _sendImage('IMAGE', worker);
        }
    }

    pafcal.click = function(point) {
        var event = document.createEvent("MouseEvent");
        event.initMouseEvent(
            "click",
            true, true,
            window, null,
            point.x, point.y, 0, 0,
            false, false, false, false,
            0, null
        );
        var topElement = document.elementFromPoint(point.x, point.y);
        topElement.dispatchEvent(event);
    };

    pafcal.showTracker = function(point, state) {
        var tracker = document.getElementById("PAFCAL_TRACKER"),
            widthRatio = (document.documentElement.clientWidth - 100) / pafcal.constants.WIDTH,
            heightRatio = (document.documentElement.clientHeight + 200) / pafcal.constants.HEIGHT,
            tempX = point.x - pafcal.constants.TRACKER_SIZE / 2,
            tempY = point.y - pafcal.constants.TRACKER_SIZE / 2,
            trackerX = (pafcal.constants.WIDTH - tempX) * widthRatio,
            trackerY = tempY * heightRatio;
        // trackerX = (point.x - pafcal.constants.TRACKER_SIZE / 2) * widthRatio,
        // trackerY = (point.y - pafcal.constants.TRACKER_SIZE / 2) * heightRatio;

        tracker.style.display = "initial";
        tracker.style.left = trackerX + "px";
        tracker.style.top = trackerY + "px";
        tracker.style.right = null;
        tracker.style.bottom = null;
        tracker.style.border = null;


        switch (state) {
            case 'MOVE':
                tracker.style.background = pafcal.constants.MOVE_COLOR;
                break;
            case 'CLICK':
                tracker.style.background = pafcal.constants.CLICK_COLOR;
                break;
            case 'SECOND_CLICK':
                tracker.style.background = pafcal.constants.CLICK_COLOR;
                tracker.style.border = "3px solid black";
                break;
            default:
                break;
        }
        return { x: trackerX, y: trackerY };

    };

    pafcal.miss = function() {
        var tracker = document.getElementById("PAFCAL_TRACKER");

        tracker.style.display = "initial";
        tracker.style.background = pafcal.constants.MISS_COLOR;
        tracker.style.right = "30px";
        tracker.style.bottom = "30px";

        tracker.style.top = null;
        tracker.style.left = null;
        tracker.style.border = null;

    };

    pafcal.setUpCommunications = function(e) {
        if (window._start === false) return;
        switch (e.data.type) {
            case 'BINARY_DATA':
                var canvas = document.getElementById("resultCanvas");
                canvas.width = canvas.width;
                var ctx = canvas.getContext('2d');
                var qwer = ctx.createImageData(pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
                for (var i = 0; i < e.data.data.image.size; i++) {
                    var point = _getPointBasedOnIndex(i, e.data.data.image),
                        index = ((point.y + e.data.data.offset.y) * pafcal.constants.WIDTH + (point.x + e.data.data.offset.x)) * 4;
                    qwer.data[index + 3] = 255;
                    qwer.data[index + 1] = 255;
                }
                ctx.putImageData(qwer, 0, 0);
                break;
            case 'IMAGE':
                window._start = new Date().getTime();
                pafcal._finalInfo.TOTAL_FRAMES_CAPTURED++;
                _sendImage('IMAGE', worker);
                break;
            case 'MOVE':
                window._totalTime = new Date().getTime() - window._start;
                pafcal._finalInfo.TOTAL_HANDS_DETECTED++;
                pafcal.showTracker(e.data.data, 'MOVE');
                break;
                /*var canvas = document.getElementById("resultCanvas");
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
                ctx.stroke();*/

                break;
            case 'CLICK':
                window._totalTime = new Date().getTime() - window._start;
                pafcal._finalInfo.TOTAL_CLICKS++;
                pafcal._finalInfo.TOTAL_HANDS_DETECTED++;
                var center = pafcal.showTracker(e.data.data, 'CLICK');
                pafcal.click(center);
                break;
            case 'SECOND_CLICK':
                window._totalTime = new Date().getTime() - window._start;
                pafcal._finalInfo.TOTAL_HANDS_DETECTED++;
                pafcal.showTracker(e.data.data, 'SECOND_CLICK');
                break;
            case 'MISS':
                pafcal.miss();
                break;
            default:
                break;
        }
    }

    function _setUpControlEvents() {
        document.onkeyup = function(event) {
            if (event.shiftKey) {
                if (event.keyCode === 81) {
                    pafcal.stop();
                }
                if (event.keyCode === 80) {
                    pafcal.pause();
                }
            }
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
            _videoStream = stream;
        },
        function(err) {
            throw new Error('Error occured when streaming video!');
        }
    );
    pafcal.video.onplay = function(ev) {
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
                _setUpControlEvents();
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
