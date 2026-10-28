/* ===== 4、页脚动画：inversa 同款滚动滑出（全部原生，不依赖库） =====
   ① 大字：页脚滚进来时从下往上升起（inversa 的 INVERSA 字标同款），
      滚到哪升到哪，跟手。
   ② 底部横条：黑色 2/3 屏走完后，横条从底部浮上来（inversa 的
      ©2025 INVERSA 底栏同款），由 overflow:hidden 外框裁切。
   JS 不跑时页面照常完整显示（初始状态由 JS 自己设，不藏在 CSS 里）。 */
(function () {
    var footer = document.querySelector(".site-footer");
    var word = document.querySelector(".footer-statement");
    var barWrap = document.querySelector(".footer-bar-wrap");
    var bar = document.querySelector(".footer-bar");
    if (!footer || !word) return;
    if (bar) bar.style.willChange = "transform";

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
        } else if (p >= 1) {
            word.style.transform = "translate3d(0,0,0)";
        } else {
            word.style.transform = "translate3d(0," + ((1 - p) * RISE).toFixed(2) + "%,0)";
        }

        /* 横条浮上：页脚是页面最后一段，条顶边最多升到「视口底减条高」。
           分母用条高的 85%：body 默认 8px margin 等会吃掉一点进度，
           留容差保证滚到页面尽头时一定完全浮出 */
        if (barWrap && bar) {
            var box = barWrap.getBoundingClientRect();
            var bp = (vh - box.top) / ((box.height || 56) * 0.85);
            if (bp <= 0) {
                bar.style.transform = "translate3d(0,105%,0)";
            } else if (bp >= 1) {
                bar.style.transform = "translate3d(0,0,0)";
            } else {
                bar.style.transform = "translate3d(0," + ((1 - bp) * 105).toFixed(2) + "%,0)";
            }
        }
    }
    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
})();
