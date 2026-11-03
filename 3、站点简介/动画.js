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

/* ===================== 2026-11-03 新增：图片旁文字/按钮的入场与悬停 =====================
   全部为「新增」逻辑，上方 ①鼠标晃动 ②图片视差 ③主页大字 三段一行未改。
   对应 inversa 原站的 .block 段落：
     · 大标题（ECONOMICS…）：ScrollTrigger 进视口时「原地乱码落定」
       —— 用门面同款 ScrambleTextPlugin；插件没就位时用自带的逐拍乱码兜底。
     · 正文：按空格拆词，逐词「向上滑入 + 淡入」（Stagger 0.035s）。
     · 按钮：clip-path 斜角 hover 与配色由 CSS 负责，这里只加「悬停乱码一次」。
   原站核对结论（2026-11-03 无头浏览器实测）：
     · 原站标题 hover 没有乱码（只有 is-blinker 闪烁方块）；
     · 原站按钮 hover 只有 clip-path 斜角位移，背景色/尺寸不变。
     标题与按钮的「悬停乱码」是本页按用户要求额外加的，故此处独立成段。 */
(function initValueTextAnim() {
    var blocks = [].slice.call(document.querySelectorAll(".value-block"));
    if (!blocks.length) return;

    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /* 兜底乱码：不依赖插件，逐拍把字母换成随机大写（字符数不变，宽度不抖） */
    function tickScramble(el, text, ticks) {
        if (el.__scrambling) return;
        el.__scrambling = true;
        var parts = text.split("");
        var n = ticks || 12;
        var i = 0;
        var timer = setInterval(function () {
            i++;
            var out = "";
            for (var k = 0; k < parts.length; k++) {
                var ch = parts[k];
                /* 已落定的字符 = 按位置推进；空格/标点原样保留 */
                var settled = k / parts.length < i / n;
                out += settled ? ch : (/[A-Za-z]/.test(ch)
                    ? GLYPHS.charAt((Math.random() * GLYPHS.length) | 0)
                    : ch);
            }
            el.textContent = out;
            if (i >= n) { clearInterval(timer); el.textContent = text; el.__scrambling = false; }
        }, 45);
    }

    function scramble(el, text) {
        if (!el) return;
        if (window.gsap && window.ScrambleTextPlugin) {
            gsap.to(el, { duration: 0.9, scrambleText: { text: text, speed: 0.6 } });
        } else {
            tickScramble(el, text);
        }
    }

    /* ---- 正文拆词：只包 span，词间空格仍用文本节点，宽度/换行与原来一致 ---- */
    var items = [];
    blocks.forEach(function (block) {
        var title = block.querySelector(".value-title");
        var text = block.querySelector(".value-text");
        var btnLabel = block.querySelector(".value-btn-label");
        var words = [];
        if (text) {
            var raw = text.textContent.replace(/\s+/g, " ").trim();
            text.textContent = "";
            var arr = raw ? raw.split(" ") : [];
            arr.forEach(function (w, i) {
                var s = document.createElement("span");
                s.className = "word";
                s.textContent = w;
                text.appendChild(s);
                words.push(s);
                if (i < arr.length - 1) text.appendChild(document.createTextNode(" "));
            });
        }
        items.push({ block: block, title: title, titleText: title ? title.textContent : "", words: words, btnLabel: btnLabel, btnText: btnLabel ? btnLabel.textContent : "", played: false });
    });

    /* ---- 有 gsap 才做隐身+滑入；没有就保持原样可读 ---- */
    function bindGsap() {
        gsap.registerPlugin(ScrollTrigger);
        items.forEach(function (it) {
            if (it.words.length) {
                gsap.set(it.words, { opacity: 0, y: 24 });
            }
            ScrollTrigger.create({
                trigger: it.block,
                start: "top 70%",
                once: true,
                onEnter: function () {
                    it.played = true;
                    if (it.title) scramble(it.title, it.titleText);
                    if (it.words.length) {
                        gsap.to(it.words, {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            ease: "power3.out",
                            stagger: 0.035
                        });
                    }
                }
            });

            /* 悬停：大标题 / 按钮文字各乱码一次（原站没有，按用户要求新增） */
            if (it.title) {
                it.title.addEventListener("mouseenter", function () { scramble(it.title, it.titleText); });
            }
            if (it.btnLabel) {
                it.btnLabel.parentElement.addEventListener("mouseenter", function () {
                    scramble(it.btnLabel, it.btnText);
                });
            }
        });
        ScrollTrigger.refresh();
        /* 门面 pin 会改页面高度，load 后补一次量测（与主页大字同款处理） */
        var reflow = function () { ScrollTrigger.refresh(); };
        if (document.readyState === "complete") setTimeout(reflow, 400);
        else window.addEventListener("load", function () { setTimeout(reflow, 400); });
    }

    /* gsap 在页面底部异步装载：轮询等待，超时就保持静态可读（不做任何隐藏） */
    var t0 = Date.now();
    (function waitLibs() {
        if (window.gsap && window.ScrollTrigger) { bindGsap(); return; }
        if (Date.now() - t0 > 4000) return;
        setTimeout(waitLibs, 120);
    })();
})();
