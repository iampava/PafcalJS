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

// function deleteConectedComponents(binaryImage, sizeThreshold) {
//     var components = [],
//         count = 0,
//         labelImage = new BinaryImage(binaryImage.m, binaryImage.n),
//         resultImage = new BinaryImage(binaryImage.m, binaryImage.n);
//     for (var i = 0; i < binaryImage.n; i++) {
//         for (var j = 0; j < binaryImage.m; j++) {
//             resultImage.data[i] = binaryImage.data[i].slice();
//         }
//     }

    

//     //copied the matrix
//     for (var i = 0; i < n; i++) {
//         for (var j = 0; j < m; j++) {
//             if (binaryImage.data[i][j] === 0) continue;
//             if ('f') {
//                 labelImage.data[i][j] = 'f';
//                 continue;
//             }
//             for(all neightbours){
//                 q.push(neightbour);
//             }


//         }
//     }



// }
