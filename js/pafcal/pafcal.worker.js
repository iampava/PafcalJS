var pafcal = {}
pafcal.constants = {
    WIDTH: 640,
    HEIGHT: 480,
    BACKGROUND_THRESHOLD: 10,
    HD_CONSTRAINTS: {
        video: {
            mandatory: {
                minWidth: 1280,
                minHeight: 720
            }
        }
    },
    BACKGROUND_FRAMES: 20,
    TRACKER_SIZE: 20,
    HSV_THRESHOLD: {
        HUE: [{
            MIN: 0,
            MAX: 25
        }, {
            MIN: 230,
            MAX: 360
        }],
        SATURATION: [{
            MIN: 0,
            MAX: 100
        }],
        VALUE: [{
            MIN: 0,
            MAX: 100
        }]
    },
    MOVE_COLOR: '#00CC66',
    CLICK_COLOR: '#0080FF',
    MISS_COLOR: '#FF8000',
    BACKGROUND_COLOR: '#C0C0C0',
    BACKGROUND_SUBSTRACTION: true,
    BACKGROUND_DATA: {
        data: []
    }
}




pafcal.start = function() {
    if (pafcal.constants.BACKGROUND_SUBSTRACTION === true) {
        pafcal.background();
    }
}

pafcal.configure = function() {
    for (var property in object) {
        if (object.hasOwnProperty(property) && pafcal.constants.hasOwnProperty(property)) {
            pafcal.constants[property] = object[property];
        }
    }
    postMessage({ type: 'CONFIG', data: null });
}



pafcal.notifyBackground = function() {

}
pafcal.background = function() {
    var seconds = 5,
        interval = null;

    interval = self.setInterval(function() {
        postMessage({ type: 'BACKGROUND_SECOND', data: seconds });
        if (seconds === 0) clearInterval(interval);
        seconds--;

    }, 1000)
}

pafcal.modelBackground = function(imageData) {
    for (var i = 0; i < imageData.data.length; i++) {
        pafcal.constants.BACKGROUND_DATA.data[i] += imageData.data[i];
    }
}




onmessage = function(e) {

    switch (e.data.type) {
        case 'START':
            pafcal.start();
            break;
        case 'CONFIG':
            pafcal.configure(e.data.data);
            break;
        case 'BACKGROUND_IMAGE':
            pafcal.modelBackground(e.data.data);
            break;
        case 'IMAGE':
            pafcal.faceDetection();
            break;
        case 'BACKGROUND_FINISH':
            var temp = new Uint8ClampedArray(pafcal.constants.WIDTH * pafcal.constants.HEIGHT * 4);
            for (var i = 0; i < pafcal.constants.BACKGROUND_DATA.data.length; i++) {
                temp[i] = pafcal.constants.BACKGROUND_DATA.data[i] / pafcal.constants.BACKGROUND_FRAMES;
            }
            pafcal.constants.BACKGROUND_DATA.data = temp;
            break;
        default:
            postMessage({ type: 'CLICK', data: { x: 400, y: 200 }, color: pafcal.constants.CLICK_COLOR });
            break;
    }

}



pafcal.faceDetection = function(image) {
    //detecteaza fata si trime-o la functia de mai jos
    pafcal.filter(image, null);

}


pafcal.filter = function(width, height, image, faceRect) {
    var sparseImage = new SparseBinaryImage(height),
        binaryImage = new BinaryImage(width, height),
        binaryLookupTable = new BinaryLookupTable(width, height);
    length = image.data.length;
    for (var i = 0; i < length; i += 4) {
        var backgroundPixel = new RGBPixel(background.data[i], background.data[i + 1], background.data[i + 2]),
            imagePixel = new RGBPixel(image.data[i], image.data[i + 1], image.data[i + 2]),
            rowIndex = Math.floor((i / 4) / width),
            colIndex = Math.floor((i / 4) % width);
        if (!faceRect) {
            logic = rgbSkinDetection(imagePixel) && hsvSkinDetection(rgbToHsv(imagePixel));
        } else {
            faceRect.y -= height / 2;
            faceRect.height *= 2;
            logic = !faceRect.contains(new Point(colIndex, rowIndex)) && rgbSkinDetection(imagePixel) && hsvSkinDetection(rgbToHsv(imagePixel));
        }

        if (logic) {
            sparseImage.add(rowIndex, colIndex);
            binaryImage.data[rowIndex][colIndex] = 1;

        }
        // binaryLookupTable.data[rowIndex].push(computeBinaryLookupValue(rowIndex, binaryImage.data[rowIndex].length - 1, logic, binaryLookupTable));
    }
    return { sparse: sparseImage, binary: binaryImage, table: binaryLookupTable };
    pafcal.morpho();

}

pafcal.morpho = function(width, height, binaryImage, lookupTable) {
    pafcal.delete();
}

pafcal.delete = function(width, height, sparseImage, sizeThreshold) {
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
                binaryImage.data[point.y][point.x] = 1;
            });
        } else {
            var sum = arr.length;
            labelMap[index].some(function(mapIndex) {
                sum += labels[mapIndex].length;
                if (sum >= sizeThreshold) {
                    arr.forEach(function(point) {
                        binaryImage.data[point.y][point.x] = 1;
                    });
                    return true;
                }
            })

        }

    });

    return { binary: binaryImage };
    pafcal.convexHull();
}
pafcal.convexHull = function(binaryImage) {
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
pafcal.centroid = function(contour) {
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

pafcal.decide = function() {

}
