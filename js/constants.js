var THRESHOLD = 10;
var HD_CONSTRAINTS = {
    video: {
        mandatory: {
            minWidth: 1280,
            minHeight: 720
        }
    }
};
var RECOGNITIONS_PER_SECOND = 10;
var BACKGROUND_DATA = null;
NUMBER_OF_BACKGROUND_ITERATIONS = 2;

navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
