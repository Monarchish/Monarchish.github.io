/* ============================================================
   03、设置 · 4.Hero门面.js
   ------------------------------------------------------------
   这是什么：首页「支援未来」星河门面——一段可以往下滚的长流程。
        开屏动画播完落在这里，一路向下滚 4 屏，才到操作手册目录。
   它管四屏：
     第 1 屏  大字「支援未来」+ 星空 + 四角星 + 跑马灯（门面正脸）
     第 2-4 屏 「星河旅程」：星空背景不动，屏幕滚动换景，
              左右角交替浮出小注解（初衷 / SOP 小技巧——文案在
              下面 CONTENT.notes 里，想改口径只改那里）
   它做五件事：
     ① 把 #heroStage 里该有的东西搭出来（背景 + 4 屏 + 注解 + 页码）
     ② 接住开屏动画的收场：覆盖层一开始淡出，星星先亮起来（溶进星河），
        覆盖层彻底消失后，大字再一个字一个字顶上来
     ③ 滚动时用 GSAP 驱动换景：注解块浮现/退场、幽灵大字视差、页码切换
     ④ 万一库没加载成功、或者系统开了"减少动态效果"，就直接把画面摆好
     ⑤ 把 Lenis 实例挂到 window.HeroFacade.lenis，给 1.站点主程序.js 的
        heroAwareScrollTo 用（否则原生 scrollTo 会被 Lenis 拉回去）
   它不做的事：不碰侧栏、不碰目录、不碰正文——那些还是 1.站点主程序.js 的活。
   两个状态类（index.html 里加的）：
     html.hero-on      这次访问要显示门面
     html.hero-passed  门面已经滚过去了，下面恢复成正常站点
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
        ghosts: ["初衷", "要点", "不慌"]   // 每个旅程屏中央的半透明大字（与 notes 一一对应）
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

    var escapeHtml = function (s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    };

    /* ---------- 搭画面 ----------
       .hero-backdrop  星空背景：sticky 钉在第一屏位置，4 屏滚动期间一直停在原处
                       （这就是"星星不动、内容换景"的关键；不用 fixed，不碰站点别的 sticky）
       .hero-screen    一屏一景；第 1 屏是门面正脸，第 2-4 屏是角落注解 + 幽灵大字 */
    var chs = CONTENT.title.split("").map(function (c) {
        return '<span class="hero-ch"><i>' + escapeHtml(c) + "</i></span>";
    }).join("");

    var notesHtml = CONTENT.notes.map(function (n, i) {
        return '<section class="hero-screen hero-journey" data-screen="' + (i + 2) + '">' +
            '<span class="hero-ghost" aria-hidden="true">' + escapeHtml(CONTENT.ghosts[i] || "") + "</span>" +
            '<div class="hero-note is-' + (n.side === "left" ? "left" : "right") + '">' +
            '<p class="hero-note-kicker">' + escapeHtml(n.kicker) + "</p>" +
            '<h2 class="hero-note-title">' + escapeHtml(n.title) + "</h2>" +
            '<p class="hero-note-body">' + escapeHtml(n.body) + "</p>" +
            "</div>" +
            "</section>";
    }).join("");

    stage.innerHTML =
        '<div class="hero-backdrop">' +
        '<div class="hero-stars is-near"></div>' +
        '<div class="hero-stars is-far"></div>' +
        '<svg class="hero-star-mark" viewBox="0 0 200 200" aria-hidden="true">' +
        '<path d="M100 2 C108 68 132 92 198 100 C132 108 108 132 100 198 ' +
        'C92 132 68 108 2 100 C68 92 92 68 100 2 Z"/></svg>' +
        '<div class="hero-pager" aria-hidden="true">' +
        '<span class="hero-pager-now">01</span>' +
        '<span class="hero-pager-sep"></span>' +
        '<span class="hero-pager-all">' + (CONTENT.pagerTotal < 10 ? "0" + CONTENT.pagerTotal : CONTENT.pagerTotal) + "</span>" +
        "</div>" +
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

    /* ---------- 点两颗星星（数量按屏宽收一点，手机不浪费性能） ---------- */
    function seedStars(el, count) {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < count; i++) {
            var s = document.createElement("span");
            s.className = "hero-star";
            s.style.left = (Math.random() * 100).toFixed(2) + "%";
            s.style.top = (Math.random() * 88).toFixed(2) + "%";
            s.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
            s.style.animationDelay = (Math.random() * 3.2).toFixed(2) + "s";
            s.style.animationDuration = (2.4 + Math.random() * 2.2).toFixed(2) + "s";
            if (Math.random() < 0.12) { s.style.width = "2.5px"; s.style.height = "2.5px"; }
            frag.appendChild(s);
        }
        el.appendChild(frag);
    }
    var narrow = window.innerWidth < 720;
    seedStars(stage.querySelector(".hero-stars.is-near"), narrow ? 55 : 90);
    seedStars(stage.querySelector(".hero-stars.is-far"), narrow ? 35 : 60);

    /* ---------- 入场分两拍（这就是"溶进星河"的衔接） ----------
       第一拍 animateStars：覆盖层一开始淡出（intro:closing），星空就在黑幕底下
            悄悄亮起来——开屏画面溶掉的地方长出星星，两个画风就接上了；
       第二拍 animateIn ：覆盖层彻底消失（intro:gone），大字、四角星、跑马灯才进场。 */
    var started = false;

    function animateStars() {
        var g = window.gsap;
        if (!g) return;
        g.to(stage.querySelectorAll(".hero-stars"), { opacity: 1, duration: 1.4, ease: "power1.out" });
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
        var tl = g.timeline();
        tl.from(stage.querySelector(".hero-eyebrow"), { opacity: 0, letterSpacing: "0.6em", duration: 0.8, ease: "power3.out" })
            .from(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: 120, duration: 1.05, ease: "power4.out", stagger: 0.09 }, "-=0.5")
            .from(stage.querySelector(".hero-sub"), { y: 26, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.55")
            .from(stage.querySelectorAll(".hero-meta li"), { y: 16, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, "-=0.45")
            .from(stage.querySelector(".hero-marquee"), { yPercent: 100, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.5")
            .from(stage.querySelector(".hero-cue"), { opacity: 0, duration: 0.5 }, "-=0.3");
        return tl;
    }

    function start() {
        if (started) return;
        started = true;
        stage.setAttribute("aria-hidden", "false");

        var canAnimate = !!window.gsap && !reduce;

        if (canAnimate) {
            // 先摆好初始状态，免得大字在头部脚本下完之前先闪一下原样
            window.gsap.set(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: 120 });
            window.gsap.set([".hero-eyebrow", ".hero-sub", ".hero-cue"], { opacity: 0 });
            window.gsap.set(stage.querySelectorAll(".hero-stars"), { opacity: 0 });
            window.gsap.set(".hero-star-mark", { opacity: 0 });
        }

        if (!canAnimate) return;   // 没有 GSAP / 用户要求少动效：画面已在原位，直接用

        if (playIntroThisTime()) {
            /* 开屏会播：closing 一响星星先亮（在黑幕底下），gone 一响大字进场 */
            var starUp = false;
            var textUp = false;
            addEventListener("intro:closing", function onClosing() {
                removeEventListener("intro:closing", onClosing);
                starUp = true;
                animateStars();
                setTimeout(function () { if (!textUp) { textUp = true; animateIn(); } }, 1400);
            });
            addEventListener("intro:gone", function onGone() {
                removeEventListener("intro:gone", onGone);
                if (!textUp) { textUp = true; animateIn(); }
            });
            setTimeout(function () {           // 兜底：事件丢了也要开演
                if (!starUp) animateStars();
                setTimeout(function () { if (!textUp) { textUp = true; animateIn(); } }, 700);
            }, 3500);
        } else {
            animateStars();
            animateIn();
        }
    }

    /* 这次访问到底会不会播开屏动画：和 index.html 里的判断保持一致 */
    function playIntroThisTime() {
        var force = params.get("intro");
        if (force === "1") return true;
        if (force === "0") return false;
        try { return sessionStorage.getItem(window.__INTRO_SESSION_KEY || "act54-intro-played") !== "1"; }
        catch (e) { return true; }
    }

    /* ---------- 滚动：换景 + 视差 + 页码 ---------- */
    function setupScroll() {
        if (!window.gsap || !window.ScrollTrigger || reduce) return;
        var g = window.gsap;
        g.registerPlugin(window.ScrollTrigger);

        /* 星空与四角星：整段旅程缓慢动一点（scrub） */
        var star = stage.querySelector(".hero-star-mark");
        var tl = g.timeline({
            scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: true }
        });
        tl.to(stage.querySelector(".hero-stars.is-far"), { yPercent: -14, duration: 1, ease: "none" }, 0)
            .to(stage.querySelector(".hero-stars.is-near"), { yPercent: -6, duration: 1, ease: "none" }, 0)
            .to(stage.querySelector(".hero-inner"), { yPercent: -14, duration: 1, ease: "none" }, 0)
            .to(star, { rotate: 120, scale: 1.18, duration: 1, ease: "none" }, 0)
            .to(stage.querySelector(".hero-cue"), { opacity: 0, duration: 0.08, ease: "none" }, 0);

        /* 每个旅程屏：幽灵大字轻微视差，注解块浮现/退场 */
        var pad2 = function (n) { return n < 10 ? "0" + n : "" + n; };
        var pagerNow = stage.querySelector(".hero-pager-now");
        var ST = window.ScrollTrigger;
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

        /* 平滑滚动：Lenis 装上以后手感更顺；实例挂到 HeroFacade 上，
           1.站点主程序.js 的 heroAwareScrollTo 靠它做程序化滚动 */
        if (window.Lenis) {
            var lenis = new window.Lenis({ duration: 1.1 });
            window.HeroFacade.lenis = lenis;
            lenis.on("scroll", window.ScrollTrigger.update);
            g.ticker.add(function (t) { lenis.raf(t * 1000); });
            g.ticker.lagSmoothing(0);
        }
    }

    window.HeroFacade = {
        start: function () {
            start();
            setupScroll();
        }
    };

    /* 没有头部脚本触发（比如直接用 file:// 打开）时，自己开始 */
    if (!document.querySelector('script[src*="4.Hero门面.js"]')) return;
    var kick = document.readyState === "loading"
        ? document.addEventListener.bind(document, "DOMContentLoaded")
        : function (f) { f(); };
    kick(function () { setTimeout(function () { window.HeroFacade.start(); }, 0); });
})();
