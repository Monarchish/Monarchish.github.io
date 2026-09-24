/* ============================================================
   03、设置 · 4.Hero门面.js
   ------------------------------------------------------------
   这是什么：首页第一屏「支援未来」门面 Hero 的逻辑。它在站点里负责
        "短片放完之后停留的那一屏"，往下滚一屏才到操作手册目录。
   它做四件事：
     ① 把 #heroStage 里该有的东西搭出来（星空 / 大字 / 四角星 / 跑马灯）
     ② 接住开屏动画的收场：覆盖层一淡出，大字就一个字一个字顶上来
     ③ 滚动时让星空、四角星缓慢变化（需要 GSAP；没有也不影响看和滚）
     ④ 万一库没加载成功、或者系统开了"减少动态效果"，就直接把画面摆好
   它不做的事：不碰侧栏、不碰目录、不碰正文——那些还是 1.站点主程序.js 的活。
   两个状态类（index.html 里加的）：
     html.hero-on      这次访问要显示门面
     html.hero-passed  门面已经滚过去了，下面恢复成正常站点
   ============================================================ */
(function () {
    "use strict";

    /* 这一屏上写的字，想改文案就改这里 */
    var CONTENT = {
        eyebrow: "Support The Future · 标准作业手册",
        title: "支援未来",
        sub: "把每一个流程，写成一页就能照着做的标准。",
        meta: ["29 个流程", "5 大环节", "持续更新"],
        marquee: "支援未来 ✦ SUPPORT THE FUTURE ✦ 标准作业手册 ✦ STANDARD OPERATING MANUAL ✦ 29 个流程 · 5 大环节 ✦ "
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

    /* ---------- 搭画面 ---------- */
    var chs = CONTENT.title.split("").map(function (c) {
        return '<span class="hero-ch"><i>' + escapeHtml(c) + "</i></span>";
    }).join("");

    stage.innerHTML =
        '<div class="hero-stars is-near"></div>' +
        '<div class="hero-stars is-far"></div>' +
        '<svg class="hero-star-mark" viewBox="0 0 200 200" aria-hidden="true">' +
        '<path d="M100 2 C108 68 132 92 198 100 C132 108 108 132 100 198 ' +
        'C92 132 68 108 2 100 C68 92 92 68 100 2 Z"/></svg>' +
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
        '<div class="hero-cue"><span>向下滚动</span><span class="hero-cue-rail"><i></i></span></div>';

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

    /* ---------- 入场：只在"这次要播开屏动画"时才等它 ----------
       开屏动画播完 → 6.主页挂载.js 给覆盖层打上 is-closing 并开始淡出
       → 我们在它淡出的同一拍里让大字顶上来，衔接不会断。 */
    var started = false;

    function animateIn() {
        var g = window.gsap;
        var tl = g.timeline();
        tl.from(stage.querySelector(".hero-eyebrow"), { opacity: 0, letterSpacing: "0.6em", duration: 0.8, ease: "power3.out" })
            .from(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: 120, duration: 1.05, ease: "power4.out", stagger: 0.09 }, "-=0.5")
            .from(stage.querySelector(".hero-sub"), { y: 26, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.55")
            .from(stage.querySelectorAll(".hero-meta li"), { y: 16, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08 }, "-=0.45");

        var star = stage.querySelector(".hero-star-mark");
        if (star) {
            var path = star.querySelector("path");
            var L = path.getTotalLength();
            g.set(path, { strokeDasharray: L, strokeDashoffset: L });
            tl.to(path, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, "-=0.9")
                .from(star, { opacity: 0, rotate: -35, scale: 0.82, duration: 1, ease: "power2.out" }, "<");
        }
        tl.from(stage.querySelectorAll(".hero-stars"), { opacity: 0, duration: 1.3, ease: "power1.out" }, "-=1")
            .from(stage.querySelector(".hero-marquee"), { yPercent: 100, opacity: 0, duration: 0.7, ease: "power3.out" }, "-=0.7")
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
            window.gsap.set(".hero-star-mark", { opacity: 0 });
        }

        if (!canAnimate) return;   // 没有 GSAP / 用户要求少动效：画面已在原位，直接用

        if (playIntroThisTime()) {
            waitForIntroThen(animateIn);
        } else {
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

    /* 盯着开屏动画收场：6.主页挂载.js 在覆盖层开始淡出/移除时会广播
       intro:closing / intro:gone 两个事件——前者是"可以准备了"，
       后者是"黑幕彻底没了，开演"。拿不到事件就退化成轮询兜底。 */
    function waitForIntroThen(cb) {
        var fired = false;
        function once() { if (fired) return; fired = true; cb(); }

        var started = false;
        function onClosing() {
            if (started) return;
            started = true;
            /* 覆盖层淡出要 0.6s + 60ms 移除，intro:gone 是精确信号；
               这里再留一个略大的超时，防止事件丢了 */
            setTimeout(once, 900);
        }
        addEventListener("intro:closing", onClosing);
        addEventListener("intro:gone", once);
        setTimeout(once, 3500);             // 兜底：动画挂了也别让门面空着
    }

    /* ---------- 滚动：星空与四角星慢慢动一点 ---------- */
    function setupScroll() {
        if (!window.gsap || !window.ScrollTrigger || reduce) return;
        var g = window.gsap;
        g.registerPlugin(window.ScrollTrigger);

        var star = stage.querySelector(".hero-star-mark");
        var tl = g.timeline({
            scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: true }
        });
        tl.to(stage.querySelector(".hero-stars.is-far"), { yPercent: -18, duration: 1, ease: "none" }, 0)
            .to(stage.querySelector(".hero-stars.is-near"), { yPercent: -8, duration: 1, ease: "none" }, 0)
            .to(stage.querySelector(".hero-inner"), { yPercent: -14, duration: 1, ease: "none" }, 0)
            .to(star, { rotate: 90, scale: 1.28, duration: 1, ease: "none" }, 0)
            .to(stage.querySelector(".hero-cue"), { opacity: 0, duration: 0.25, ease: "none" }, 0);

        /* 平滑滚动：Lenis 装上以后手感更顺，装不上也无所谓 */
        if (window.Lenis) {
            var lenis = new window.Lenis({ duration: 1.1 });
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
