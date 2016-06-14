//Morphological operations

function erosion(element, binaryImage, lookupTable) {
    var resultImage = new BinaryImage(binaryImage.m, binaryImage.n),
        tempSize = Math.floor(element.size / 2);

    for (var i = tempSize; i < binaryImage.n - tempSize - 1; i++) {
        for (var j = tempSize; j < binaryImage.m - tempSize - 1; j++) {
            var sum = getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            if (sum === element.size * element.size) {
                resultImage.data[i].push(1);
            } else {
                resultImage.data[i].push(0);
            }
        }
    }
    return resultImage;
}

function dilation(element, binaryImage, lookupTable) {
    var resultImage = new BinaryImage(binaryImage.m, binaryImage.n),
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

function opening(binaryImage, lookupTable, erosionElement, dilationElement) {
    var resultImage = erosion(erosionElement, binaryImage, lookupTable);

    lookupTable = new BinaryLookupTableFromImage(resultImage);
    resultImage = dilation(dilationElement, resultImage, lookupTable);
    return resultImage;
}

function closing(binaryImage, lookupTable, erosionElement, dilationElement) {
    var resultImage = dilation(erosionElement, binaryImage, lookupTable);

    lookupTable = new BinaryLookupTableFromImage(resultImage);
    resultImage = erosion(dilationElement, resultImage, lookupTable);
    return resultImage;
}

function medianFilter(binaryImage, lookupTable, filterSize) {
    var resultImage = new BinaryImage(binaryImage.m, binaryImage.n),
        tempSize = Math.floor(filterSize / 2);

    for (var i = tempSize; i < binaryImage.n - tempSize - 1; i++) {
        for (var j = tempSize; j < binaryImage.m - tempSize - 1; j++) {
            var sum = getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            var value = sum / filterSize / filterSize;
            resultImage.data[i].push(Math.round(value));
        }
    }
    return resultImage;
}
//slower but with more optins than median filter
function binaryImageFilter(binaryImage, filter) {
    var resultImage = new BinaryImage(binaryImage.m, binaryImage.n),
        offset = Math.floor(filter.size / 2);

    for (var i = offset; i < binaryImage.n - offset; i++) {
        for (var j = offset; j < binaryImage.m - offset; j++) {
            var pixelSum = 0;
            for (var row = -offset; row <= offset; row++) {
                for (var col = -offset; col <= offset; col++) {
                    pixelSum += filter.data[row + offset][col + offset] * binaryImage.data[i + row][j + col];
                }
            }
            resultImage.data[i][j] = Math.floor(pixelSum);
        }
    }
    return resultImage;
}

function resizeImage(image, ratio) {
    var resultImage = new BinaryImage(image.m * ratio, image.n * ratio);
    for (var i = 0; i < resultImage.n; i++) {
        for (var j = 0; j < resultImage.m; j++) {
            var tempX = Math.floor(j / ratio),
                tempY = Math.floor(i / ratio);
            resultImage.data[i][j] = image.data[tempY][tempX];
        }
    }
    return resultImage;
}

function deleteConectedComponents(width, height, sparseImage, sizeThreshold) {
    var q = new Queue(),
        resultBinaryImage = new BinaryImage(width, height),
        resultSparseImage = new SparseBinaryImage(height),
        component = [], //pun indexurile la puncte
        // inQueue = [],
        labels = [],
        count = -1;

    while (count < sparseImage.size) {
        if (q.size === 0) {
            if (component.length >= sizeThreshold) {
                component.forEach(function(index) {
                    var point = sparseImage.getPointBasedOnIndex(index);
                    resultBinaryImage.data[point.y][point.x] = 1;
                });
            }

            count++;
            component = [];
            // inQueue = [];
            q.push(count)
        } else {
            var index = q.pop(),
                neighbours = undefined;
            if (labels[index] === true) continue;
            if (index > sparseImage.size) {
                throw new Error("wtf?");
            }
            labels[index] = true;
            component.push(index);
            neighbours = sparseImage.getNeighboursByIndex(index, function(tempIndex) {
                if (labels[tempIndex] === true) { // && !inQueue[tempIndex]) {
                    return false;
                }
                // inQueue[tempIndex] = true;
                return true;
            });

            q.pushArray(neighbours);
        }
    }

    for (var i = 0; i < height; i++) {
        resultBinaryImage.data[i].forEach(function(element, index) {
            resultSparseImage.add(i, index);
        });
    }
    return resultSparseImage;
}

function sequantialDeleteConectedComponents(width, height, sparseImage, sizeThreshold) {
    var indexLabel = [],
        labels = [],
        labelMap = [],
        l = 1,
        binaryImage = new BinaryImage(width, height),
        topPoint = new Point(width, height),
        leftPoint = new Point(width, height),
        bottomPoint = new Point(0, 0),
        rightPoint = new Point(0, 0);



    for (var i = 0; i < sparseImage.size; i++) {
        var currentPoint = sparseImage.getPointBasedOnIndex(i),
            top = indexLabel[sparseImage.getIndexBasedOnPoint(new Point(currentPoint.x, currentPoint.y - 1))],
            left = indexLabel[sparseImage.getIndexBasedOnPoint(new Point(currentPoint.x - 1, currentPoint.y))];

        if (top > 0 && (left === undefined || top === left)) {
            indexLabel[i] = top;
            labels[top].push(currentPoint);
            continue;
        }
        if (left > 0 && top === undefined) {
            indexLabel[i] = left;
            labels[left].push(currentPoint);
            continue;
        }
        if (left === undefined && top === undefined) {
            labels[l] = [];
            labelMap[l] = [];
            labels[l].push(currentPoint);
            indexLabel[i] = l;
            l++;
            continue;
        }

        if (top !== left) {
            labels[top].push(currentPoint);
            indexLabel[i] = top;
            labelMap[top].push(left);
            labelMap[left].push(top);
            continue;
        }
    }
    labels.forEach(function(arr, index) {
        if (arr.length >= sizeThreshold) {
            arr.forEach(function(point) {
                if (point.x < leftPoint.x) {
                    leftPoint = point;
                }
                if (point.x > rightPoint.x) {
                    rightPoint = point
                }
                if (point.y > bottomPoint.y) {
                    bottomPoint = point;
                }
                if (point.y < topPoint.y) {
                    topPoint = point;
                }
                // binaryImage.data[point.y][point.x] = 1;
            });
        } else {
            var sum = arr.length;
            labelMap[index].some(function(mapIndex) {
                sum += labels[mapIndex].length;
                if (sum >= sizeThreshold) {
                    arr.forEach(function(point) {
                        if (point.x < leftPoint.x) {
                            leftPoint = point;
                        }
                        if (point.x > rightPoint.x) {
                            rightPoint = point
                        }
                        if (point.y > bottomPoint.y) {
                            bottomPoint = point;
                        }
                        if (point.y < topPoint.y) {
                            topPoint = point;
                        }
                        // binaryImage.data[point.y][point.x] = 1;
                    });
                    return true;
                }
            })

        }

    });
    // return binaryImage;
    var rectPoint = new Point(leftPoint.x, topPoint.y);
    var rectWidth = rightPoint.x - leftPoint.x;
    var rectHeight = bottomPoint.y - topPoint.y;
    return { point: rectPoint, width: rectWidth, height: rectHeight };
}
