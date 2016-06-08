function modelBackground(video, width, height) {
    var myCanvas = document.createElement('canvas'),
        iterations = 0;

    myCanvas.width = width;
    myCanvas.height = height;

    var interval = setInterval(function() {
        iterations++;
        console.log(iterations);
        if (iterations === NUMBER_OF_BACKGROUND_ITERATIONS) {
            clearInterval(interval);
            myCanvas.getContext('2d').drawImage(video, 0, 0, width, height);
            BACKGROUND_DATA = myCanvas.getContext('2d').getImageData(0, 0, width, height);
            console.log("DONE");
            setTimeout(function() {
                setInterval(function() {
                    recognizeHand(video, width, height);
                }, 1000 / RECOGNITIONS_PER_SECOND);
            }, 2000);
        }
    }, 1000);
}

function extractBackground(m, n, background, image) {
    var binaryImage = new BinaryImage(n, m),
        length = background.data.length;
    for (var i = 0; i < length; i += 4) {
        var backgroundPixel = new RGBPixel(background.data[i], background.data[i + 1], background.data[i + 2]),
            imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]);
        var rowIndex = Math.floor((i / 4) / m);

        if (backgroundThreshold(THRESHOLD, backgroundPixel, imagePixel)) {
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



function rbGaussianModel(width, height, image, context) {
    var imageData = context.getImageData(0, 0, width, height),
        length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var rowIndex = Math.floor(i / 4 / width),
            rbPixel = rgbToRb({ red: image.data[i], green: image.data[i + 1], blue: image.data[i + 2] });
        imageData.data[i + 3] = 255;
        imageData.data[i + 1] = 0;
        imageData.data[i + 2] = 0;
        imageData.data[i + 0] = rbLikelihood(rbPixel);
    }
    context.putImageData(imageData, 0, 0);
}

function backgroundAndSkinDetection(width, height, background, image) {
    var binaryImage = new BinaryImage(height, width),
        length = background.data.length;
    for (var i = 0; i < length; i += 4) {
        var backgroundPixel = new RGBPixel(background.data[i], background.data[i + 1], background.data[i + 2]),
            imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]);
        var rowIndex = Math.floor((i / 4) / width);

        if (backgroundThreshold(THRESHOLD, backgroundPixel, imagePixel) && (cybThreshold(rgbTocyb(imagePixel)) || (hsvThreshold(rgbToHsv(imagePixel))))) {
            binaryImage.data[rowIndex].push(true);
        } else {
            binaryImage.data[rowIndex].push(false);
        }
    }
    return binaryImage;
}

function cybRgbSkinDetection(width, height, image) {
    var binaryImage = new BinaryImage(height, width),
        length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var rgbPixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]);
        var hsvPixel = rgbToHsv(rgbPixel);
        var cybPixel = rgbTocyb(rgbPixel);
        var rowIndex = Math.floor((i / 4) / width);

        binaryImage.data[rowIndex].push(hsvThreshold(hsvPixel) || cybThreshold(cybPixel));
    }
    return binaryImage;
}

function hsvSkinDetection(width, height, image) {
    var binaryImage = new BinaryImage(height, width),
        length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var rgbPixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]);
        var hsvPixel = rgbToHsv(rgbPixel);
        var rowIndex = Math.floor((i / 4) / width);

        binaryImage.data[rowIndex].push(hsvThreshold(hsvPixel));
    }
    return binaryImage;
}

function cybSkinDetection(width, height, image) {
    var binaryImage = new BinaryImage(height, width),
        length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var rgbPixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]);
        var cybPixel = rgbTocyb(rgbPixel);
        var rowIndex = Math.floor((i / 4) / width);

        binaryImage.data[rowIndex].push(cybThreshold(cybPixel));
    }
    return binaryImage;
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

    foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    foregroundContext.drawImage(video, 0, 0, width, height);
    destinationContext = document.getElementById('resultCanvas').getContext('2d');
    // rbGaussianModel(width, height, imageData, destinationContext);
    //result = backgroundAndSkinDetection(width, height, BACKGROUND_DATA, imageData);
    result = hsvSkinDetection(width, height, imageData);
    printBinaryImage(result, width, height, destinationContext);
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
