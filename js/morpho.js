//Morphological operations
function erosion(element, binaryImage, lookupTable) {
    var resultImage = new BinaryImage(binaryImage.n, binaryImage.m),
        tempSize = Math.floor(element.size / 2);

    for (var i = tempSize; i < binaryImage.n - tempSize - 1; i++) {
        for (var j = tempSize; j < binaryImage.m - tempSize - 1; j++) {
            var sum = getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            if (sum > element.size * element.size / 2) {
                resultImage.data[i].push(1);
            } else {
                resultImage.data[i].push(0);
            }
        }
    }
    return resultImage;
}

function dilation(element, binaryImage, lookupTable) {
    var resultImage = new BinaryImage(binaryImage.n, binaryImage.m),
        tempSize = Math.floor(element.size / 2);

    for (var i = tempSize; i < binaryImage.n - tempSize - 1; i++) {
        for (var j = tempSize; j < binaryImage.m - tempSize - 1; j++) {
            var sum = getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            if (sum > 0) {
                resultImage.data[i].push(1);
            } else {
                resultImage.data[i].push(0);
            }
        }
    }
    return resultImage;
}
