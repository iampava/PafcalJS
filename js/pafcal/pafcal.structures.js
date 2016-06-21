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

function Queue() {
    this.size = 0;
    this.first = {};
    this.last = this.first;

    this.push = function(element) {
        var llast = this.last;
        this.last = { value: element, next: null };
        llast.next = this.last;
        this.size++;
    }

    this.pushArray = function(array) {
        var _this = this;
        array.forEach(function(element) {
            _this.push(element);
        })
    }

    this.pop = function() {
        if (this.size === 0) {
            throw new Error("Queue is empty!");
        }
        var value = this.first.next.value;

        if (this.size === 1) {
            this.first = {};
            this.last = this.first;
        } else {
            this.first.next = this.first.next.next;
        }
        this.size--;

        return value;
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

function Filter(size, data) {
    if (this.size % 2 === 0) {
        throw new Error("Filter must be odd in size!");
    }
    this.size = size;
    this.data = data;
}

function BinaryImage(m, n) {
    this.n = n;
    this.m = m;
    this.data = [];
    for (var temp = 0; temp < n; temp++) {
        this.data.push([]);
    }
    this.fits = function(point) {
        if (point.x < 0 || point.x >= m) return false;
        if (point.y < 0 || point.y >= n) return false;
        return true;
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


    this.getNeighboursByIndex = function(index, testFunction) {
        var point = this.getPointBasedOnIndex(index),
            result = [],
            neighbours = [];

        // neighbours.push(new Point(point.x - 1, point.y - 1));
        neighbours.push(new Point(point.x, point.y - 1));
        // neighbours.push(new Point(point.x + 1, point.y - 1));
        neighbours.push(new Point(point.x - 1, point.y));

        neighbours.push(new Point(point.x + 1, point.y));
        // neighbours.push(new Point(point.x - 1, point.y + 1));
        neighbours.push(new Point(point.x, point.y + 1));
        // neighbours.push(new Point(point.x + 1, point.y + 1));

        for (var i = 0; i < neighbours.length; i++) {
            var found = this.getIndexBasedOnPoint(neighbours[i])
            if (found && testFunction(found)) result.push(found);
        }
        return result;
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
}

function BinaryLookupTableFromImage(image) {
    this.m = image.m;
    this.n = image.n;
    this.data = [];

    this.get = function(n, m) {
        if (this.data[n] === undefined) return 0;
        return this.data[n][m] || 0;
    }

    for (var i = 0; i < this.n; i++) {
        this.data.push([]);
        for (var j = 0; j < this.m; j++) {
            this.data[i].push(computeBinaryLookupValue(i, j, image.data[i][j], this));
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

function MorphoElement(size, matrix) {
    if (size % 2 === 0) {
        throw new Error("You cannot have an even structuring element!");
    }
    this.size = size;
    this.data = matrix;
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
