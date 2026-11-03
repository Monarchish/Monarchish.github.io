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

/* ===================== 2026-11-03 图片旁文字/按钮：入场 + 悬停乱码（重做版） =====================
   上一版把 hover 绑定写在 bindGsap() 里面，只要 gsap / ScrollTrigger 有一个没取到
   （线上偶发），标题和按钮的鼠标交互就整体不存在——这是"悬停动画看不到"的根因。
   现在三层彻底解耦：
     ① 拆词：DOM 一就绪就做，不依赖任何库
     ② 悬停乱码：立即无条件绑定，用自带定时器（每 80ms 一拍，肉眼能看清字符在跳）
     ③ 入场：有 gsap 走 gsap（标题乱码落定 + 正文逐词滑入）；
        没有就走 CSS 过渡 + IntersectionObserver，文字绝不会停在看不见的状态
   上面 ①②③ 三段（鼠标晃动 / 图片视差 / 主页大字）一行未改。

   原站核对结论（2026-11-03 无头浏览器实测）：
     · 原站标题 hover 没有乱码，只有 is-blinker 闪烁方块；
     · 原站按钮 hover 只有 clip-path 斜角位移，背景色/尺寸都不变。
     标题与按钮的「悬停乱码」「底色变白」「文字右移」是按用户要求额外加的。 */
(function initValueTextAnim() {
    var blocks = [].slice.call(document.querySelectorAll(".value-block"));
    if (!blocks.length) return;

    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&";
    var TIMING = {
        enter: { step: 45, ticks: 12 },   /* 入场：快，约 0.55s 落定（"瞬间乱码落定"） */
        hover: { step: 80, ticks: 14 }    /* 悬停：慢，一拍 80ms，一次约 1.1s */
    };

    /* 逐拍乱码：字符数恒定（等宽字体不会抖），从左往右依次落定 */
    function scramble(el, text, conf) {
        if (!el) return;
        if (typeof text !== "string" || !text) {
            text = el.getAttribute("data-text") || el.textContent || "";
        }
        if (!text) return;
        if (el.__scrambleTimer) { clearInterval(el.__scrambleTimer); el.__scrambleTimer = null; }
        var n = conf.ticks, i = 0;
        el.textContent = text;                       /* 先复位，避免上一轮残留 */
        el.__scrambleTimer = setInterval(function () {
            i++;
            if (i >= n) {                            /* 落定：还原原文 */
                clearInterval(el.__scrambleTimer);
                el.__scrambleTimer = null;
                el.textContent = text;
                return;
            }
            var settled = Math.round(text.length * i / n);
            var out = "";
            for (var k = 0; k < text.length; k++) {
                var ch = text.charAt(k);
                out += (k < settled || !/[A-Za-z0-9]/.test(ch))
                    ? ch
                    : GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
            }
            el.textContent = out;
        }, conf.step);
    }

    /* ---- ① 拆词：只包 span，词间空格仍是文本节点，换行与宽度和原来一致 ---- */
    var items = blocks.map(function (block) {
        var title = block.querySelector(".value-title");
        var text = block.querySelector(".value-text");
        var btn = block.querySelector(".value-btn");
        var label = btn ? btn.querySelector(".value-btn-label") : null;

        if (title && !title.getAttribute("data-text")) title.setAttribute("data-text", title.textContent);
        if (label && !label.getAttribute("data-text")) label.setAttribute("data-text", label.textContent);

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

        return {
            block: block,
            text: text,
            title: title,
            titleText: title ? (title.getAttribute("data-text") || "") : "",
            words: words,
            btn: btn,
            label: label,
            labelText: label ? (label.getAttribute("data-text") || "") : "",
            done: false
        };
    });

    /* ---- ② 悬停乱码：立即绑定，不等任何库 ---- */
    items.forEach(function (it) {
        if (it.title) {
            it.title.addEventListener("mouseenter", function () {
                scramble(it.title, it.titleText, TIMING.hover);
            });
        }
        if (it.btn && it.label) {
            it.btn.addEventListener("mouseenter", function () {
                scramble(it.label, it.labelText, TIMING.hover);
            });
            /* 触屏没有 hover：按住时也给一次反馈 */
            it.btn.addEventListener("touchstart", function () {
                scramble(it.label, it.labelText, TIMING.hover);
            }, { passive: true });
        }
    });

    /* ---- ③ 入场 ---- */
    function inView(el) {
        return el.getBoundingClientRect().top < window.innerHeight * 0.78;
    }

    function play(it) {
        if (it.done) return;
        it.done = true;
        if (it.title) scramble(it.title, it.titleText, TIMING.enter);   /* 标题：乱码落定 */
        if (!it.words.length) return;
        if (window.gsap) {
            gsap.to(it.words, {                                          /* 正文：逐词上滑 + 淡入 */
                opacity: 1, y: 0, duration: 0.75, ease: "power3.out",
                stagger: 0.035, overwrite: true
            });
        } else if (it.text) {
            it.text.classList.add("is-in");                              /* CSS 兜底 */
        }
    }

    function arm(it) {
        /* 已经在视口里（直达简介 / 刷新停在半页）：直接演，不等滚动 */
        if (inView(it.block)) { setTimeout(function () { play(it); }, 80); return; }
        if (window.ScrollTrigger && window.gsap) {
            ScrollTrigger.create({
                trigger: it.block,
                start: "top 78%",
                once: true,
                onEnter: function () { play(it); }
            });
            return;
        }
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { play(it); io.disconnect(); }
                });
            }, { rootMargin: "0px 0px -22% 0px" });
            io.observe(it.block);
            return;
        }
        var onScroll = function () {
            if (inView(it.block)) { play(it); window.removeEventListener("scroll", onScroll); }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    function hideWords() {
        items.forEach(function (it) {
            if (!it.words.length) return;
            if (window.gsap) gsap.set(it.words, { opacity: 0, y: 22 });
            else if (it.text) it.text.classList.add("word-anim");
        });
    }

    var t0 = Date.now();
    (function boot() {
        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
            hideWords();
            items.forEach(arm);
            ScrollTrigger.refresh();
            /* 门面 pin 会改页面高度，load 后补一次量测（与主页大字同款处理） */
            var reflow = function () { ScrollTrigger.refresh(); };
            if (document.readyState === "complete") setTimeout(reflow, 400);
            else window.addEventListener("load", function () { setTimeout(reflow, 400); });
            return;
        }
        /* 库是页面底部异步取回来的：等，但不等死 */
        if (Date.now() - t0 < 4000) { setTimeout(boot, 120); return; }
        hideWords();
        items.forEach(function (it) {
            it.words.forEach(function (w, i) {
                w.style.transitionDelay = (i * 0.028).toFixed(3) + "s";
            });
        });
        items.forEach(arm);
    })();
})();
