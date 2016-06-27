//Morphological operations

function erosion(element, binaryImage, lookupTable) {
    var resultImage = new BinaryImage(binaryImage.m, binaryImage.n),
        tempSize = Math.floor(element.size / 2);

    for (var i = tempSize; i < binaryImage.n - tempSize - 1; i++) {
        for (var j = tempSize; j < binaryImage.m - tempSize - 1; j++) {
            var sum = getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            if (sum === element.size * element.size) {
                resultImage.data[i][j] = 1;
            } else {
                resultImage.data[i][j] = 0;
            }
        }
    }
    return resultImage;
}

function dilation(width, height, element, sparseImage, lookupTable) {
    var resultImage = new SparseBinaryImage(sparseImage.rowCount),
        binaryLookupTable = new BinaryLookupTable(width, height),
        tempSize = Math.floor(element.size / 2);


    for (var i = tempSize; i < height - tempSize - 1; i++) {
        for (var j = tempSize; j < width - tempSize - 1; j++) {
            var sum = getAreaValue(new Point(j - tempSize, i - tempSize), new Point(j + tempSize, i + tempSize), lookupTable);
            if (sum > 0) {
                resultImage.add(i, j);
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

function sequantialDeleteConectedComponents(sparseImage, sizeThreshold) {
   var indexLabel = [],
        labels = [],
        labelMap = [],
        resultImage = new SparseBinaryImage(sparseImage.rowCount),
        l = 1;

    for (var i = 0; i < sparseImage.size; i++) {
        var currentPoint = sparseImage.getPointBasedOnIndex(i),
            top = indexLabel[sparseImage.getIndexBasedOnPoint(new Point(currentPoint.x, currentPoint.y - 1))],
            left = indexLabel[sparseImage.getIndexBasedOnPoint(new Point(currentPoint.x - 1, currentPoint.y))];

        if (left === undefined && top === undefined) {
            labels[l] = 1;
            labelMap[l] = [];
            indexLabel[i] = l;
            l++;
            continue;
        }

        if (top > 0 && (left === undefined || top === left)) {
            labels[top]++;
            indexLabel[i] = top;
            continue;
        }

        if (left > 0 && top === undefined) {
            labels[left]++;
            indexLabel[i] = left;
            continue;
        }

        if (top !== left) {
            labels[top]++;
            indexLabel[i] = top;
            if (labelMap[top].indexOf(left) === -1) labelMap[top].push(left);
            if (labelMap[left].indexOf(top) === -1) labelMap[left].push(top);
            continue;
        }
    }

    for (var i = 0; i < sparseImage.size; i++) {
        var sum = labels[indexLabel[i]];
        if (sum >= sizeThreshold) {
            var point = sparseImage.getPointBasedOnIndex(i);
            resultImage.add(point.y, point.x);
            continue;
        }
        labelMap[indexLabel[i]].some(function(mapIndex) {
            sum += labels[mapIndex];
            if (sum >= sizeThreshold) {
                var point = sparseImage.getPointBasedOnIndex(i);
                resultImage.add(point.y, point.x);
                return true;
            }
        })
    }
    return resultImage;
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
        } else if (d < 0) {
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
        } else if (d > 0) {
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

function centroid(contour) {
    var cx = 0,
        cy = 0,
        signedArea = 0,
        temp = undefined;
    for (var i = 0; i < contour.size - 2; i++) {
        temp = contour.data[i].x * contour.data[i + 1].y - contour.data[i + 1].x * contour.data[i].y;
        cx += (contour.data[i].x + contour.data[i + 1].x) * temp;
        cy += (contour.data[i].y + contour.data[i + 1].y) * temp;
        signedArea += temp;
    }
    temp = contour.data[i].x * contour.data[0].y - contour.data[0].x * contour.data[i].y;
    cx += (contour.data[i].x + contour.data[0].x) * temp;
    cy += (contour.data[i].y + contour.data[0].y) * temp;
    signedArea += temp;

    signedArea /= 2;
    cx = cx / (6 * signedArea);
    cy = cy / (6 * signedArea);

    return new Point(cx, cy);
}

// function getContour(morphoElement, binaryImage, lookupTable) {
//     var contour = new Contour(),
//         erodedMatrix = erosion(morphoElement, binaryImage, lookupTable);
//     for (var i = 0; i < binaryImage.n; i++) {
//         for (var j = 0; j < binaryImage.m; j++) {
//             if (binaryImage.data[i][j] === 1 && erodedMatrix.data[i][j] !== 1) contour.add(new Point(j, i));
//         }
//     }
//     var orderedPixels = [contour.data[0]];
//     while (orderedPixels.length < contour.data.length) {
//         var currentLength = 1;
//         for (var j = 0; j < contour.size; j++) {
//             if (orderedPixels.indexOf(contour.data[j]) !== -1) continue;
//             if (neighbour_8(orderedPixels[orderedPixels.length - 1], contour.data[j])) {
//                 orderedPixels.push(contour.data[j]);
//                 break;
//             }

//         }
//         if (currentLength === orderedPixels.length) break;

//     }
//     contour.data = orderedPixels;
//     return contour;
// }
