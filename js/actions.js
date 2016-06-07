function modelBackground(video, width, height) {
    var myCanvas = document.createElement('canvas'),
        iterations = 0;

    myCanvas.width = width;
    myCanvas.height = height;

    var interval = setInterval(function() {
        iterations++;
        console.log(iterations);
        if (iterations === 2) {
            clearInterval(interval);
            myCanvas.getContext('2d').drawImage(video, 0, 0, width, height);
            BACKGROUND_DATA = myCanvas.getContext('2d').getImageData(0, 0, width, height);
            recognizeHand(video, width, height)
        }
    }, 1000);
}

function extractBackground(n, m, background, image) {
    var binaryImage = new BinaryImage(n, m);
    for (var i = 0; i < background.length; i += 4) {
        var backgroundPixel = new RGBPixel(background[i], background[i + 1], background[i + 2]),
            imagePixel = new RGBPixel(image[i], image[i + 1], image[i + 2]);
        var rowIndex = Math.floor((i / 4) / m);

        if (rgbThreshold(THRESHOLD, backgroundPixel, imagePixel)) {
            binaryImage.data[rowIndex].push(true);
        } else {
            if (binaryImage.data[rowIndex] === undefined) {
                var x = 6;
            }
            binaryImage.data[rowIndex].push(false);
        }
    }
    return binaryImage;
}

function skinDetection(image) {

}

function findHand(image) {

}

function recognizeHand(video, width, height) {
    var tempCanvas = document.createElement('canvas'),
        imageData = undefined,
        foregroundContext = undefined,
        destinationContext = undefined,
        result = undefined;

    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, width, height);
    imageData = tempCanvas.getContext('2d').getImageData(0, 0, width, height);

    backgroundContext = document.getElementById('backgroundCanvas').getContext('2d');
    backgroundContext.putImageData(BACKGROUND_DATA, 0, 0);
    foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    foregroundContext.drawImage(video, 0, 0, width, height);
    destinationContext = document.getElementById('resultCanvas').getContext('2d');
    result = extractBackground(height, width, BACKGROUND_DATA, imageData);
    printBinaryImage(result, width, height, destinationContext);
    // setInterval(function() {
    //     recognizeHand(ctx, video, width, height);
    // }, 500);
}


function step(height, width, background, image, destinationContext) {
    var result = extractBackground(height, width, background.data, image.data);
    printBinaryImage(result, width, height, destinationContext);
}

function debounce(fn, delay) {
    var timer = null;
    return function() {
        var context = this,
            args = arguments;
        if (timer === null) {
            timer = setTimeout(function() {
                fn.apply(context, args);
                timer = null;
            }, delay);
        }
    };
}


function setUp(width, height) {
    var video = document.createElement('video');

    navigator.getMedia(
        HD_CONSTRAINTS,
        function(stream) {
            if (navigator.mozGetUserMedia) {
                video.mozSrcObject = stream;
            } else {
                var vendorURL = window.URL || window.webkitURL;
                video.src = vendorURL.createObjectURL(stream);
            }
            video.play();
        },
        function(err) {
            throw new Error('Error occured when streaming video!');
        }
    );
    video.onplay = function(ev) {
        modelBackground(video, width, height);
    };
}
