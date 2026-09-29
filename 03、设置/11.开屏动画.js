/* ============================================================
   03、设置 · 11.开屏动画.js
   ------------------------------------------------------------
   这是什么：进站开场（landing reveal）——进门先看到的那套流程：
     白底信息版 → 黑底加载屏（中央圆环描边画完）→ 出现「进入」
     → 点一下 → 整层左滑揭幕 → 「支援未来」大标题 → 淡出，画面交给门面。

   来源：照 Lil-TT/support-future-handbook 的 js/reveal.js 复刻
        （那份又移植自 ti-landing-page-reveal-004 的 script.js，
         原版用 GSAP 的 Club SplitText，这里用等价的手写切行/切字）。

   它做的事：
     ① 搭开屏 DOM（.reveal-root，fixed 满屏，压在站点之上）
     ② 播入场：逐行上滑 + 圆环描边 + 模拟加载进度（随机停点）
     ③ 等点击（鼠标点、Tab 后回车/空格 都行），播揭幕
     ④ 揭幕完 resolve —— 由 index.html 撤掉 <html> 的 reveal-on，
        门面就此接手（详见 index.html 的「开场」段）
   它不做的事：不碰门面、不碰目录、不碰正文——那些是别的文件的活。

   与源码的两处差异（有意）：
     · 缓动 hop / glide：CustomEase 到了就用它；没到就用本文件里数值
       解出的同曲线三次贝塞尔（GSAP 直接吃函数），开屏不会因为一个小
       插件没下完就整个废掉。
     · 文案、字体、标记换成本站的（都在下面的 CONTENT 里集中改）。
   ============================================================ */
(function () {
    "use strict";

    /* ============================================================
       开屏上写的字：要改文案只动这里
       ============================================================ */
    var CONTENT = {
        /* 白底信息版上排：每项是"一栏"，栏内若干行；
           带 logo 的那栏上面还会出现一个虚线框小标记 */
        backdropTop: [
            { lines: ["SF//支援未来", "SF//支援未来", "SF//支援未来", "SF//支援未来", "SF//支援未来"] },
            { lines: ["手册 / 攻略本"] },
            { lines: ["准入 · 采购 · 销售"] },
            { lines: ["目录导航 / TOC"] },
            { lines: ["检索 / Search Ready"] },
            { logo: true, lines: ["GitHub Pages"] }
        ],
        /* 白底信息版下排 */
        backdropBottom: [
            { lines: ["从 Excel 迁出"] },
            { lines: ["// / / ///// / / / ///"] },
            { lines: ["WPS 目录对齐"] },
            { lines: ["工序装载中", "目录索引"] },
            { lines: ["多端可查", "手机 · 电脑"] },
            { lines: ["SF-01"] }
        ],
        /* 黑底加载屏：左上标题、左下两栏、右下编号 */
        preloaderTitle: "初始化手册",
        preloaderCols: [
            ["阶段 01", "序列启动"],
            ["工序扫描", "5 大板块"]
        ],
        preloaderTag: "SF-01",
        /* 中央圆环按钮上的两行字（前者加载完出现，后者揭幕时替换它） */
        btnLabel: "进入",
        btnOutro: "已就绪",
        /* 揭幕后的标题屏 */
        title: "支援未来",
        sub: "个人操作手册 · 翻得动 · 搜得到",
        /* 站点标记：四角星（与站点图标同形）。
           浅色版给黑屏用，深色版给白底用；想换图只改这两行 */
        logoLight: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23bfe6fb'/%3E%3Cstop offset='1' stop-color='%234c9ad4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M32 9Q35.5 28.5 55 32Q35.5 35.5 32 55Q28.5 35.5 9 32Q28.5 28.5 32 9Z' fill='url(%23g)'/%3E%3C/svg%3E",
        logoDark: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%232f74b8'/%3E%3Cstop offset='1' stop-color='%230a1a2e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M32 9Q35.5 28.5 55 32Q35.5 35.5 32 55Q28.5 35.5 9 32Q28.5 28.5 32 9Z' fill='url(%23g)'/%3E%3C/svg%3E"
    };

    /* 圆环半径 155 → 周长 2πr ≈ 974，与 DOM 里的 stroke-dasharray 一致；
       JS 会再用 getTotalLength() 精确取一次，取不到就用这个数兜底 */
    var RING_FALLBACK = 974;

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    /* ============================================================
       搭 DOM（结构照源码 index.html 的静态标记，改成 JS 现场生成）
       ============================================================ */
    function colHtml(col) {
        return '<div class="pb-col">' +
            (col.logo ? '<img id="pb-logo" src="' + CONTENT.logoDark + '" alt="" />' : "") +
            col.lines.map(function (t) { return "<p>" + escapeHtml(t) + "</p>"; }).join("") +
            "</div>";
    }

    function rowHtml(cols) {
        return '<div class="pb-row">' + cols.map(colHtml).join("") + "</div>";
    }

    function buildHtml() {
        return "" +
            '<div class="preloader-backdrop">' +
                rowHtml(CONTENT.backdropTop) +
                rowHtml(CONTENT.backdropBottom) +
            "</div>" +
            '<div class="preloader">' +
                '<div class="p-row"><p>' + escapeHtml(CONTENT.preloaderTitle) + "</p></div>" +
                '<div class="p-row">' +
                    '<div class="p-col">' +
                        CONTENT.preloaderCols.map(function (col) {
                            return '<div class="p-sub-col">' +
                                col.map(function (t) { return "<p>" + escapeHtml(t) + "</p>"; }).join("") +
                                "</div>";
                        }).join("") +
                    "</div>" +
                    '<div class="p-col"><p>' + escapeHtml(CONTENT.preloaderTag) + "</p></div>" +
                "</div>" +
                /* 中央按钮：点它 / 回车 / 空格 都能进站 */
                '<div class="preloader-btn-container" role="button" tabindex="0" aria-label="进入手册">' +
                    '<img id="pbc-logo" src="' + CONTENT.logoLight + '" alt="" />' +
                    '<p id="pbc-label">' + escapeHtml(CONTENT.btnLabel) + "</p>" +
                    '<p id="pbc-outro-label">' + escapeHtml(CONTENT.btnOutro) + "</p>" +
                    '<div class="pbc-svg-strokes">' +
                        '<svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                            '<circle class="stroke-track" cx="160" cy="160" r="155" stroke="#2b2b2b" ' +
                                'stroke-width="2" stroke-dasharray="' + RING_FALLBACK + '" stroke-dashoffset="' + RING_FALLBACK + '" />' +
                            '<circle class="stroke-progress" cx="160" cy="160" r="155" stroke="#fff" ' +
                                'stroke-width="2" stroke-dasharray="' + RING_FALLBACK + '" stroke-dashoffset="' + RING_FALLBACK + '" />' +
                        "</svg>" +
                    "</div>" +
                "</div>" +
            "</div>" +
            '<section class="reveal-stage">' +
                '<div class="preloader-revealer"></div>' +
                "<div>" +
                    "<h1>" + escapeHtml(CONTENT.title) + "</h1>" +
                    '<p class="reveal-sub">' + escapeHtml(CONTENT.sub) + "</p>" +
                "</div>" +
            "</section>";
    }

    function buildRoot() {
        var root = document.getElementById("revealRoot");
        if (root) return root;
        if (!document.body) return null;
        root = document.createElement("div");
        root.className = "reveal-root";
        root.id = "revealRoot";
        root.setAttribute("aria-label", "开场动画");
        root.innerHTML = buildHtml();
        /* 放 body 第一个：开屏期间它是唯一该被看见的东西 */
        document.body.insertBefore(root, document.body.firstChild);
        return root;
    }

    function dismissReveal() {
        var root = document.getElementById("revealRoot");
        if (root && root.parentNode) root.parentNode.removeChild(root);
        document.documentElement.classList.remove("reveal-on");
    }

    /* ============================================================
       缓动：源码的 CustomEase.create("hop","0.9, 0, 0.1, 1")
             与 CustomEase.create("glide","0.8, 0, 0.2, 1")
       ------------------------------------------------------------
       CustomEase 在就用它；不在就用下面的函数版同曲线三次贝塞尔
       （GSAP 的 ease 可以直接吃函数）。两条路出来的曲线完全一致。
       ============================================================ */
    function cubicBezier(x1, y1, x2, y2) {
        function A(a1, a2) { return 1 - 3 * a2 + 3 * a1; }
        function B(a1, a2) { return 3 * a2 - 6 * a1; }
        function C(a1) { return 3 * a1; }
        function calc(t, a1, a2) { return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t; }
        function slope(t, a1, a2) { return 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1); }
        return function (x) {
            if (x <= 0) return 0;
            if (x >= 1) return 1;
            var t = x;
            for (var i = 0; i < 8; i++) {
                var dx = calc(t, x1, x2) - x;
                if (Math.abs(dx) < 1e-5) break;
                var d = slope(t, x1, x2);
                if (Math.abs(d) < 1e-6) break;
                t -= dx / d;
            }
            return calc(t, y1, y2);
        };
    }

    function makeEases(CustomEase) {
        if (CustomEase && typeof CustomEase.create === "function") {
            try {
                CustomEase.create("hop", "0.9, 0, 0.1, 1");
                CustomEase.create("glide", "0.8, 0, 0.2, 1");
                return { hop: "hop", glide: "glide" };
            } catch (e) { /* 建不出来就往下走函数版 */ }
        }
        return { hop: cubicBezier(0.9, 0, 0.1, 1), glide: cubicBezier(0.8, 0, 0.2, 1) };
    }

    /* ============================================================
       切行 / 切字（等价于源码的 SplitText：
       每个 <p> 包成 .line-mask > .line，标题按词包成 .word-mask > .word）
       ============================================================ */
    function splitLines(root) {
        var ps = root.querySelectorAll("p");
        for (var i = 0; i < ps.length; i++) {
            var p = ps[i];
            if (p.querySelector(".line-mask")) continue;
            var text = p.textContent;
            p.textContent = "";
            var mask = document.createElement("span");
            mask.className = "line-mask";
            var line = document.createElement("span");
            line.className = "line";
            line.textContent = text;
            mask.appendChild(line);
            p.appendChild(mask);
        }
    }

    function splitWords(el) {
        if (!el || el.querySelector(".word-mask")) return;
        var raw = (el.textContent || "").trim();
        el.textContent = "";
        var parts;
        if (raw.indexOf(" ") >= 0) {
            parts = raw.split(/\s+/);
        } else if (/^[\u4e00-\u9fff]+$/.test(raw) && raw.length === 4) {
            /* 四个汉字（「支援未来」）：对半分，比逐字更好看 */
            parts = [raw.slice(0, 2), raw.slice(2)];
        } else if (/^[\u4e00-\u9fff]+$/.test(raw)) {
            parts = raw.split("");
        } else {
            parts = raw.match(/[\u4e00-\u9fff]+|[A-Za-z0-9]+|[^\s]/g) || [raw];
        }
        var hasSpace = raw.indexOf(" ") >= 0;
        parts.forEach(function (part, i) {
            if (i > 0 && hasSpace) el.appendChild(document.createTextNode(" "));
            var mask = document.createElement("span");
            mask.className = "word-mask";
            if (!hasSpace) mask.style.marginRight = "0.12em";
            var word = document.createElement("span");
            word.className = "word";
            word.textContent = part;
            mask.appendChild(word);
            el.appendChild(mask);
        });
    }

    /* ============================================================
       开演
       ------------------------------------------------------------
       gsap / CustomEase 由 index.html 的库加载器给进来。
       返回 Promise：揭幕播完（画面已可交给门面）时 resolve。
       ============================================================ */
    function bootReveal(gsap, CustomEase) {
        var root = buildRoot();
        if (!root || !gsap) return Promise.resolve();

        var g = gsap;
        var ease = makeEases(CustomEase);
        var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
        /* 回访（localStorage 有标记）：同一套流程走快版，点一下照样要点 */
        var isReturn = document.documentElement.classList.contains("hero-seen");
        var speed = reduce ? 0.001 : (isReturn ? 0.45 : 1);
        var d = function (v) { return v * speed; };
        /* 时间线上的相对位置（"-=0.75" 这类）也跟着变速，否则快版会串场 */
        var rel = function (v) { return "-=" + v * speed; };

        var preloaderBtn = root.querySelector(".preloader-btn-container");
        var btnOutlineTrack = root.querySelector(".stroke-track");
        var btnOutlineProgress = root.querySelector(".stroke-progress");
        var preloaderEl = root.querySelector(".preloader");
        var stageEl = root.querySelector(".reveal-stage");
        var ringLen = RING_FALLBACK;
        try {
            if (btnOutlineTrack.getTotalLength) ringLen = btnOutlineTrack.getTotalLength() || RING_FALLBACK;
        } catch (e) { ringLen = RING_FALLBACK; }

        splitLines(root);
        splitWords(root.querySelector(".reveal-stage h1"));

        g.set([btnOutlineTrack, btnOutlineProgress], {
            strokeDasharray: ringLen,
            strokeDashoffset: ringLen
        });

        var preloaderComplete = false;

        /* ---------- ① 入场 ---------- */
        var introTl = g.timeline({ delay: d(0.35) });

        introTl
            .to(root.querySelectorAll(".preloader .p-row p .line"), {
                y: "0%",
                duration: d(0.75),
                ease: "power3.out",
                stagger: d(0.1)
            })
            .to(btnOutlineTrack, {
                strokeDashoffset: 0,
                duration: d(2),
                ease: ease.hop
            }, "<")
            .to(root.querySelector(".pbc-svg-strokes svg"), {
                rotation: 270,
                duration: d(2),
                ease: ease.hop
            }, "<");

        /* 加载进度：源码是 4 个带随机抖动的停点（0.2 / 0.25 / 0.85 / 1）。
           回访快版只走一个停点，不晃。 */
        var progressStops = (isReturn || reduce)
            ? [1]
            : [0.2, 0.25, 0.85, 1].map(function (base, i) {
                return i === 3 ? 1 : base + (Math.random() - 0.5) * 0.1;
            });

        progressStops.forEach(function (stop, i) {
            introTl.to(btnOutlineProgress, {
                strokeDashoffset: ringLen - ringLen * stop,
                duration: d(0.75),
                ease: ease.glide,
                delay: d(i === 0 ? 0.3 : 0.3 + Math.random() * 0.2)
            });
        });

        introTl
            .to(root.querySelector("#pbc-logo"), {
                opacity: 0,
                duration: d(0.35),
                ease: "power1.out"
            }, rel(0.25))
            .to(preloaderBtn, {
                scale: 0.9,
                duration: d(1.5),
                ease: ease.hop
            }, rel(0.5))
            .to(root.querySelectorAll("#pbc-label .line"), {
                y: "0%",
                duration: d(0.75),
                ease: "power3.out",
                onComplete: function () { preloaderComplete = true; }
            }, rel(0.75))
            .add(function () { preloaderComplete = true; });

        /* ---------- ② 等点击 ---------- */
        return new Promise(function (resolve) {
            var finishToSite = function () {
                g.to(root, {
                    autoAlpha: 0,
                    duration: d(0.55),
                    ease: "power2.out",
                    onComplete: function () {
                        root.classList.add("is-done");
                        root.style.display = "none";
                        resolve();
                    }
                });
            };

            var engage = function () {
                /* 圆环没画完就点：不响应（源码同款，防止误触打断加载） */
                if (!preloaderComplete) return;
                preloaderComplete = false;

                var exitTl = g.timeline({
                    onComplete: function () {
                        /* 标题停留一下，再淡出交给门面 */
                        g.delayedCall(d(isReturn ? 0.4 : 1.1), finishToSite);
                    }
                });

                exitTl
                    /* 整层缩小：四边露出白底信息版 */
                    .to(preloaderEl, {
                        scale: 0.75,
                        duration: d(1.25),
                        ease: ease.hop
                    })
                    /* 圆环反向缩回 */
                    .to([btnOutlineTrack, btnOutlineProgress], {
                        strokeDashoffset: -ringLen,
                        duration: d(1.25),
                        ease: ease.hop
                    }, "<")
                    /* 「进入」上滑撤走、「已就绪」顶上 */
                    .to(root.querySelectorAll("#pbc-label .line"), {
                        y: "-100%",
                        duration: d(0.75),
                        ease: "power3.out"
                    }, rel(1.25))
                    .to(root.querySelectorAll("#pbc-outro-label .line"), {
                        y: "0%",
                        duration: d(0.75),
                        ease: "power3.out"
                    }, rel(0.75))
                    /* 黑屏左滑撤走 */
                    .to(preloaderEl, {
                        clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
                        duration: d(1.5),
                        ease: ease.hop
                    })
                    /* 标题屏里那片白也左滑撤走 → 大标题露出来 */
                    .to(root.querySelector(".preloader-revealer"), {
                        clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
                        duration: d(1.5),
                        ease: ease.hop,
                        onComplete: function () {
                            if (preloaderEl) preloaderEl.style.display = "none";
                        }
                    }, rel(1.45))
                    /* 标题屏放大到满屏 */
                    .to(stageEl, {
                        scale: 1,
                        duration: d(1.25),
                        ease: ease.hop
                    })
                    /* 大标题逐词上滑 */
                    .to(root.querySelectorAll(".reveal-stage h1 .word"), {
                        y: "0%",
                        duration: d(1),
                        ease: ease.glide,
                        stagger: d(0.06)
                    }, rel(1.75))
                    .to(root.querySelectorAll(".reveal-stage .reveal-sub .line"), {
                        y: "0%",
                        duration: d(0.7),
                        ease: "power3.out"
                    }, rel(0.85));
            };

            if (reduce) preloaderComplete = true;   /* 免动画模式：直接可点 */

            preloaderBtn.addEventListener("click", engage);
            preloaderBtn.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                    e.preventDefault();
                    engage();
                }
            });
        });
    }

    window.SupportFutureReveal = {
        boot: bootReveal,
        dismiss: dismissReveal
    };
})();
