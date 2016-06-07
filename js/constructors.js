function BinaryImage(n, m) {
    this.n = n;
    this.m = m;
    this.data = [];
    for (var temp = 0; temp <= n; temp++) {
        this.data.push([]);
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
