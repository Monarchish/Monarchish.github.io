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

    /* ---- 大字「SHIJUNCHEN」左右顶满整屏 ----
       只改 font-size，绝不用 scaleX/scaleY 拉伸，所以字形比例、字距都不会变形。
       量的不是行盒宽度，而是「字形的真实墨迹宽度」：
       在 canvas 上按同一字体/字重/字距画一遍，逐像素扫出墨迹左右边界，
       连 S 左侧、N 右侧的留白都算进去，字号再按这个比例换算，
       视觉上正好贴住屏幕左右两边；字体晚到或回退系统字体都会自动重算。 */
    function fitStatement() {
        var txt = (word.textContent || "").trim();
        var avail = footer.clientWidth;
        if (!txt || !avail) return;
        var cs = getComputedStyle(word);
        var BASE = 200;                                                        /* 量测基准字号，越大越准 */
        var lsEm = parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) || 0; /* 字距换算成 em，与字号无关 */
        var inkW = 0, inkL = 0, inkTopEm = 0, inkBotEm = 0, ascEm = 0.75, descEm = 0.25;
        try {
            var cv = document.createElement("canvas");
            cv.width = BASE * (txt.length + 4);
            cv.height = Math.ceil(BASE * 2);
            var ctx = cv.getContext("2d");
            ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + BASE + "px " + cs.fontFamily;
            /* 注意顺序：先设 font 再设字距，赋值 font 会把字距重置掉 */
            if ("letterSpacing" in ctx) ctx.letterSpacing = (lsEm * BASE).toFixed(2) + "px";
            ctx.fillStyle = "#fff";
            ctx.textBaseline = "alphabetic";
            var baselineY = BASE * 1.4;
            ctx.fillText(txt, BASE, baselineY);
            var px = ctx.getImageData(0, 0, cv.width, cv.height).data;
            var minX = cv.width, maxX = -1, minY = cv.height, maxY = -1;
            for (var y = 0; y < cv.height; y++) {
                for (var x = 0; x < cv.width; x++) {
                    if (px[(y * cv.width + x) * 4 + 3] > 10) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (maxX > minX) {
                inkW = maxX - minX + 1;
                inkL = (minX - BASE) / BASE;              /* 字形左边缘相对排字起点的偏移（em） */
                inkTopEm = (minY - baselineY) / BASE;     /* 墨迹顶 / 底相对基线的偏移（em，顶为负） */
                inkBotEm = (maxY - baselineY) / BASE;
            }
            var fm = ctx.measureText(txt);
            if (fm.fontBoundingBoxAscent) {
                ascEm = fm.fontBoundingBoxAscent / BASE;
                descEm = fm.fontBoundingBoxDescent / BASE;
            }
        } catch (e) { inkW = 0; }
        if (!(inkW > 1)) {
            /* 兜底：量行盒推进宽度（含字距），再去掉两侧 side bearing 的估计值 */
            var probe = document.createElement("span");
            probe.textContent = txt;
            probe.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;white-space:nowrap;font-size:" + BASE + "px;";
            probe.style.fontFamily = cs.fontFamily;
            probe.style.fontWeight = cs.fontWeight;
            probe.style.fontStyle = cs.fontStyle;
            probe.style.letterSpacing = (lsEm * BASE).toFixed(2) + "px";
            document.body.appendChild(probe);
            inkW = probe.getBoundingClientRect().width - BASE * 0.06;
            document.body.removeChild(probe);
            inkL = 0.02;
        }
        if (!(inkW > 1)) return;
        var F = avail / (inkW / BASE);
        word.style.fontSize = F.toFixed(1) + "px";
        /* 字形的左侧留白 + 末尾字距会让「居中」两边不对称：
           干脆左对齐，再用负 text-indent 把墨迹左边缘顶到容器左边，
           墨迹宽度又正好等于容器宽 → 左右两边同时贴边，且没有任何拉伸变形。 */
        word.style.textAlign = "left";
        word.style.textIndent = (-inkL * F).toFixed(2) + "px";

        /* 垂直方向：字号这么大以后，行盒里 ascent/descent 的空白会让大写字母明显偏下，
           这里把「墨迹重心」摆到黑色区域正中（光学居中）。
           做法：先把 top 归零、摘掉滚动位移，量出盒子的真实排版位置（浏览器给单行文字
           还额外带了约 0.16em 的基线偏移，纯靠公式算不准），再把「墨迹顶部 = 盒顶 + 偏移」
           对到目标中心。每次都是绝对赋值，重复调用不会累加。 */
        var cs2 = getComputedStyle(word);
        var lh = parseFloat(cs2.lineHeight);
        if (!(lh > 0)) lh = F * 1.02;
        var inkTopFromBox = (lh - (ascEm + descEm) * F) / 2 + ascEm * F + inkTopEm * F;
        var inkH = (inkBotEm - inkTopEm) * F;

        var prevTop = word.style.top;
        var tf = word.style.transform;
        word.style.top = "0px";
        word.style.transform = "none";
        var boxTop = word.getBoundingClientRect().top;   /* 归零后的真实排版位置 */
        word.style.transform = tf;
        word.style.top = prevTop;

        var fRect = footer.getBoundingClientRect();
        var inkCenterY = boxTop + inkTopFromBox + inkH / 2;
        /* 手机（窄屏）上底栏换成两行、贴在黑块底部：若仍按整个黑块居中，
           大字下边距会被底栏吃掉，看着偏下。所以窄屏时把底栏高度从可用高度里扣掉，
           让大字在「看得见的空地」里居中；桌面底栏只有一行，维持原算法，位置不变。 */
        var narrow = !!(window.matchMedia && window.matchMedia("(max-width: 640px)").matches);
        var usableH = footer.clientHeight - (narrow && barWrap ? barWrap.offsetHeight : 0);
        var targetY = fRect.top + usableH / 2;
        word.style.position = "relative";
        word.style.top = (targetY - inkCenterY).toFixed(1) + "px";
    }
    /* 字体是异步/外部 CDN 取的：到了再量一次，取不到就用手上这套字体量 */
    var lastFooterH = 0;
    fitStatement();
    lastFooterH = footer.clientHeight;
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { fitStatement(); });
    }
    if (document.fonts && document.fonts.addEventListener) {
        document.fonts.addEventListener("loadingdone", function () { fitStatement(); });
    }

    function update() {
        ticking = false;
        /* 门面 pin / 字体到位都会改变页脚高度，高度一变就重算一次字号与居中
           （只在真正滚到页脚时才算，避免开屏就量到还没稳定的布局） */
        if (footer.clientHeight !== lastFooterH) {
            lastFooterH = footer.clientHeight;
            fitStatement();
        }
        var vh = window.innerHeight;
        var top = footer.getBoundingClientRect().top;
        /* 进度：0 = 页脚顶边刚碰视口底，1 = 完全就位。
           分母按「页脚自身高度」算而不是按视口高度：页脚只有 66vh 高，
           滚到页面尽头时它的顶边也只能到 0.34 屏，用 0.9 屏当分母永远到不了 1，
           大字会永久残留一截位移（字号越大偏得越多，肉眼就是偏下）。 */
        var denom = Math.min(footer.clientHeight, vh) * 0.9 || 1;
        var p = (vh - top) / denom;
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
    window.addEventListener("resize", function () { fitStatement(); onScroll(); });
    update();
})();
