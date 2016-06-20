var pafcal = {}
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
    TRACKER_SIZE: 20,
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

pafcal.backgroundFrame = function(imageData) {
    for (var i = 0; i < imageData.data.length; i++) {
        pafcal.constants.BACKGROUND_DATA.data[i] += imageData[i];
    }
}

pafcal.background = function() {
    for (var i = 0; i < imageData.data.length; i++) {
        pafcal.constants.BACKGROUND_DATA.data[i] /= pafcal.constants.BACKGROUND_FRAMES;
    }
}

pafcal.face = function() {
    //detecteaza fata si trime-o la functia de mai jos
}

pafcal.background = function(width, height, background, image, faceRect) {
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

onmessage = function(e) {
    switch (e.data.type) {
        case 'CONFIG':
            pafcal.constants = e.data.data;
            break;
        case 'IMAGE':

            break;
        default:
            postMessage({ type: 'CLICK', data: { x: 400, y: 200 }, color: pafcal.constants.CLICK_COLOR });
            break;
    }

}
