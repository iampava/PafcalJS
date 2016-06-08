function binaryImageMultiplication(firstImage, secondImage) {
    if (firstImage.n !== secondImage.n || firstImage.m !== secondImage.m) {
        throw new Error("Matrixes are not the same size!")
    }
    var result = new BinaryImage(firstImage.n, firstImage.m);
    for (var i = 0; i < firstImage.n; i++) {
        for (var j = 0; j < firstImage.m; j++) {
            result.data[i][j] = firstImage.data[i][j] * secondImage.data[i][j];
        }
    }
    return result;
}

function printBinaryImage(image, width, height, context) {
    var imageData = context.getImageData(0, 0, width, height),
        length = imageData.data.length;
    for (var i = 0; i < length; i += 4) {
        var rowIndex = Math.floor(i / 4 / width);
        imageData.data[i + 3] = 255;
        imageData.data[i + 1] = image.data[rowIndex][((i / 4) - rowIndex * width) % width] ? 255 : 0;
        imageData.data[i + 0] = image.data[rowIndex][((i / 4) - rowIndex * width) % width] ? 0 : 255;
    }
    context.putImageData(imageData, 0, 0);
}


function backgroundThreshold(threshold, backgroundPixel, imagePixel) {
    //return true if the selected pixel is FOREGROUND
    if (Math.abs(backgroundPixel.red - imagePixel.red) < threshold) return false;
    if (Math.abs(backgroundPixel.blue - imagePixel.blue) < threshold) return false;
    if (Math.abs(backgroundPixel.green - imagePixel.green) < threshold) return false;
    return true;
}

function isValueInRange(value, range) {
    for (var i = 0; i < range.length; i++) {
        if (value >= range[i].MIN && value <= range[i].MAX) {
            return true;
        }
    }
    return false;
}

function cybThreshold(cybPixel) {
    if (isValueInRange(cybPixel.cb, CYB_THRESHOLD.CB) && isValueInRange(cybPixel.cr, CYB_THRESHOLD.CR)) {
        return true;
    }
    return false;
}

function rbLikelihood(rbPixel) {
    var mean = 0.5 * (rbPixel.r + rbPixel.b),
        cov = (rbPixel.r - mean) * (rbPixel.r - mean) + (rbPixel.b - mean) * (rbPixel.b - mean),
        likelihood = undefined;
    if (cov === 0) {
        cov = 0.0001;
    }
    var rTemp = ((rbPixel.r - mean) / 2) / cov,
        bTemp = ((rbPixel.b - mean) / 2) / cov;

    likelihood = Math.pow(Math.E, rTemp * (rbPixel.r - mean) + bTemp * (rbPixel.b - mean));
    return likelihood;
}

function rgbMax(pixel) {
    return Math.max(pixel.red, pixel.green, pixel.blue);
}

function rgbMin(pixel) {
    return Math.min(pixel.red, pixel.green, pixel.blue);
}
