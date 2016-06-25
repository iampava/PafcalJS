function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Rectangle(point, width, height) {
    this.x = point.x;
    this.y = point.y;
    this.width = width;
    this.height = height;

    this.getMiddlePoint = function() {
        return new Point(this.x + width / 2, this.y + this.height / 2);
    }
    this.contains = function(point) {
        if (this.x <= point.x && point.x <= this.x + this.width && this.y <= point.y && point.y <= this.y + this.height) {
            return true;
        }
        return false;
    }
}

function Stack() {
    this.size = 0;
    this.topElement = { value: null, next: null };
    this.push = function(element) {
        var newElem = { value: element, next: this.topElement };
        this.topElement = newElem;
        this.size++;
    }
    this.top = function() {
        return this.topElement.value;
    }
    this.topTop = function() {
        if (this.topElement.next === null) return null;
        return this.topElement.next.value;
    }
    this.pop = function() {
        var value = this.topElement.value;
        this.topElement = this.topElement.next;
        this.size--;

        return value;
    }
}

//CSR method
function SparseBinaryImage(rows) {
    this.size = 0;
    this.rowCount = rows;
    this.row = [];
    this.col = [];

    this.add = function(row, col) {
        if (this.row[row] === undefined) {
            this.row[row] = this.size;
            var i = row - 1;
            while (i >= 0 && this.row[i] === undefined) {
                this.row[i] = this.size;
                i--;
            }
        }
        this.col.push(col);
        this.size++;
        this.row[row + 1] = this.size;

    }

    this.getIndexBasedOnPoint = function(point) {
        var rowOffset = this.row[point.y],
            rowLimit = this.row[point.y + 1];
        if (rowOffset === undefined) {
            return null;
        }
        if (rowLimit === undefined) {
            rowLimit = this.col.length;
        }
        for (var j = rowOffset; j < rowLimit; j++) {
            if (this.col[j] === point.x) return j;
        }
        return null;
    }

    this.getPointBasedOnIndex = function(index) {
        var col = this.col[index],
            left = 0,
            right = this.rowCount;

        while (left <= right) {
            var middle = Math.floor((left + right) / 2);

            if (this.row[middle] <= index && this.row[middle + 1] <= index) {
                left = middle + 1;
                continue;
            }
            if (this.row[middle] > index) {
                right = middle - 1;
                continue;
            }
            return new Point(col, middle);
        }
        throw new Error("Can't find point!");
    }
}

function BinaryLookupTable(width, height) {
    this.width = width;
    this.height = height;
    this.data = [];
    for (var temp = 0; temp < height; temp++) {
        this.data.push([]);
    }
    this.get = function(n, m) {
        if (this.data[n] === undefined) return 0;
        return this.data[n][m] || 0;
    }

    this.initFromSparse = function(sparseImage) {
        var result = null;

        for (var i = 0; i < height; i++) {
            for (var j = 0; j < width; j++) {
                result = this.get(i - 1, j);
                result += this.get(i, j - 1);
                result -= this.get(i - 1, j - 1);
                result += (sparseImage.getIndexBasedOnPoint(new Point(j, i))) ? 1 : 0;

                this.data[i].push(result);

            }
        }
    }
}


function RGBPixel(red, blue, green) {
    this.red = red;
    this.blue = blue;
    this.green = green;
}

function HSVPixel(hue, saturation, value) {
    while (hue <= 0) {
        hue += 360;
    }
    while (hue > 360) {
        hue -= 360;
    }
    this.h = hue;
    this.s = saturation;
    this.v = value;
}


function FullMorphoElement(size) {
    if (size % 2 === 0) {
        throw new Error("You cannot have an even structuring element!");
    }
    this.size = size;
    this.data = [];
    for (var i = 0; i < size; i++) {
        this.data.push([]);
        for (var j = 0; j < size; j++) {
            this.data[i].push(1);
        }
    }
}

/**************************************************************************
 **************************************************************************/

function _diffHelper(v, channel, diff) {
    return (v - channel) / 6 / diff + 1 / 2;
};

function hsvToRgb(pixel) {
    var v = pixel.v / 100,
        s = pixel.s / 100,
        c = v * s,
        x = c * (1 - Math.abs((Math.floor(pixel.h / 60)) % 2 - 1)),
        m = v - c,
        rr = undefined,
        gg = undefined,
        bb = undefined;
    if (0 <= pixel.h && pixel.h < 60) {
        rr = c;
        gg = x;
        bb = 0;
    } else if (60 <= pixel.h && pixel.h < 120) {
        rr = x;
        gg = c;
        bb = 0;
    } else if (120 <= pixel.h && pixel.h < 180) {
        rr = 0;
        gg = c;
        bb = x;
    } else if (180 <= pixel.h && pixel.h < 240) {
        rr = 0;
        gg = x;
        bb = c;
    } else if (240 <= pixel.h && pixel.h < 300) {
        rr = x;
        gg = 0;
        bb = c;
    } else if (300 < pixel.h && pixel.h <= 360) {
        rr = c;
        gg = 0;
        bb = x;
    }
    return new RGBPixel((rr + m) * 255, (gg + m) * 255, (bb + m) * 255);
}

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

