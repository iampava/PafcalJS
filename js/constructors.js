function Point(x, y) {
    this.x = x;
    this.y = y;
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

function cybPixel(y, cb, cr) {
    this.y = y;
    this.cb = cb;
    this.cr = cr;
}

function RBPixel(r, b) {
    this.r = r;
    this.b = b;
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
