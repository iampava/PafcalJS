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
                binaryImage.data[point.y][point.x] = 1;
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
                        binaryImage.data[point.y][point.x] = 1;
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
    if (rectWidth <= 0 || rectHeight <= 0) return null;
    return { rect: new Rectangle(rectPoint, rectWidth, rectHeight), binary: binaryImage };
}

function contrastStreching(width, height, imageData, context) {
    var newImageData = context.createImageData(width, height),
        min = Infinity,
        max = -Infinity;
    for (var i = 0; i < imageData.data.length; i += 4) {
        var hsvPixel = rgbToHsv(new RGBPixel(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]));
        if (hsvPixel.v < min) min = hsvPixel.v;
        if (hsvPixel.v > max) max = hsvPixel.v;
    }

    for (var i = 0; i < imageData.data.length; i += 4) {
        var hsvPixel = rgbToHsv(new RGBPixel(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]));
        hsvPixel.v = reMap(hsvPixel.v, min, max) * 100;
        if (hsvPixel.v < 2) {
            console.log("wut?")
        }
        var rgbPixel = hsvToRgb(hsvPixel);

        newImageData.data[i] = rgbPixel.red;
        newImageData.data[i + 1] = rgbPixel.green;
        newImageData.data[i + 2] = rgbPixel.blue;
        newImageData.data[i + 3] = 255;
    }
    return newImageData;
}

function convexHull(binaryImage) {
    var leftStack = new Stack(),
        rightStack = new Stack(),
        left = null,
        right = null,
        top = undefined,
        topTop = undefined,
        result = [];

    var foundRow = false,
        index = 0;
    while (!foundRow && index < binaryImage.n) {
        for (var j = 0; j < binaryImage.m; j++) {
            if (binaryImage.data[index][j] === 1) {
                foundRow = true;
                if (left === null || j < left.x) left = new Point(j, index);
                if (right === null || j > right.x) right = new Point(j, index);
            }
        }
        index++;
    }
    if (!foundRow) return [];
    rightStack.push(right);
    leftStack.push(left);


    for (var q = index; q < binaryImage.n; q++) {
        left = null;
        right = null;
        for (var j = 0; j < binaryImage.m; j++) {
            if (binaryImage.data[q][j] === 1) {
                if (left === null || j < left.x) left = new Point(j, q);
                if (right === null || j > right.x) right = new Point(j, q);
            }
        }
        if (left === null && right === null) continue;
        if (leftStack.size === 1 && rightStack.size === 1) {
            leftStack.push(left);
            rightStack.push(right);
            continue;
        }
        if (leftStack.size === 1) {
            leftStack.push(left);
        };
        if (rightStack.size === 1) {
            rightStack.push(right);
        }
        top = leftStack.top();
        topTop = leftStack.topTop();
        d = (left.x - top.x) * (topTop.y - top.y) - (left.y - top.y) * (topTop.x - top.x);
        if (d > 0) {
            while (leftStack.size >= 2) {
                top = leftStack.top();
                topTop = leftStack.topTop();
                d = (left.x - top.x) * (topTop.y - top.y) - (left.y - top.y) * (topTop.x - top.x);
                if (d > 0) {
                    leftStack.pop();
                } else break;
            }
            leftStack.push(left);
        } else {
            leftStack.push(left);
        }


        top = rightStack.top();
        topTop = rightStack.topTop();
        d = (right.x - top.x) * (topTop.y - top.y) - (right.y - top.y) * (topTop.x - top.x);
        if (d < 0) {
            while (rightStack.size >= 2) {
                top = rightStack.top();
                topTop = rightStack.topTop();
                d = (right.x - top.x) * (topTop.y - top.y) - (right.y - top.y) * (topTop.x - top.x);
                if (d < 0) {
                    rightStack.pop();
                } else break;
            }
            rightStack.push(right);
        } else {
            rightStack.push(right);
        }
    }
    var rightResult = [],
        leftResult = [];
    while (rightStack.top() !== null) {
        rightResult.push(rightStack.pop());
    }
    while (leftStack.top() !== null) {
        leftResult.push(leftStack.pop());
    }
    result = leftResult.concat(rightResult.reverse())
    return result;

}
