/* ===== 3、站点简介：主页大字「从下往上 + 淡入」（ScrollTrigger） =====
   2026-11-03 大扫除：旧版绑定残页的鼠标晃动与图片滚动视差两段已整体移除，
   本文件现在只剩 about-title 的入场动画。
   文本按 HTML 里的 <br> 拆行（不按空格拆词：这句子太长，逐词会散成 40 段），
   每行包一个 .about-line，整行一起抬起来，行与行之间留 0.12s 的错峰。
   触发点 top 85%（标题顶边进到屏下 15% 时开演），回滚时反向退回原状。
   库没取到时走 CSS 过渡兜底，文字绝不会停在不可见状态。 */
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
        var vh = window.innerHeight;
        lines.forEach(function (l, i) {
            l.style.transitionDelay = (i * 0.12) + "s";
            l.classList.add("about-line-js");
        });
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    en.target.classList.toggle("is-in", en.isIntersecting);
                });
            }, { rootMargin: "0px 0px -15% 0px" });
            lines.forEach(function (l) { io.observe(l); });
        }
        /* 已经在视口里（直达简介 / 刷新停在半页）：不再等观察器回调，立刻补一次，
           否则文字会停在 opacity:0 的状态上——宁可省掉动画，也不能让字看不见 */
        lines.forEach(function (l) {
            if (l.getBoundingClientRect().top < vh * 0.85) l.classList.add("is-in");
        });
    }

    /* gsap / ScrollTrigger 是页面底部异步装载的：这里轮询等待，超时就兜底 */
    var t0 = Date.now();
    (function waitLibs() {
        if (window.gsap && window.ScrollTrigger) { playWithGsap(); return; }
        if (Date.now() - t0 > 4000) { playWithCss(); return; }
        setTimeout(waitLibs, 120);
    })();
})();
