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
    TIME: 1000,
    BACKGROUND_FRAMES: 20,
    TRACKER_SIZE: 30,
    BACKGROUND_SUBSTRACTION: true,
    BACKGROUND_COLOR: '#C0C0C0'
};

if (window.Worker) {
    var worker = new Worker("js/pafcal/pafcal.worker.js");

    pafcal.start = function(configuration) {
        _setUpCanvas();
        _setUpTracker();
        _setUpBackgroundFeedback();
        _setUpRecording(worker);

        if (pafcal.constants.BACKGROUND_SUBSTRACTION === true) {
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
        var tracker = document.getElementById("PAFCAL_TRACKER");
        tracker.style.display = "initial";
        tracker.style.background = color;
        tracker.style.left = (point.x - pafcal.constants.TRACKER_SIZE / 2) + "px";
        tracker.style.top = (point.y - pafcal.constants.TRACKER_SIZE / 2) + "px";
    };

    pafcal.miss = function(point, color) {
        var tracker = document.getElementById("PAFCAL_TRACKER");
        tracker.style.display = "initial";
        tracker.style.background = color;
        tracker.style.right = "30px";
        tracker.style.bottom = "30px";
    };

    pafcal.setUpCommunications = function(e) {
        switch (e.data.type) {
            case 'FACE':
                var canvas = document.getElementById("resultCanvas");
                var ctx = canvas.getContext('2d');
                ctx.beginPath();
                ctx.lineWidth = "1";
                ctx.strokeStyle = "red";
                ctx.rect(e.data.data.x, e.data.data.y, e.data.data.width, e.data.data.height);
                ctx.stroke();
                break;
            case 'IMAGE':
                _sendImage('IMAGE', worker);
                break;
            case 'MOVE':
                pafcal.showTracker(e.data.data, e.data.color);
                break;
            case 'CLICK':
                pafcal.showTracker(e.data.data, e.data.color);
                pafcal.click(e.data.data)
                break;
            case 'MISS':
                pafcal.miss(e.data.data, e.data.color);
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
    tracker.id = "TRACKER";
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
        worker.onmessage = pafcal.setUpCommunications;
    };
};

function _startCountdown(worker) {
    var seconds = Math.floor(pafcal.constants.TIME / 1000),
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
                _sendImage('FINAL_BACKGROUND_IMAGE', worker);
                _deleteBackground();
            } else {
                _sendImage('BACKGROUND_IMAGE', worker);
            }
        }, pafcal.constants.TIME / pafcal.constants.BACKGROUND_FRAMES);
    }
};

function _deleteBackground() {
    var background = document.getElementById("BACKGROUND_FEEDBACK_RECT"),
        text = document.getElementById("BACKGROUND_FEEDBACK_TEXT");

    document.body.removeChild(background);
};

function _sendImage(type, worker) {
    console.log("sendImage");
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




    if (type === 'IMAGE') {
        worker.postMessage({ type: type, data: { image: imageData, jsfeat: faceData } });
    } else {
        worker.postMessage({ type: type, data: imageData });
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
