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

function clickButton(e) {
    console.log(e);
    console.log("click");
}
