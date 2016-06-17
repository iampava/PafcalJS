var globalVideo = undefined;

function modelBackground(video, width, height) {
    globalVideo = video;
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
                window.requestAnimationFrame(recognizeHand);
            }, 2000);
        }
    }, 1000);
}

function extractBackground(m, n, background, image) {
    var binaryImage = new BinaryImage(m, n),
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
    var isSkin = 0;

    if ((pixel.red > 95) && (pixel.green > 40) && (pixel.blue > 20) && (rgbMax(pixel) - rgbMin(pixel) > 15) &&
        (Math.abs(pixel.red - pixel.green) > 15) && (pixel.red > pixel.green) && (pixel.red > pixel.blue)) {
        isSkin = 1;
    }

    if ((pixel.red > 220) && (pixel.green > 210) && (pixel.blue > 170) && (Math.abs(pixel.red - pixel.green) <= 15) &&
        (pixel.red > pixel.blue) && (pixel.green > pixel.blue)) {
        isSkin = 1;
    }
    return isSkin;
}

function hsvSkinDetection(pixel) {
    if (isValueInRange(pixel.h, HSV_THRESHOLD.HUE) && isValueInRange(pixel.s, HSV_THRESHOLD.SATURATION) && isValueInRange(pixel.v, HSV_THRESHOLD.VALUE)) {
        return 1;
    }
    return 0;
}

function cybSkinDetection(pixel) {
    return 1;
}

function extractSkin(width, height, image) {
    var binaryImage = new BinaryImage(width, height),
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

function backgroundAndSkinDetection(width, height, background, image, faceRect) {
    var sparseImage = new SparseBinaryImage(height),
        binaryImage = new BinaryImage(width, height),
        binaryLookupTable = new BinaryLookupTable(width, height);
    length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var backgroundPixel = new RGBPixel(background.data[i], background.data[i + 1], background.data[i + 2]),
            imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]),
            rowIndex = Math.floor((i / 4) / width),
            colIndex = Math.floor((i / 4) % width);
        if (!faceRect) {
            logic = rgbSkinDetection(imagePixel) && hsvSkinDetection(rgbToHsv(imagePixel));
        } else {
            faceRect.y -= height / 2;
            faceRect.height *= 2;
            logic = !faceRect.contains(new Point(colIndex, rowIndex)) && rgbSkinDetection(imagePixel) && hsvSkinDetection(rgbToHsv(imagePixel));
        }

        if (logic) {
            sparseImage.add(rowIndex, colIndex);
            binaryImage.data[rowIndex][colIndex] = 1;

        }
        // binaryLookupTable.data[rowIndex].push(computeBinaryLookupValue(rowIndex, binaryImage.data[rowIndex].length - 1, logic, binaryLookupTable));
    }
    return { sparse: sparseImage, binary: binaryImage, table: binaryLookupTable };
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

function _merge(image, shape) {
    //put shape in top left corner
    for (var i = 0; i < shape.n; i++) {
        for (var j = 0; j < shape.m; j++) {
            if (shape.data[i][j] === 0) continue;
            image.data[i][j] = shape.data[i][j]
        }
    }
    return image;
}

function computeSSD(binaryImage, point, template) {
    var ssd = 0;
    for (var i = point.y; i < point.y + template.n; i++) {
        for (var j = point.x; j < point.x + template.m; j++) {
            if (binaryImage.data[i][j] !== template.data[i - point.y][j - point.x]) ssd++;
        }
    }
    return ssd;
}

function printRect(rect, ctx) {
    ctx.beginPath();
    ctx.lineWidth = "6";
    ctx.strokeStyle = "red";
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.stroke();
}

function printConvexHull(points, ctx) {
    ctx.beginPath();
    ctx.lineWidth = "6";
    ctx.strokeStyle = "red";
    ctx.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    var contour = {
        size: points.length,
        data: points
    };
    var center = centroid(contour);
    detectHandStatus(points, center, ctx);
    // ctx.fillRect(center.x - 5, center.y - 5, 10, 10);
}

function trackHand(width, height, rect, ctx) {
    if (rect === null) return;
    var middlePoint = rect.getMiddlePoint(),
        widthRatio = document.documentElement.clientWidth / width,
        heightRatio = document.documentElement.clientHeight / height,
        trackerX = (middlePoint.x - TRACKER_SIZE / 2) * widthRatio,
        trackerY = (middlePoint.y - TRACKER_SIZE / 2) * heightRatio;
    if (ctx) {
        ctx.beginPath();
        ctx.lineWidth = "6";
        ctx.strokeStyle = "red";
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
        ctx.stroke();
    }

    var tracker = document.getElementById("PAFCAL_TRACKER");
    tracker.style.display = "initial";
    tracker.style.left = trackerX + "px";
    tracker.style.top = trackerY + "px";

    if (rect.width * 1.4 >= rect.height) {
        clickOnPage(trackerX, trackerY);
    }
}

function recognizeHand() {
    window.requestAnimationFrame(recognizeHand);

    // function recognizeHand(video, width, height) {
    var video = globalVideo,
        width = WIDTH,
        height = HEIGHT;
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

    // var temp = new Date().getTime();
    // if (componentResult === null) return;
    // var elem = new FullMorphoElement(21);
    // var morphoElem = dilation(elem, componentResult.binary, result.table);

    // var final = new Date().getTime() - temp;
    // console.log("Time:", final, "Size: ", result.sparse.size);
    // console.log(afterThresh);
    // trackHand(width, height, componentResult.rect, destinationContext);
    if (!(video.readyState === video.HAVE_ENOUGH_DATA)) return null;
    foregroundContext.drawImage(video, 0, 0, width, height);
    // return;
    var faceRect = getFaceRect(width, height, video, destinationContext);
    result = backgroundAndSkinDetection(width, height, BACKGROUND_DATA, imageData, faceRect);
    var componentResult = sequantialDeleteConectedComponents(width, height, result.sparse, 300);
    // var blt = new BinaryLookupTableFromImage(componentResult.binary);
    // var dilationMatrix = dilation(new FullMorphoElement(11), componentResult.binary, blt);
    if (componentResult === null) return;

    // printBinaryImage(width, height, dilationMatrix, destinationContext);
    // printConvexHull(convexHull(dilationMatrix), destinationContext);

    printBinaryImage(width, height, componentResult.binary, destinationContext);
    printConvexHull(convexHull(componentResult.binary), destinationContext);

    // checkHandShape(width, height, morphoElem, foregroundContext);
    // templateSlideWindow(result.binary, resizeImage(BINARY_HAND_SHAPE, 9), foregroundContext);
}

function recognizeHandWithoutCanvas(video, width, height) {
    var tempCanvas = document.createElement('canvas'),
        imageData = undefined,
        result = undefined;

    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, width, height);
    imageData = tempCanvas.getContext('2d').getImageData(0, 0, width, height);


    result = backgroundAndSkinDetection(width, height, BACKGROUND_DATA, imageData);
    var rect = sequantialDeleteConectedComponents(width, height, result.sparse, 100);
    trackHand(width, height, rect);
}


function templateSlideWindow(image, template, ctx) {
    var min = Infinity,
        point = null;
    for (var i = 0; i < 300; i += 5) {
        for (var j = 0; j < 150; j += 5) {
            var ssd = computeSSD(image, new Point(j, i), template);
            if (ssd < min) {
                min = ssd;
                point = new Point(j, i);
            }
        }
    }
    ctx.beginPath();
    ctx.lineWidth = "6";
    ctx.strokeStyle = "red";
    ctx.rect(point.x, point.y, template.m, template.n);
    ctx.stroke();
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

/*function recognitionStep(width, height, point, context, table, ratio) {
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
}*/

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

    setUpTracker();
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

function capture() {
    var canvas = document.getElementById("resultCanvas");
    var img = canvas.toDataURL("image/png");

    // document.write('<img src="' + img + '"/>');
    window.location = canvas.toDataURL("image/png");
}
