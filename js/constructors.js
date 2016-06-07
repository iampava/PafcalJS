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
