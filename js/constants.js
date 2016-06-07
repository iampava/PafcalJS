var THRESHOLD = 30;
var HD_CONSTRAINTS = {
    video: {
        mandatory: {
            minWidth: 1280,
            minHeight: 720
        }
    }
};
var FRAME_RATE = 250;
var BACKGROUND_DATA = null;

navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
