var img_u8 = undefined,
    classifier = jsfeat.haar.frontalface,
    options = {
        min_scale: 2,
        scale_factor: 1.15,
        use_canny: false,
        edges_density: 0.13,
        equalize_histogram: true
    },
    max_work_size = 160;

var scale = Math.min(max_work_size / WIDTH, max_work_size / HEIGHT);
var w = (WIDTH * scale) | 0;
var h = (HEIGHT * scale) | 0;

function getFaceRect(width, height, video, context) {
    var ii_sum = new Int32Array((w + 1) * (h + 1)),
        ii_sqsum = new Int32Array((w + 1) * (h + 1)),
        ii_tilted = new Int32Array((w + 1) * (h + 1)),
        ii_canny = new Int32Array((w + 1) * (h + 1)),
        work_canvas = document.createElement('canvas');
    work_canvas.width = w;
    work_canvas.height = h;
    var work_ctx = work_canvas.getContext('2d');

    work_ctx.drawImage(video, 0, 0, work_canvas.width, work_canvas.height);
    var imageData = work_ctx.getImageData(0, 0, work_canvas.width, work_canvas.height);

    img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
    jsfeat.imgproc.grayscale(imageData.data, w, h, img_u8);

    // possible options
    if (options.equalize_histogram) {
        jsfeat.imgproc.equalize_histogram(img_u8, img_u8);
    }
    //jsfeat.imgproc.gaussian_blur(img_u8, img_u8, 3);

    jsfeat.imgproc.compute_integral_image(img_u8, ii_sum, ii_sqsum, classifier.tilted ? ii_tilted : null);

    if (options.use_canny) {
        jsfeat.imgproc.canny(img_u8, edg, 10, 50);
        jsfeat.imgproc.compute_integral_image(edg, ii_canny, null, null);
    }

    jsfeat.haar.edges_density = options.edges_density;
    var rects = jsfeat.haar.detect_multi_scale(ii_sum, ii_sqsum, ii_tilted, options.use_canny ? ii_canny : null, img_u8.cols, img_u8.rows, classifier, options.scale_factor, options.min_scale);
    rects = jsfeat.haar.group_rectangles(rects, 1);


    // draw only most confident one
    var rect = draw_faces(context, rects, width / img_u8.cols, 1);
    return rect;
}

function draw_faces(ctx, rects, sc, max) {
    var on = rects.length;
    if (on && max) {
        jsfeat.math.qsort(rects, 0, on - 1, function(a, b) {
            return (b.confidence < a.confidence);
        })
    }
    return new Rectangle(new Point(rects[0].x * sc | 0, rects[0].y * sc | 0), rects[0].width * sc | 0, rects[0].height * sc | 0);
    // rects[0];
    // var n = max || on;
    // n = Math.min(n, on);
    // var r;
    // for (var i = 0; i < n; ++i) {
    //     r = rects[i];
    //     ctx.strokeRect((r.x * sc) | 0, (r.y * sc) | 0, (r.width * sc) | 0, (r.height * sc) | 0);
    // }
}
