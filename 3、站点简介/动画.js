/* ===== 3、站点简介：随鼠标微微晃动 + 图片滚动视差 =====
   全部原生实现（不依赖 gsap/lenis，库挂了照常工作）。
   ① 鼠标晃动：幅度很小，是「呼吸感」不是「跟手」。幅度调 data-sway 和 22/16 两个系数。
   ② 滚动视差：inversa 同款——图片比遮罩框高 16%，随滚动在框内上下平移。 */
(function () {
    /* ---------- ① 鼠标晃动（触屏自动禁用） ---------- */
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var els = [].slice.call(document.querySelectorAll("[data-sway]"));
    if (fine && els.length) {
        var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
        function loop() {
            cx += (tx - cx) * 0.06;
            cy += (ty - cy) * 0.06;
            for (var i = 0; i < els.length; i++) {
                var d = parseFloat(els[i].getAttribute("data-sway")) || 1;
                els[i].style.transform =
                    "translate3d(" + (cx * d).toFixed(2) + "px," + (cy * d).toFixed(2) + "px,0)";
            }
            raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05)
                ? requestAnimationFrame(loop) : null;
        }
        window.addEventListener("mousemove", function (e) {
            tx = (e.clientX / window.innerWidth - 0.5) * 22;
            ty = (e.clientY / window.innerHeight - 0.5) * 16;
            if (!raf) raf = requestAnimationFrame(loop);
        }, { passive: true });
    }

    /* ---------- ② 滚动视差 ---------- */
    var assets = [].slice.call(document.querySelectorAll(".value-asset img"));
    if (!assets.length) return;
    var ticking = false;
    function parallax() {
        ticking = false;
        var vh = window.innerHeight;
        for (var i = 0; i < assets.length; i++) {
            var box = assets[i].parentElement.getBoundingClientRect();
            if (box.bottom < -80 || box.top > vh + 80) continue;  /* 视口外不算 */
            /* 元素中心相对视口中心的进度：-1（刚从下面进来）… 1（快滚出去了） */
            var p = ((box.top + box.height / 2) - vh / 2) / (vh / 2 + box.height / 2);
            p = Math.max(-1, Math.min(1, p));
            /* 图片高度是框的 118%（上下各 1% 缓冲防露黑边），正反走得满不满都不穿帮 */
            assets[i].style.transform = "translate3d(0," + (p * 8).toFixed(2) + "%,0)";
        }
    }
    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    parallax();
})();

/* ---------- ③ 主页大字：逐行「从下往上 + 淡入」（ScrollTrigger） ----------
   文本按 HTML 里的 <br> 拆行（不按空格拆词：这句子太长，逐词会散成 40 段），
   每行包一个 .about-line，整行一起抬起来，行与行之间留 0.12s 的错峰。
   触发点 top 85%（标题顶边进到屏下 15% 时开演），回滚时反向退回原状。
   库没取到时走 CSS 过渡兜底，文字绝不会停在不可见状态。
   ⚠ 单独一个 IIFE：上面 ② 有 `if (!assets.length) return;`，
     写在一起的话没有图片时这段会被一起 return 掉。 */
(function initAboutReveal() {
    var title = document.querySelector(".about-title");
    if (!title) return;

    /* 按 <br> 拆行：只加包裹层，不改文本、不改换行点 */
    if (!title.querySelector(".about-line")) {
        var parts = title.innerHTML.split(/<br\s*\/?>/i);
        title.innerHTML = parts.map(function (t) {
            return '<span class="about-line">' + t + "</span>";
        }).join("");
    }
    var lines = [].slice.call(title.querySelectorAll(".about-line"));
    if (!lines.length) return;

    function playWithGsap() {
        gsap.registerPlugin(ScrollTrigger);
        gsap.fromTo(lines,
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: title,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });
        ScrollTrigger.refresh();
        /* 门面那一段是 pin 住的，pin-spacer 会把整页高度改一次：
           如果本段在它建好之前就量了位置，start 会偏。等 load 完再校一遍。 */
        var reflow = function () { ScrollTrigger.refresh(); };
        if (document.readyState === "complete") setTimeout(reflow, 400);
        else window.addEventListener("load", function () { setTimeout(reflow, 400); });
    }

    /* CSS 过渡兜底：同样的位移/缓动，用 IntersectionObserver 触发 */
    function playWithCss() {
        lines.forEach(function (l, i) {
            l.classList.add("about-line-js");
            l.style.transitionDelay = (i * 0.12) + "s";
        });
        if (!("IntersectionObserver" in window)) {
            lines.forEach(function (l) { l.classList.add("is-in"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                en.target.classList.toggle("is-in", en.isIntersecting);
            });
        }, { rootMargin: "0px 0px -15% 0px" });
        lines.forEach(function (l) { io.observe(l); });
    }

    /* gsap / ScrollTrigger 是页面底部异步装载的：这里轮询等待，超时就兜底 */
    var t0 = Date.now();
    (function waitLibs() {
        if (window.gsap && window.ScrollTrigger) { playWithGsap(); return; }
        if (Date.now() - t0 > 8000) { playWithCss(); return; }
        setTimeout(waitLibs, 120);
    })();
})();
