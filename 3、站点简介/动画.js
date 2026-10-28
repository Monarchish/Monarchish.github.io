/* ===== 3、站点简介：随鼠标微微晃动 =====
   原生实现（不依赖 gsap/lenis，库挂了也照晃）。幅度很小，是「呼吸感」不是「跟手」。
   幅度调 data-sway（HTML 里）和下面的 22 / 16 两个系数。 */
(function () {
    /* 触屏没有鼠标，直接不启用 */
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var els = [].slice.call(document.querySelectorAll("[data-sway]"));
    if (!els.length) return;

    var tx = 0, ty = 0;   /* 目标偏移 */
    var cx = 0, cy = 0;   /* 当前偏移（缓动追赶目标） */
    var raf = null;

    function loop() {
        cx += (tx - cx) * 0.06;
        cy += (ty - cy) * 0.06;
        for (var i = 0; i < els.length; i++) {
            var d = parseFloat(els[i].getAttribute("data-sway")) || 1;
            els[i].style.transform =
                "translate3d(" + (cx * d).toFixed(2) + "px," + (cy * d).toFixed(2) + "px,0)";
        }
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
            raf = requestAnimationFrame(loop);
        } else {
            raf = null;
        }
    }

    window.addEventListener("mousemove", function (e) {
        tx = (e.clientX / window.innerWidth - 0.5) * 22;   /* 水平最大 ±11px */
        ty = (e.clientY / window.innerHeight - 0.5) * 16;  /* 垂直最大 ±8px */
        if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
})();
