/*var CONSTANTS = {
    THRESHOLD: 10,
    HD_CONSTRAINTS: {
        video: {
            mandatory: {
                minWidth: 1280,
                minHeight: 720
            }
        }
    },
    RECOGNITIONS_PER_SECOND: 10,
    BACKGROUND_DATA: null,
    WEBCAM: (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia),
    HSV_THRESHOLD: {
        HUE: {
            MIN: 0,
            MAX: 100
        },
        SATURATION: {
            MIN: 48,
            MAX: 100
        },
        VALUE: {
            MIN: 80,
            MAX: 100
        }
    }
};
*/

var THRESHOLD = 30;
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
var NUMBER_OF_BACKGROUND_ITERATIONS = 2;

navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var HSV_THRESHOLD = {
    HUE: [{
        MIN: 0,
        MAX: 20
    }, {
        MIN: 240,
        MAX: 360
    }],
    SATURATION: [{
        MIN: 35,
        MAX: 100
    }],
    VALUE: [{
        MIN: 0,
        MAX: 100
    }]
};
