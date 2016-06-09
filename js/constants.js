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

var THRESHOLD = 10;
var HD_CONSTRAINTS = {
    video: {
        mandatory: {
            minWidth: 1280,
            minHeight: 720
        }
    }
};
var RECOGNITIONS_PER_SECOND = 0.5;
var BACKGROUND_DATA = null;
var NUMBER_OF_BACKGROUND_ITERATIONS = 2;

navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var HSV_THRESHOLD = {
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
};
var LOW_PASS_FILTER = [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9]
];



var CYB_CONVERSION_MATRIX = [
    [0.299, 0.587, 0.114],
    [-0.169, -0.331, 0.5],
    [0.5, -0.419, -0.081]
];
// var CYB_CONVERSION_MATRIX = [
//     [65.481, 128.553, 24.966],
//     [-37.797, -74.203, 112],
//     [112, -93.786, -18.214]
// ];
var CYB_THRESHOLD = {
    CB: [{
        MIN: 70,
        MAX: 130
    }],
    CR: [{
        MIN: 130,
        MAX: 175
    }]
};
var STEP_SIZE = 4;
var HAND_RATIO = {
    WIDTH: 100,
    HEIGHT: 250
};
