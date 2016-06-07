function _diffHelper(v, channel, diff) {
    return (v - channel) / 6 / diff + 1 / 2;
};

/*function rgbToHsv(rgbPixel) {
    var rr = undefined,
        gg = undefined,
        bb = undefined,
        h = undefined,
        s = undefined;

    var r = rgbPixel.red / 255,
        g = rgbPixel.green / 255,
        b = rgbPixel.blue / 255,
        v = Math.max(r, g, b),
        diff = v - Math.min(r, g, b);

    if (diff == 0) {
        h = s = 0;
    } else {
        s = diff / v;
        rr = _diffHelper(v, r, diff);
        gg = _diffHelper(v, g, diff);
        bb = _diffHelper(v, b, diff);

        if (r === v) {
            h = bb - gg;
        } else if (g === v) {
            h = (1 / 3) + rr - bb;
        } else if (b === v) {
            h = (2 / 3) + gg - rr;
        }
        if (h < 0) {
            h += 1;
        } else if (h > 1) {
            h -= 1;
        }
    }
    return new HSVPixel(Math.round(h * 360), Math.round(s * 100), Math.round(v * 100));
}*/

function rgbToHsv(pixel) {
    var r = pixel.red / 255,
        g = pixel.green / 255,
        b = pixel.blue / 255,
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        diff = max - min,
        h = undefined,
        s = undefined,
        v = undefined;
    //hue calculation
    v = max;
    s = (max == 0) ? 0 : (diff / max);
    if (diff === 0) {
        h = 0;
        return new HSVPixel(h, s, v);
    }
    if (max === r) {
        h = 60 * (((g - b) / diff) % 6);
        return new HSVPixel(h, s * 100, v * 100);
    }
    if (max === g) {
        h = 60 * ((b - r) / diff + 2);
        return new HSVPixel(h, s * 100, v * 100);
    }
    if (max === b) {
        h = 60 * ((r - g) / diff + 4);
        return new HSVPixel(h, s * 100, v * 100);
    }
}

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

function rgbThreshold(threshold, backgroundPixel, imagePixel) {
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

function hsvThreshold(hsvPixel) {
    if (isValueInRange(hsvPixel.h, HSV_THRESHOLD.HUE) && isValueInRange(hsvPixel.s, HSV_THRESHOLD.SATURATION) && isValueInRange(hsvPixel.v, HSV_THRESHOLD.VALUE)) {
        return true;
    }
    return false;
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
