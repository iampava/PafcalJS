var pafcal = {};
pafcal.constants = {
    WIDTH: 640,
    HEIGHT: 480,
    BACKGROUND_THRESHOLD: 10,
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
    HSV_THRESHOLD: {
        HUE: [{
            MIN: 0,
            MAX: 25
        }, {
            MIN: 230,
            MAX: 360
        }],
        SATURATION: [{
            MIN: 0,
            MAX: 100
        }],
        VALUE: [{
            MIN: 0,
            MAX: 100
        }]
    },
    MOVE_COLOR: '#00CC66',
    CLICK_COLOR: '#0080FF',
    MISS_COLOR: '#FF8000',
    BACKGROUND_COLOR: '#C0C0C0'
}

if (window.Worker) {
    var worker = new Worker("js/pafcal/pafcal.worker.js");


    worker.onmessage = function(e) {
        switch (e.data.type) {
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
    };

    pafcal.start = function(configuration) {
        pafcal.showBackground();
        // pafcal.configure();
        // worker.postMessage({ type: 'START', data: null });
    };

    pafcal.configure = function(object) {
        for (var property in object) {
            if (object.hasOwnProperty(property) && pafcal.constants.hasOwnProperty(property)) {
                pafcal.constants[property] = object[property];
            }
        }

        var tracker = document.createElement("div");
        tracker.id = "PAFCAL_TRACKER";
        tracker.style.display = "none";
        tracker.style.position = "fixed";
        tracker.style.borderRadius = "50%";
        tracker.style.width = pafcal.constants.TRACKER_SIZE + "px";
        tracker.style.height = pafcal.constants.TRACKER_SIZE + "px";

        document.body.appendChild(tracker);

        worker.postMessage({ type: 'CONFIG', data: pafcal.constants });

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
    pafcal.showBackground = function() {
        var background = document.createElement("div"),
            text = document.createElement("p");
        background.id = "BACKGROUND_SUBSTRACTION";
        text.id = "TEXT";
        background.style.position = "fixed";
        background.style.width = "300px";
        background.style.height = "150px";
        background.style.fontSize = "45px";
        background.style.textAlign = "center";
        background.style.right = "10px";
        background.style.bottom = "10px";
        background.style.background = pafcal.constants.BACKGROUND_COLOR;
        text.innerHTML = "ceva";
        background.appendChild(text);
        document.body.appendChild(background);

    }

    pafcal.miss = function(point, color) {
        var tracker = document.getElementById("PAFCAL_TRACKER");
        tracker.style.display = "initial";
        tracker.style.background = color;
        tracker.style.right = "30px";
        tracker.style.bottom = "30px";
    }

} else {
    throw new Error("Workers not supported in this browser!");
}
