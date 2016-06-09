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
            BACKGROUND_DATA.data = applyFilter(width, BACKGROUND_DATA, LOW_PASS_FILTER);
            console.log("DONE");
            setTimeout(function() {
                setInterval(function() {
                    console.log("ulala");
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

function rgbSkinDetection(pixel) {
    var isSkin = false;

    if ((pixel.red > 95) && (pixel.green > 40) && (pixel.blue > 20) && (rgbMax(pixel) - rgbMin(pixel) > 15) &&
        (Math.abs(pixel.red - pixel.green) > 15) && (pixel.red > pixel.green) && (pixel.red > pixel.blue)) {
        isSkin = true;
    }

    if ((pixel.red > 220) && (pixel.green > 210) && (pixel.blue > 170) && (Math.abs(pixel.red - pixel.green) <= 15) &&
        (pixel.red > pixel.blue) && (pixel.green > pixel.blue)) {
        isSkin = true;
    }
    return isSkin;
}

function hsvSkinDetection(pixel) {
    if (isValueInRange(pixel.h, HSV_THRESHOLD.HUE) && isValueInRange(pixel.s, HSV_THRESHOLD.SATURATION) && isValueInRange(pixel.v, HSV_THRESHOLD.VALUE)) {
        return true;
    }
    return false;
}

function cybSkinDetection(pixel) {
    return true;
}

function extractSkin(width, height, image) {
    var binaryImage = new BinaryImage(height, width),
        length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]),
            rowIndex = Math.floor((i / 4) / width);

        if (rgbSkinDetection(imagePixel) && hsvSkinDetection(rgbToHsv(imagePixel))) {
            binaryImage.data[rowIndex].push(true);
        } else {
            binaryImage.data[rowIndex].push(false);
        }
    }
    return binaryImage;
}

function backgroundAndSkinDetection(width, height, background, image) {
    var binaryImage = new BinaryImage(height, width),
        binaryLookupTable = new BinaryLookupTable(width, height);
    length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var backgroundPixel = new RGBPixel(background.data[i], background.data[i + 1], background.data[i + 2]),
            imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]),
            rowIndex = Math.floor((i / 4) / width),
            logic = rgbSkinDetection(imagePixel) && hsvSkinDetection(rgbToHsv(imagePixel));

        binaryImage.data[rowIndex].push(logic);
        binaryLookupTable.data[rowIndex].push(computeBinaryLookupValue(rowIndex, binaryImage.data[rowIndex].length - 1, logic, binaryLookupTable));
    }
    return { image: binaryImage, table: binaryLookupTable };
}

/*function rbGaussianModel(width, height, image, context) {
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
}*/




function findHand(image) {}

function recognizeHand(video, width, height) {
    var tempCanvas = document.createElement('canvas'),
        imageData = undefined,
        filteredData = undefined,
        foregroundContext = undefined,
        destinationContext = undefined,
        result = undefined;

    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, width, height);
    imageData = tempCanvas.getContext('2d').getImageData(0, 0, width, height);
    // filteredData = { data: applyFilter(width, imageData, LOW_PASS_FILTER) };


    foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    destinationContext = document.getElementById('resultCanvas').getContext('2d');

    result = backgroundAndSkinDetection(width, height, BACKGROUND_DATA, imageData);
    var elem = new FullMorphoElement(21);
    var morphoElem = erosion(elem, dilation(elem, result.image, result.table), result.table);
    printBinaryImage(result.image, width, height, destinationContext);
    printBinaryImage(morphoElem, width, height, foregroundContext);
    //slideWindow(width, height, foregroundContext, HAND_RATIO, result.table);
}


function slideWindow(width, height, context, ratio, table) {
    var imageData = context.getImageData(0, 0, width, height);
    for (var i = 0; i <= height - ratio.HEIGHT; i++) {
        for (var j = 0; j <= width - ratio.WIDTH; j++) {
            var point = new Point(j, i);

            if (recognitionStep(width, height, point, context, table, ratio)) {
                return true;
            }
        }
    }
    return false;
}

function recognitionStep(width, height, point, context, table, ratio) {
    var total = ratio.WIDTH * ratio.HEIGHT,
        detected = 0,
        secondPoint = new Point(point.x + ratio.WIDTH, point.y + ratio.HEIGHT);
    detected += getAreaValue(point, secondPoint, table);
    if (point.y == 400 && point.x == 600) {
        var temp = 0;
        temp++;
    }
    if (detected / total > 0.2) {
        printRectangle(width, height, point, secondPoint, context);
        return true;
    }
    return false;
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

function applyFilter(width, image, filter) {
    var imageData = image.data,
        dummyData = imageData.slice(),
        length = imageData.length - 4 * width,
        currentColumn = []

    //de pe randul 2 pana pe ultimul
    for (var i = width * 4; i < length; i += 4) {
        dummyData[i] = filterStep(width, imageData, i, filter)
        dummyData[i + 1] = filterStep(width, imageData, i + 1, filter)
        dummyData[i + 2] = filterStep(width, imageData, i + 2, filter)
    };
    return dummyData;
}

//3 x 3 filters
function filterStep(width, imageData, index, filter) {
    var result = 0,
        temp = index - (index % 4);
    if (temp % (width * 4) === 0 || (temp + 4) % (width * 4) === 0) {
        return imageData[index]
    };
    result += imageData[index - 4 * (width + 1)] * filter[0][0];
    result += imageData[index - 4 * width] * filter[0][1];
    result += imageData[index - 4 * (width - 1)] * filter[0][2];
    result += imageData[index - 4] * filter[1][0];
    result += imageData[index] * filter[1][1];
    result += imageData[index + 4] * filter[1][2];
    result += imageData[index + 4 * (width - 1)] * filter[2][0];
    result += imageData[index + 4 * width] * filter[2][1];
    result += imageData[index + 4 * (width + 1)] * filter[2][2];

    return result;
}

function setUp(width, height) {
    testCreationOfTableFromImage();
    return;

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
