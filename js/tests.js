function filterTest() {
    var image = {
        data: [11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11,
            11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11
        ]
    }
    console.log(applyFilter(4, 4, image, LOW_PASS_FILTER));
}

function testFilterApplication(initialData, filteredData) {
    var count = 0;
    if (initialData.length !== filteredData.length) return true;
    for (var i = 0; i < initialData.length; i++) {
        if (initialData[i] !== filteredData[i]) count++;
    }
    return count;
}

/*function testRectanglePrint() {
    var point = new Point(0, 0),
        secondPoint = new Point(1280, 720),
        foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    printRectangle(1280, 720, point, secondPoint, foregroundContext);
}*/

/*function testSlideWindow() {
    var foregroundContext = document.getElementById('foregroundCanvas').getContext('2d');
    slideWindow(100, 322, foregroundContext, HAND_RATIO)
}*/

/*function testTableCreation(width, height) {
    var table = new BinaryLookupTable(width, height);
    table.data[0].push(computeBinaryLookupValue(0, 0, true, table));
    table.data[0].push(computeBinaryLookupValue(0, 1, false, table));
    table.data[0].push(computeBinaryLookupValue(0, 2, true, table));
    table.data[0].push(computeBinaryLookupValue(0, 3, true, table));
    table.data[0].push(computeBinaryLookupValue(0, 4, true, table));

    table.data[1].push(computeBinaryLookupValue(1, 0, false, table));
    table.data[1].push(computeBinaryLookupValue(1, 1, true, table));
    table.data[1].push(computeBinaryLookupValue(1, 2, false, table));
    table.data[1].push(computeBinaryLookupValue(1, 3, false, table));
    table.data[1].push(computeBinaryLookupValue(1, 4, false, table));

    table.data[2].push(computeBinaryLookupValue(2, 0, false, table));
    table.data[2].push(computeBinaryLookupValue(2, 1, false, table));
    table.data[2].push(computeBinaryLookupValue(2, 2, true, table));
    table.data[2].push(computeBinaryLookupValue(2, 3, true, table));
    table.data[2].push(computeBinaryLookupValue(2, 4, false, table));
}*/

function testErosion() {
    var elem = new FullMorphoElement(3);
    var binaryImage = {
        n: 5,
        m: 5,
        data: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    }
    var table = new BinaryLookupTable(5, 5);
    table.data = [
        [1, 2, 3, 4, 5],
        [2, 4, 6, 8, 10],
        [3, 6, 9, 12, 15],
        [4, 8, 12, 16, 20],
        [5, 10, 15, 20, 25]
    ]
    console.log(erosion(elem, binaryImage, table));
}

function testCreationOfTableFromImage() {
    var binaryImage = {
        n: 5,
        m: 5,
        data: [
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]
        ]
    }
    console.log(new BinaryLookupTableFromImage(binaryImage));
}

function testResizeImage() {
    var image = new BinaryImage(3, 3);
    image.data = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
    ];
    console.log(resizeImage(image, 2));
}

function _binaryImageFromImage(width, height, imageData) {
    var binaryImage = new BinaryImage(width, height);
    for (var i = 0; i < imageData.length; i += 4) {
        var rowIndex = Math.floor((i / 4) / width),
            logic = (imageData[i + 1] === 255) ? 0 : 1;
        binaryImage.data[rowIndex].push(logic);
    }
    return binaryImage;
}

function noiseReductionTest() {
    var foregroundContext = document.getElementById('foregroundCanvas').getContext('2d'),
        destinationContext = document.getElementById('resultCanvas').getContext('2d'),
        img = new Image(),
        width = 1280,
        height = 720;

    img.addEventListener("load", function() {
        destinationContext.drawImage(img, 0, 0);

        // var result = backgroundAndSkinDetection(width, height, { data: [] }, destinationContext.getImageData(0, 0, width, height));

        var binaryImage = _binaryImageFromImage(width, height, destinationContext.getImageData(0, 0, width, height).data),
            table = new BinaryLookupTableFromImage(binaryImage),
            erosionElement = new FullMorphoElement(5),
            dilationElement = new FullMorphoElement(5),
            filter = new Filter(3, LOW_PASS_FILTER);

        // var resultImage = medianFilter(binaryImage, table, 13);
        var resultImage = deleteConectedComponents(binaryImage, 3000);
        // var resultImage = binaryImageFilter(binaryImage, filter);

        printBinaryImage(resultImage, width, height, foregroundContext);
    }, false);
    img.src = '../images/test.png'; // Set source path
}


function testContrastStreching() {
    var foregroundContext = document.getElementById('foregroundCanvas').getContext('2d'),
        destinationContext = document.getElementById('resultCanvas').getContext('2d'),
        img = new Image(),
        width = 800,
        height = 600;

    img.addEventListener("load", function() {
        destinationContext.drawImage(img, 0, 0);
        var imageData = destinationContext.getImageData(0, 0, width, height);
        var newImageData = contrastStreching(width, height, imageData, foregroundContext);
        foregroundContext.putImageData(newImageData, 0, 0);
    }, false);
    img.src = '../images/contrast.jpg'; // Set source path
}

function testConvexHull() {
    // var binaryImage = new BinaryImage(3, 3);
    // binaryImage.data[0][0] = 1;
    // binaryImage.data[2][0] = 1;
    // binaryImage.data[1][2] = 1;
    // binaryImage.data[1][1] = 1;
    var destinationContext = document.getElementById("resultCanvas").getContext('2d');
    destinationContext.beginPath();
    destinationContext.lineWidth = "6";
    destinationContext.strokeStyle = "red";

    var result = convexHull(resizeImage(BINARY_HAND_SHAPE, 9));
    printConvexHull(result, destinationContext);
}

function testCentroid() {
    var contourArray = [new Point(2, 2), new Point(4, 2), new Point(4, 0), new Point(3, -1), new Point(2, 0)],
        contour = { size: 5, data: contourArray };
    var center = centroid(contour);
    console.log(center);
}

function testGetContour() {
    var ctx = document.getElementById('resultCanvas').getContext('2d');
    var binaryImage = resizeImage(BINARY_HAND_SHAPE, 9);
    var lookupTable = new BinaryLookupTableFromImage(binaryImage);

    var contour = getContour(new FullMorphoElement(3), binaryImage, lookupTable);
    // printBinaryImage(640, 480, binaryImage, ctx);
    ctx.beginPath();
    ctx.lineWidth = "1";
    ctx.strokeStyle = "green";
    ctx.moveTo(contour.data[0].x, contour.data[0].y);
    for (var i = 1; i < contour.data.length; i++) {
        // ctx.fillRect(contour.data[i].x, contour.data[i].y, 1, 1);
        ctx.lineTo(contour.data[i].x, contour.data[i].y);
    }
    ctx.closePath();
    ctx.stroke();

}

function testDrawImage() {
    var image = resizeImage(BINARY_HAND_SHAPE, 3);
    var ctx = document.getElementById('resultCanvas').getContext('2d');

    printBinaryImage(600, 480, image, ctx);
}

/////////////////////////
function testStep1() {
    var backgroundCanvas = document.getElementById("backCanvas"),
        imageCanvas = document.getElementById("resultCanvas"),
        destinationCanvas = document.getElementById("videoCanvas");
    var backCtx = backgroundCanvas.getContext("2d"),
        ctx = imageCanvas.getContext("2d"),
        destCtx = destinationCanvas.getContext("2d");

    back = new Image();
    back.src = "../images/background.jpg";
    setTimeout(function() {
        img = new Image(),
            width = 640,
            height = 480;

        img.addEventListener("load", function() {
            ctx.drawImage(img, 0, 0, width, height);
            backCtx.drawImage(back, 0, 0, width, height);

            var image = ctx.getImageData(0, 0, width, height)
            var background = backCtx.getImageData(0, 0, width, height);
            var step1 = backgroundAndSkinDetection(width, height, background, image)
            printSparseImage(width, height, step1.sparse, destCtx);
        }, false);
        img.src = '../images/foreground.jpg'; // Set source path
    }, 1000);

}

function testStep2() {
    var backgroundCanvas = document.getElementById("backCanvas"),
        imageCanvas = document.getElementById("resultCanvas"),
        destinationCanvas = document.getElementById("videoCanvas");
    var backCtx = backgroundCanvas.getContext("2d"),
        ctx = imageCanvas.getContext("2d"),
        destCtx = destinationCanvas.getContext("2d");

    back = new Image();
    back.src = "../images/background.jpg";
    setTimeout(function() {
        img = new Image(),
            width = 640,
            height = 480;

        img.addEventListener("load", function() {
            ctx.drawImage(img, 0, 0, width, height);
            backCtx.drawImage(back, 0, 0, width, height);

            var image = ctx.getImageData(0, 0, width, height)
            var background = backCtx.getImageData(0, 0, width, height);
            var step1 = backgroundAndSkinDetection(width, height, background, image)
            printSparseImage(width, height, step1.sparse, destCtx);
        }, false);
        img.src = '../images/foreground.jpg'; // Set source path
    }, 1000);
}

function testStep3() {
    var backgroundCanvas = document.getElementById("backCanvas"),
        imageCanvas = document.getElementById("resultCanvas"),
        destinationCanvas = document.getElementById("videoCanvas");
    var backCtx = backgroundCanvas.getContext("2d"),
        ctx = imageCanvas.getContext("2d"),
        destCtx = destinationCanvas.getContext("2d");

    back = new Image();
    back.src = "../images/background.jpg";
    setTimeout(function() {
        img = new Image(),
            width = 640,
            height = 480;

        img.addEventListener("load", function() {
            ctx.drawImage(img, 0, 0, width, height);
            backCtx.drawImage(back, 0, 0, width, height);

            var image = ctx.getImageData(0, 0, width, height)
            var background = backCtx.getImageData(0, 0, width, height);
            var faceRect = getFaceRect(width, height, imageCanvas, ctx);
            var step1 = backgroundAndSkinDetection(width, height, background, image, faceRect)
            printSparseImage(width, height, step1.sparse, destCtx);
        }, false);
        img.src = '../images/foreground.jpg'; // Set source path
    }, 1000);

}

function testStep4() {
    var backgroundCanvas = document.getElementById("backCanvas"),
        imageCanvas = document.getElementById("resultCanvas"),
        destinationCanvas = document.getElementById("videoCanvas");
    var backCtx = backgroundCanvas.getContext("2d"),
        ctx = imageCanvas.getContext("2d"),
        destCtx = destinationCanvas.getContext("2d");

    back = new Image();
    back.src = "../images/background.jpg";
    setTimeout(function() {
        img = new Image(),
            width = 640,
            height = 480;

        img.addEventListener("load", function() {
            ctx.drawImage(img, 0, 0, width, height);
            backCtx.drawImage(back, 0, 0, width, height);

            var image = ctx.getImageData(0, 0, width, height)
            var background = backCtx.getImageData(0, 0, width, height);
            var faceRect = getFaceRect(width, height, imageCanvas, ctx);
            var step1 = backgroundAndSkinDetection(width, height, background, image, faceRect)
            var morphoElement = new FullMorphoElement(7),
                dilationResult = null;

            dilationResult = dilation(width, height, morphoElement, step1.sparse, step1.table);
            printSparseImage(width, height, dilationResult, destCtx);
        }, false);
        img.src = '../images/foreground.jpg'; // Set source path
    }, 1000);

}

function testStep5() {
    var backgroundCanvas = document.getElementById("backCanvas"),
        imageCanvas = document.getElementById("resultCanvas"),
        destinationCanvas = document.getElementById("videoCanvas");
    var backCtx = backgroundCanvas.getContext("2d"),
        ctx = imageCanvas.getContext("2d"),
        destCtx = destinationCanvas.getContext("2d");

    back = new Image();
    back.src = "../images/background.jpg";
    setTimeout(function() {
        img = new Image(),
            width = 640,
            height = 480;

        img.addEventListener("load", function() {
            ctx.drawImage(img, 0, 0, width, height);
            backCtx.drawImage(back, 0, 0, width, height);

            var image = ctx.getImageData(0, 0, width, height)
            var background = backCtx.getImageData(0, 0, width, height);
            var faceRect = getFaceRect(width, height, imageCanvas, ctx);
            var step1 = backgroundAndSkinDetection(width, height, background, image, faceRect)
            var morphoElement = new FullMorphoElement(7),
                dilationResult = null;

            dilationResult = dilation(width, height, morphoElement, step1.sparse, step1.table);
            var componentResult = sequantialDeleteConectedComponents(dilationResult, 0);
            if (componentResult === null) return;


            printSparseImage(width, height, componentResult, destCtx);
            // printSparseImage(width, height, dilationResult, destCtx);
        }, false);
        img.src = '../images/foreground.jpg'; // Set source path
    }, 1000);
}
