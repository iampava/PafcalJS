var pafcal = {};
navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
pafcal.canvas = document.createElement("canvas");

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
    BACKGROUND_FRAMES: 20,
    TRACKER_SIZE: 30,
    MOVE_COLOR: '#00CC66',
    CLICK_COLOR: '#0080FF',
    MISS_COLOR: '#FF8000',
    BACKGROUND_COLOR: '#C0C0C0',
    BACKGROUND_SUBSTRACTION: true
}

if (window.Worker) {
    var worker = new Worker("js/pafcal/pafcal.worker.js");




    pafcal.start = function(configuration) {
        _setUpCanvas();
        _setUpTracker();
        _setUpBackgroundFeedback();
        _setUpRecording(worker);

    };

    pafcal.configure = function(object) {
        for (var property in object) {
            if (object.hasOwnProperty(property) && pafcal.constants.hasOwnProperty(property)) {
                pafcal.constants[property] = object[property];
            }
        }

        worker.postMessage({ type: 'CONFIG', data: object });

    };
    pafcal.background = function() {

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
    }
    pafcal.setUpCommunications = function(e) {
        switch (e.data.type) {
            case 'IMAGE':
                _sendImage();
                break;
            case 'BACKGROUND_SECOND':
                _showCountdown(worker, e.data.data);
                break;
            case 'MOVE':
                pafcal.show(e.data.data, e.data.color);
                break;
            case 'CLICK':
                pafcal.show(e.data.data, e.data.color);
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
}

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
}

function _setUpTracker() {
    var tracker = document.createElement("div");
    tracker.id = "TRACKER";
    tracker.style.display = "none";
    tracker.style.position = "fixed";
    tracker.style.borderRadius = "50%";
    tracker.style.width = pafcal.constants.TRACKER_SIZE + "px";
    tracker.style.height = pafcal.constants.TRACKER_SIZE + "px";

    document.body.appendChild(tracker);
}

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
        worker.postMessage({ type: 'START', data: null });

    };
}

function _showCountdown(worker, data) {
    var background = document.getElementById("BACKGROUND_FEEDBACK_RECT"),
        text = document.getElementById("BACKGROUND_FEEDBACK_TEXT"),
        iterations = 0,
        interval = null;

    if (data > 0) {
        text.innerHTML = data;
        background.style.display = "initial";
    } else {
        text.innerHTML = "Recording...";
        interval = window.setInterval(function() {
            if (++iterations === pafcal.constants.BACKGROUND_FRAMES) {
                clearInterval(interval);
                worker.postMessage({ type: "BACKGROUND_FINISH", data: null });
                _deleteBackground();
            }
            _sendImage(worker, "BACKGROUND_IMAGE");
        }, 250);
    }

}

function _deleteBackground() {
    var background = document.getElementById("BACKGROUND_FEEDBACK_RECT"),
        text = document.getElementById("BACKGROUND_FEEDBACK_TEXT");

    document.body.removeChild(background);
}

function _sendImage(worker, type) {
    var imageData = null;
    pafcal.canvas.getContext("2d").drawImage(pafcal.video, 0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);
    imageData = pafcal.canvas.getContext("2d").getImageData(0, 0, pafcal.constants.WIDTH, pafcal.constants.HEIGHT);

    worker.postMessage({ type: type, data: imageData });
}

