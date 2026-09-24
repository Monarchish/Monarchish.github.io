/* ============================================================
   03、设置 · 4.Hero门面.js
   ------------------------------------------------------------
   这是什么：首页「支援未来」门面——一段可以往下滚的长流程。
        打开站点落在这里，一路向下滚 4 屏，才到操作手册目录。
   它管四屏：
     第 1 屏  大字「支援未来」+ 点阵网格 + 大图裁切区 + 跑马灯（门面正脸）
     第 2-4 屏 「旅程」：底纹不动、屏幕滚动换景，左右角交替浮出小注解
              （初衷 / SOP 小技巧——文案在下面 CONTENT.notes 里）
   它做五件事：
     ① 把 #heroStage 里该有的东西搭出来（底纹 + 4 屏 + 注解 + 页码）
     ② 入场动效：大字逐字顶上、标题乱码解码、注解浮现、热点脉冲
     ③ 滚动时用 GSAP 驱动换景：注解浮现/退场、幽灵大字视差、页码与进度条
     ④ 兼任"加载器"：滚动期间后台把目录和文档索引备好（见 preload）
     ⑤ 万一库没加载成功、或系统开了"减少动态效果"，就直接把画面摆好
   它不做的事：不碰侧栏、不碰目录、不碰正文——那些还是 1.站点主程序.js 的活。

   参考站的设计语言（配色 / 流体字号 / 切角按钮 / 平滑滚动 / 逐行滑入 /
   乱码解码标题）已移植到这里，但代码、字体来源与文案全部是我们自己的。
   ============================================================ */
(function () {
    "use strict";

    /* 这一趟旅程上写的字，想改文案就改这里。
       notes 里 body 开头的【占位】标记 = 文案还没定稿，后面替换正文即可，
       kicker（角标）+ title（小标题）+ body（两三行小字）构成一个角落注解。 */
    var CONTENT = {
        eyebrow: "Support The Future · 标准作业手册",
        title: "支援未来",
        sub: "把每一个流程，写成一页就能照着做的标准。",
        meta: ["29 个流程", "5 大环节", "持续更新"],
        marquee: "支援未来 ✦ SUPPORT THE FUTURE ✦ 标准作业手册 ✦ STANDARD OPERATING MANUAL ✦ 29 个流程 · 5 大环节 ✦ ",
        pagerTotal: 4,
        /* 大图裁切区里的图片：留空 = 用 CSS 画的网格地形兜底。
           想换成真图就把图放进 03、设置/ 下，这里写相对路径（相对 index.html），
           例如 "03、设置/9.门面大图.jpg"。样式不用动。 */
        mapImage: "",
        /* 大图上的两个脉冲点（参考站左下右下那两个标签的位置） */
        mapPoints: {
            hotspot: "作业区",
            specialist: "操作要点"
        },
        notes: [
            {
                side: "right",
                kicker: "初衷 · WHY WE WROTE THIS",
                title: "为什么要有这本手册",
                body: "【占位】把老同事脑子里的经验，变成新同事也能照着做对的步骤。流程不靠猜，靠翻这一页。"
            },
            {
                side: "left",
                kicker: "小技巧 · TIP 01",
                title: "先看要点，再动手",
                body: "【占位】每个步骤都配要点表：⛔ 禁止 / ⚠ 注意 / ✓ 检验。动手前先扫一眼，能少走一大半回头路。"
            },
            {
                side: "right",
                kicker: "小技巧 · TIP 02",
                title: "遇到异常不用慌",
                body: "【占位】每篇末尾都有「常见异常处理」。先对照表格找同样的报错，多数情况一分钟就能解决。"
            }
        ],
        ghosts: ["初衷", "要点", "不慌"]   // 每个旅程屏中央的淡描边大字（与 notes 一一对应）
    };

    var stage = document.getElementById("heroStage");
    if (!stage) return;

    document.body.classList.add("hero-mode");

    /* ---------- 要不要显示门面 ---------- */
    var heroOn = document.documentElement.classList.contains("hero-on");
    var params = new URLSearchParams(location.search);
    var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var jump = params.get("jump") === "1";

    /* 不显示门面（?hero=0 / ?page=xxx / ?jump=1）：什么都不做，站点照旧 */
    if (!heroOn || jump) return;

    /* ---------- 有没有见过（回访）----------
       首次访问：完整播一遍入场（这是"加载器"的主要窗口）
       回访：短文版入场——画面很快到位，不强制等待 */
        var seenKey = "support-future-hero-seen-v1";
    var isReturn = false;
    try { isReturn = localStorage.getItem(seenKey) === "1"; } catch (e) { /* 忽略 */ }
    try { localStorage.setItem(seenKey, "1"); } catch (e) { /* 忽略 */ }
    if (isReturn) document.documentElement.classList.add("hero-seen");

    var escapeHtml = function (s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    };

    /* ---------- 搭画面 ----------
       .hero-backdrop  底纹：sticky 钉在第一屏位置，4 屏滚动期间一直停在原处
                       （这就是"底纹不动、内容换景"的关键；不用 fixed，不碰站点别的 sticky）
       .hero-screen    一屏一景；第 1 屏是门面正脸，第 2-4 屏是角落注解 + 淡描边大字 */
    var chs = CONTENT.title.split("").map(function (c) {
        return '<span class="hero-ch"><i>' + escapeHtml(c) + "</i></span>";
    }).join("");

    var notesHtml = CONTENT.notes.map(function (n, i) {
        return '<section class="hero-screen hero-journey" data-screen="' + (i + 2) + '">' +
            '<span class="hero-ghost" aria-hidden="true">' + escapeHtml(CONTENT.ghosts[i] || "") + "</span>" +
            '<div class="hero-note is-' + (n.side === "left" ? "left" : "right") + '">' +
            '<p class="hero-note-kicker">' + escapeHtml(n.kicker) + "</p>" +
            '<h2 class="hero-note-title" data-scramble>' + escapeHtml(n.title) + "</h2>" +
            '<p class="hero-note-body">' + escapeHtml(n.body) + "</p>" +
            "</div>" +
            "</section>";
    }).join("");

    /* 大图区：有图用图，没图用 CSS 网格地形兜底 */
    var mapInner = CONTENT.mapImage
        ? '<img src="' + escapeHtml(CONTENT.mapImage) + '" alt="" />'
        : '<div class="hero-map-fallback"></div>';

    stage.innerHTML =
        '<div class="hero-backdrop">' +
        '<div class="hero-raster"></div>' +
        '<div class="hero-glow"></div>' +
        '<div class="hero-stars is-near"></div>' +
        '<div class="hero-stars is-far"></div>' +
        '<svg class="hero-grid" viewBox="0 0 1080 748" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
        '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentcolor" d="M582 83H830V0H914V83H997V249H1080V416H997V498H1080V582H997V665H831V748H747V665H665V748H498V665H250V748H166V665H0V498H83V333H0V166H83V83H332V0H582V83ZM167 747H249V665H167V747ZM499 747H581V665H499V747ZM582 747H664V665H582V747ZM748 747H830V665H748V747ZM1 664H83V582H1V664ZM84 664H166V582H84V664ZM167 664H249V582H167V664ZM250 664H332V582H250V664ZM333 664H415V582H333V664ZM416 664H498V582H416V664ZM499 664H581V582H499V664ZM582 664H664V582H582V664ZM665 664H747V582H665V664ZM748 664H830V582H748V664ZM831 664H913V582H831V664ZM914 664H996V582H914V664ZM1 581H83V499H1V581ZM84 581H166V499H84V581ZM167 581H249V499H167V581ZM250 581H332V499H250V581ZM333 581H415V499H333V581ZM416 581H498V499H416V581ZM499 581H581V499H499V581ZM582 581H664V499H582V581ZM665 581H747V499H665V581ZM748 581H830V499H748V581ZM831 581H913V499H831V581ZM914 581H996V499H914V581ZM997 581H1079V499H997V581ZM84 498H166V416H84V498ZM167 498H249V416H167V498ZM250 498H332V416H250V498ZM333 498H415V416H333V498ZM416 498H498V416H416V498ZM499 498H581V416H499V498ZM582 498H664V416H582V498ZM665 498H747V416H665V498ZM748 498H830V416H748V498ZM831 498H913V416H831V498ZM914 498H996V416H914V498ZM84 415H166V333H84V415ZM167 415H249V333H167V415ZM250 415H332V333H250V415ZM333 415H415V333H333V415ZM416 415H498V333H416V415ZM499 415H581V333H499V415ZM582 415H664V333H582V415ZM665 415H747V333H665V415ZM748 415H830V333H748V415ZM831 415H913V333H831V415ZM914 415H996V333H914V415ZM997 415H1079V333H997V415ZM1 332H83V250H1V332ZM84 332H166V250H84V332ZM167 332H249V250H167V332ZM250 332H332V250H250V332ZM333 332H415V250H333V332ZM416 332H498V250H416V332ZM499 332H581V250H499V332ZM582 332H664V250H582V332ZM665 332H747V250H665V332ZM748 332H830V250H748V332ZM831 332H913V250H831V332ZM914 332H996V250H914V332ZM997 332H1079V250H997V332ZM1 249H83V167H1V249ZM84 249H166V167H84V249ZM167 249H249V167H167V249ZM250 249H332V167H250V249ZM333 249H415V167H333V249ZM416 249H498V167H416V249ZM499 249H581V167H499V249ZM582 249H664V167H582V249ZM665 249H747V167H665V249ZM748 249H830V167H748V249ZM831 249H913V167H831V249ZM914 249H996V167H914V249ZM84 166H166V84H84V166ZM167 166H249V84H167V166ZM250 166H332V84H250V166ZM333 166H415V84H333V166ZM416 166H498V84H416V166ZM499 166H581V84H499V166ZM582 166H664V84H582V166ZM665 166H747V84H665V166ZM748 166H830V84H748V166ZM831 166H913V84H831V166ZM914 166H996V84H914V166ZM333 83H415V1H333V83ZM416 83H498V1H416V83ZM499 83H581V1H499V83ZM831 83H913V1H831V83Z"/>' +
        "</svg>" +
        '<div class="hero-map">' + mapInner + "</div>" +
        '<div class="hero-hotspot"><div class="hero-pulse"></div><div class="hero-pulse"></div>' +
        '<span class="hero-hotspot-mark"></span>' +
        '<span class="hero-hotspot-label">' + escapeHtml(CONTENT.mapPoints.hotspot) + "</span></div>" +
        '<div class="hero-specialist"><div class="hero-pulse"></div>' +
        '<span class="hero-hotspot-mark"></span>' +
        '<span class="hero-specialist-label">' + escapeHtml(CONTENT.mapPoints.specialist) + "</span></div>" +
        '<div class="hero-pager" aria-hidden="true">' +
        '<span class="hero-pager-now">01</span>' +
        '<span class="hero-pager-sep"></span>' +
        '<span class="hero-pager-all">' + (CONTENT.pagerTotal < 10 ? "0" + CONTENT.pagerTotal : CONTENT.pagerTotal) + "</span>" +
        "</div>" +
        '<div class="hero-progress" aria-hidden="true"><i></i></div>' +
        "</div>" +
        '<section class="hero-screen hero-face" data-screen="1">' +
        '<div class="hero-inner">' +
        '<p class="hero-eyebrow">' + escapeHtml(CONTENT.eyebrow) + "</p>" +
        '<h1 class="hero-display">' + chs + "</h1>" +
        '<p class="hero-sub">' + escapeHtml(CONTENT.sub) + "</p>" +
        '<ul class="hero-meta">' + CONTENT.meta.map(function (m) {
            return "<li>" + escapeHtml(m) + "</li>";
        }).join("") + "</ul>" +
        "</div>" +
        '<div class="hero-marquee"><div class="hero-marquee-track">' +
        '<span class="hero-marquee-half">' + escapeHtml(CONTENT.marquee) + "</span>" +
        '<span class="hero-marquee-half">' + escapeHtml(CONTENT.marquee) + "</span>" +
        "</div></div>" +
        '<div class="hero-cue"><span>向下滚动</span><span class="hero-cue-rail"><i></i></span></div>' +
        "</section>" +
        notesHtml;

    /* ---------- 点星星（数量按屏宽收一点，手机不浪费性能） ---------- */
    function seedStars(el, count) {
        if (!el) return;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < count; i++) {
            var s = document.createElement("span");
            s.className = "hero-star";
            s.style.left = (Math.random() * 100).toFixed(2) + "%";
            s.style.top = (Math.random() * 88).toFixed(2) + "%";
            s.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
            s.style.animationDelay = (Math.random() * 3.2).toFixed(2) + "s";
            s.style.animationDuration = (2.4 + Math.random() * 2.2).toFixed(2) + "s";
            frag.appendChild(s);
        }
        el.appendChild(frag);
    }
    var narrow = window.innerWidth < 720;
    seedStars(stage.querySelector(".hero-stars.is-near"), narrow ? 50 : 80);
    seedStars(stage.querySelector(".hero-stars.is-far"), narrow ? 30 : 55);

    /* ============================================================
       乱码解码标题（参考站那种"英文小标题在跳"的效果）
       ------------------------------------------------------------
       自己实现，不依赖 GSAP 的 ScrambleText 插件：
       前面一截显示乱码、后面一截显示原文，分界线从左往右推进，
       推完正好是完整原文。同一时间只跑一个实例（新调用会顶掉旧的）。
       ============================================================ */
    var SCRAMBLE_POOL = "ABCDEFGHKMNPRSTUVWXYZ023456789/\\<>*+#%&";
    var _scrambleTimers = new Map();   // el -> timer，防同元素撞车
    function scrambleIn(el, opts) {
        if (!el) return;
        var text = el.getAttribute("data-text") || el.textContent;
        el.setAttribute("data-text", text);
        opts = opts || {};
        var stepMs = opts.step || 46;      // 推进间隔
        var burst = opts.burst || 1;       // 每次推进几个字符
        var chars = text.split("");
        /* 已经在跑的先停掉 */
        if (_scrambleTimers.has(el)) {
            clearInterval(_scrambleTimers.get(el));
            _scrambleTimers.delete(el);
        }
        var revealed = 0;
        var timer = setInterval(function () {
            revealed += burst;
            if (revealed >= chars.length) {
                clearInterval(timer);
                _scrambleTimers.delete(el);
                el.textContent = text;
                return;
            }
            var out = "";
            for (var i = 0; i < chars.length; i++) {
                var c = chars[i];
                if (c === " ") { out += " "; continue; }
                if (i < revealed) { out += c; continue; }
                if (i < revealed + 4) { out += SCRAMBLE_POOL.charAt(Math.floor(Math.random() * SCRAMBLE_POOL.length)); continue; }
                out += c;
            }
            el.textContent = out;
        }, stepMs);
        _scrambleTimers.set(el, timer);
        /* 兜底：3 秒内一定还原成原文 */
        setTimeout(function () {
            if (!_scrambleTimers.has(el)) return;
            clearInterval(_scrambleTimers.get(el));
            _scrambleTimers.delete(el);
            el.textContent = text;
        }, 3000);
    }

    /* ============================================================
       入场动效
       ------------------------------------------------------------
       首次访问：完整版（大字逐字顶上 + 标题乱码 + 热点脉冲）
       回访：短文版（约 0.9 秒到位，不强制等待）
       ============================================================ */
    var started = false;

    function animateStars() {
        var g = window.gsap;
        if (!g) return;
        g.to(stage.querySelectorAll(".hero-stars"), { opacity: 1, duration: 1.2, ease: "power1.out" });
        g.fromTo(stage.querySelector(".hero-grid"), { opacity: 0 }, { opacity: 0.16, duration: 1.6, ease: "power1.out" });
        var star = stage.querySelector(".hero-star-mark");
        if (star) {
            var path = star.querySelector("path");
            var L = path.getTotalLength();
            g.set(path, { strokeDasharray: L, strokeDashoffset: L });
            g.to(path, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut", delay: 0.2 });
            g.fromTo(star, { opacity: 0, rotate: -35, scale: 0.82 }, { opacity: 1, duration: 1.2, ease: "power2.out", delay: 0.2 });
        }
    }

    function animateIn() {
        var g = window.gsap;
        if (!g) return;
        /* 回访：只把关键几样快速摆好，不做逐字大戏 */
        if (isReturn) {
            g.timeline()
                .from(stage.querySelector(".hero-eyebrow"), { opacity: 0, duration: 0.5, ease: "power2.out" })
                .from(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: 100, duration: 0.7, ease: "power3.out", stagger: 0.045 }, "-=0.3")
                .from(stage.querySelector(".hero-sub"), { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.4")
                .from(stage.querySelector(".hero-map"), { opacity: 0, scale: 1.08, duration: 0.9, ease: "power2.out" }, "-=0.5")
                .from(stage.querySelectorAll(".hero-meta li"), { y: 14, opacity: 0, duration: 0.45, ease: "power2.out", stagger: 0.06 }, "-=0.5")
                .from(stage.querySelector(".hero-marquee"), { yPercent: 100, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.4")
                .from(stage.querySelector(".hero-cue"), { opacity: 0, duration: 0.4 }, "-=0.3")
                .from(stage.querySelectorAll(".hero-hotspot, .hero-specialist"), { opacity: 0, duration: 0.5 }, "-=0.4");
            return;
        }

        /* 首次：完整版 */
        var tl = g.timeline();
        tl.from(stage.querySelector(".hero-eyebrow"), { opacity: 0, letterSpacing: "0.6em", duration: 0.8, ease: "power3.out" })
            /* 大字逐字从裁剪窗口里顶上（参考站的 SplitText lines 手法，这里按字做） */
            .from(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: 120, duration: 1.05, ease: "power4.out", stagger: 0.09 }, "-=0.5")
            .from(stage.querySelector(".hero-sub"), { y: 26, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.55")
            .from(stage.querySelector(".hero-map"), { opacity: 0, scale: 1.14, duration: 1.2, ease: "power3.out" }, "-=0.7")
            .from(stage.querySelectorAll(".hero-meta li"), { y: 16, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, "-=0.85")
            .from(stage.querySelector(".hero-marquee"), { yPercent: 100, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.6")
            .from(stage.querySelector(".hero-cue"), { opacity: 0, duration: 0.5 }, "-=0.4")
            .from(stage.querySelectorAll(".hero-hotspot, .hero-specialist"), { opacity: 0, duration: 0.6, stagger: 0.2 }, "-=0.5");
        return tl;
    }

    function start() {
        if (started) return;
        started = true;
        stage.setAttribute("aria-hidden", "false");

        var canAnimate = !!window.gsap && !reduce;

        if (canAnimate) {
            /* 先摆好初始状态，免得大字在库下完之前先闪一下原样 */
            window.gsap.set(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: isReturn ? 100 : 120 });
            window.gsap.set([".hero-eyebrow", ".hero-sub", ".hero-cue"], { opacity: 0 });
            window.gsap.set(stage.querySelectorAll(".hero-stars"), { opacity: 0 });
            window.gsap.set(".hero-star-mark", { opacity: 0 });
            if (!isReturn) window.gsap.set(".hero-grid", { opacity: 0 });
        }

        /* 底纹和星空先亮（这一层和开屏动画的收场衔接得上） */
        animateStars();

        if (!canAnimate) return;   // 没有 GSAP / 用户要求少动效：画面已在原位，直接用

        /* 等字体就位再入场，免得逐字动画用兜底字体算位置、中途跳一下 */
        var go = function () { animateIn(); };
        if (document.fonts && document.fonts.ready) {
            var fired = false;
            document.fonts.ready.then(function () { if (!fired) { fired = true; go(); } });
            setTimeout(function () { if (!fired) { fired = true; go(); } }, 600);
        } else {
            go();
        }
    }

    /* ============================================================
       滚动：换景 + 视差 + 页码 + 进度条
       ============================================================ */
    function setupScroll() {
        if (!window.gsap || !window.ScrollTrigger || reduce) return;
        var g = window.gsap;
        g.registerPlugin(window.ScrollTrigger);
        var ST = window.ScrollTrigger;

        var star = stage.querySelector(".hero-star-mark");
        var starFar = stage.querySelector(".hero-stars.is-far");
        var starNear = stage.querySelector(".hero-stars.is-near");
        var inner = stage.querySelector(".hero-inner");
        var map = stage.querySelector(".hero-map");
        var grid = stage.querySelector(".hero-grid");
        var cue = stage.querySelector(".hero-cue");
        var progressFill = stage.querySelector(".hero-progress i");

        /* 整段旅程的被动位移（scrub）：底纹分层漂移 = 纵深感 */
        var tl = g.timeline({
            scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: true }
        });
        if (starFar) tl.to(starFar, { yPercent: -16, duration: 1, ease: "none" }, 0);
        if (starNear) tl.to(starNear, { yPercent: -7, duration: 1, ease: "none" }, 0);
        if (inner) tl.to(inner, { yPercent: -16, duration: 1, ease: "none" }, 0);
        if (grid) tl.to(grid, { rotate: 22, scale: 1.12, duration: 1, ease: "none" }, 0);
        if (star) tl.to(star, { rotate: 120, scale: 1.18, duration: 1, ease: "none" }, 0);
        if (cue) tl.to(cue, { opacity: 0, duration: 0.08, ease: "none" }, 0);

        /* 大图：随第 1 屏滚出时轻轻放大（参考站的 mask-size 缩放，这里做温和版） */
        if (map) {
            g.fromTo(map,
                { scale: 1, yPercent: 0 },
                {
                    scale: 1.16, yPercent: -6, ease: "none",
                    scrollTrigger: { trigger: stage.querySelector(".hero-face"), start: "top top", end: "bottom top", scrub: true }
                });
        }

        /* 顶部进度条：整段旅程滚到哪，填到哪 */
        if (progressFill) {
            ST.create({
                trigger: stage, start: "top top", end: "bottom bottom",
                onUpdate: function (self) { progressFill.style.transform = "scaleY(" + self.progress + ")"; }
            });
        }

        /* 每个旅程屏：淡描边大字轻微视差，注解块浮现/退场，页码跟着换 */
        var pad2 = function (n) { return n < 10 ? "0" + n : "" + n; };
        var pagerNow = stage.querySelector(".hero-pager-now");
        g.utils.toArray(".hero-journey").forEach(function (sec) {
            var ghost = sec.querySelector(".hero-ghost");
            var note = sec.querySelector(".hero-note");
            if (ghost) {
                g.fromTo(ghost, { yPercent: 26 }, {
                    yPercent: -26, ease: "none",
                    scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
                });
            }
            if (note) {
                g.fromTo(note,
                    { opacity: 0, y: 42 },
                    {
                        opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
                        scrollTrigger: { trigger: sec, start: "top 62%", toggleActions: "play none none reverse" }
                    });
                /* 滚到跟前时，标题"解码"一次，制造"被发现"的感觉（每个标题只解一次） */
                ST.create({
                    trigger: sec, start: "top 55%",
                    onEnter: function () {
                        var t = sec.querySelector(".hero-note-title[data-scramble]");
                        if (t && !t.dataset.done) { t.dataset.done = "1"; scrambleIn(t, { step: 42 }); }
                    }
                });
            }
            ST.create({
                trigger: sec, start: "top 55%", end: "bottom 55%",
                onToggle: function (self) {
                    if (self.isActive && pagerNow) pagerNow.textContent = pad2(Number(sec.dataset.screen));
                }
            });
        });
        ST.create({
            trigger: stage.querySelector(".hero-face"), start: "top 55%", end: "bottom 55%",
            onToggle: function (self) {
                if (self.isActive && pagerNow) pagerNow.textContent = "01";
            }
        });

        /* ---------- 平滑滚动 ----------
           Lenis 装上以后手感更顺（参考站也是这一套）；
           实例挂到 HeroFacade 上，1.站点主程序.js 的 heroAwareScrollTo 靠它做程序化滚动 */
        if (window.Lenis) {
            var lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
            window.HeroFacade.lenis = lenis;
            lenis.on("scroll", ST.update);
            g.ticker.add(function (t) { lenis.raf(t * 1000); });
            g.ticker.lagSmoothing(0);
        }
    }

    /* ============================================================
       兼做"加载器"：趁用户在看前言的这段时间，把目录和索引在后台备好
       ------------------------------------------------------------
       1.站点主程序.js 自己会在加载时抓索引，这里只是"提前催一下"，
       让它别等用户滚到目录才开始。抓不到也没关系，主程序会重试。
       ============================================================ */
    var preloadStarted = false;
    function preload() {
        if (preloadStarted) return;
        preloadStarted = true;
        setTimeout(function () {
            try {
                if (typeof window.prefetchIndex === "function") window.prefetchIndex();
            } catch (e) { /* 忽略：主程序自己会处理 */ }
        }, 1200);
    }

    window.HeroFacade = {
        start: function () {
            start();
            setupScroll();
            preload();
        },
        /* 给外面用：手动触发一次乱码解码（调试 / 复用） */
        scramble: scrambleIn
    };

    /* 没有头部脚本触发（比如直接用 file:// 打开）时，自己开始 */
    if (!document.querySelector('script[src*="4.Hero门面.js"]')) return;
    var kick = document.readyState === "loading"
        ? document.addEventListener.bind(document, "DOMContentLoaded")
        : function (f) { f(); };
    kick(function () { setTimeout(function () { window.HeroFacade.start(); }, 0); });
})();
