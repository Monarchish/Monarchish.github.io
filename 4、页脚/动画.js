/* ===== 4、页脚动画：inversa 同款滚动滑出（全部原生，不依赖库） =====
   ① 大字：页脚滚进来时从下往上升起（inversa 的 INVERSA 字标同款），
      由 overflow:hidden 裁切，滚到哪升到哪，跟手。
   ② 角标：大字基本就位后（进度 55% 起）从右下滑出来。
   JS 不跑时页面照常完整显示（初始状态由 JS 自己设，不藏在 CSS 里）。 */
(function () {
    var footer = document.querySelector(".site-footer");
    var word = document.querySelector(".footer-statement");
    var note = document.querySelector(".footer-note");
    if (!footer || !word) return;
    if (note) note.style.willChange = "transform, opacity";

    var RISE = 60;      /* 大字起始下沉量（占自身高度的百分比） */
    var ticking = false;

    function update() {
        ticking = false;
        var vh = window.innerHeight;
        var top = footer.getBoundingClientRect().top;
        /* 进度：0 = 页脚顶边刚碰视口底，1 ≈ 滚满 0.9 屏后完全就位 */
        var p = (vh - top) / (vh * 0.9);
        if (p <= 0) {
            word.style.transform = "translate3d(0," + RISE + "%,0)";
            if (note) { note.style.opacity = "0"; note.style.transform = "translate3d(0,24px,0)"; }
            return;
        }
        if (p >= 1) {
            word.style.transform = "translate3d(0,0,0)";
            if (note) { note.style.opacity = "1"; note.style.transform = "translate3d(0,0,0)"; }
            return;
        }
        word.style.transform = "translate3d(0," + ((1 - p) * RISE).toFixed(2) + "%,0)";
        if (note) {
            var np = Math.min(1, Math.max(0, (p - 0.55) / 0.35));
            note.style.opacity = np.toFixed(3);
            note.style.transform = "translate3d(0," + ((1 - np) * 24).toFixed(1) + "px,0)";
        }
    }
    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
})();
