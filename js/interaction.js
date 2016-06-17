function clickOnPage(x, y) {
    var ev = document.createEvent("MouseEvent");
    ev.initMouseEvent(
        "click",
        true /* bubble */ , true /* cancelable */ ,
        window, null,
        x, y, 0, 0, /* coordinates */
        false, false, false, false, /* modifier keys */
        0 /*left*/ , null
    );
    var el = document.elementFromPoint(x, y);
    el.dispatchEvent(ev);
}

function detectHandStatus(convexHull, center, ctx) {

    var minDist = Infinity,
        maxDist = -Infinity,
        openStyle = "blue",
        closedStyle = "red";
    for (var i = 0; i < convexHull.length; i++) {
        var dist = pointDist(center, convexHull[i]);
        if (dist < minDist) minDist = dist;
        if (dist > maxDist) maxDist = dist;
    }

    if (maxDist <= 2 * minDist) {
        ctx.fillStyle = openStyle;
    } else {
        ctx.fillStyle = closedStyle;
    }
    ctx.fillRect(center.x - 5, center.y - 5, 10, 10);

}
