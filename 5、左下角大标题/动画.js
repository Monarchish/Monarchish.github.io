/* ============================================================
   5、左下角大标题 —— 出场动画（只做这一件事）
   · 手动拆行（等价 GSAP SplitText 的 lines 模式，本站没引 SplitText 会员插件）
   · 逐行从下往上滑入 + 淡入，两行错开 0.15s
   · 按钮晚 0.6s 跟进

   ⚠ 本文件不碰 Lenis、不碰蒙版收缩、不碰散点/HUD，也不改动
     2、滚动门面/动画.js 里的任何 ScrollTrigger。
   ============================================================ */
(function () {
  "use strict";

  /* ===== 两个可调开关 ===== */
  /* 滚过首屏后让标题随门面一起淡出（原站的大标题属于第一屏，往下滚就退场了）。
     本站门面是 pin 住的，不加这段标题会一直压在后面三屏的散点/文案上。
     不想要就把这里改成 false —— 只有这一处会动标题。 */
  var EXIT_ON_SCROLL = true;
  /* 入场整体延后（秒）：等首屏画面稳一下再起 */
  var START_DELAY = 0.15;

  var container = document.querySelector(".hero-title-container");
  if (!container) return;

  var title = container.querySelector(".hero-title");
  var btn = container.querySelector(".explore-btn");
  if (!title) return;

  /* ---------- 1. 手动拆行：每个 .line 外面套一层 overflow:hidden 的遮罩 ---------- */
  var lines = title.querySelectorAll(".line");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.parentNode && line.parentNode.classList.contains("line-mask")) continue;
    var mask = document.createElement("span");
    mask.className = "line-mask";
    line.parentNode.insertBefore(mask, line);
    mask.appendChild(line);
  }
  /* 结构里的 <br> 在拆行后是多余的（两行都已是 block），留着会多一个空行高度 */
  var brs = title.querySelectorAll("br");
  for (var j = 0; j < brs.length; j++) brs[j].parentNode.removeChild(brs[j]);

  /* ---------- 2. 兜底：动画没起来时也要能看见字 ---------- */
  function fallbackStatic() {
    container.classList.add("is-static");
    if (window.gsap) {
      gsap.set(title.querySelectorAll(".line"), { clearProps: "opacity,transform" });
      if (btn) gsap.set(btn, { clearProps: "opacity,transform" });
    }
  }

  /* 用户开了"减少动态效果"：不做位移，直接显示 */
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 3. 等"站点真正露脸"再演 ----------
     index.html 的 markReady() 会派发 site:ready（并加 body.is-ready）。
     这里三手准备：已是 ready 立刻演 / 监听事件 / 再挂一个轮询兜底。 */
  var started = false;

  function play() {
    if (started) return;
    started = true;

    if (!window.gsap) { fallbackStatic(); return; }
    if (reduceMotion) { fallbackStatic(); armExit(); return; }

    /* 先钉住初始态（CSS 里已 opacity:0，这里补上位移，避免第一帧闪一下） */
    gsap.set(title.querySelectorAll(".line"), { y: 100, opacity: 0 });
    if (btn) gsap.set(btn, { y: 20, opacity: 0 });

    /* ↓↓↓ 出场动画：与设计要求逐字一致 ↓↓↓ */
    // 用 GSAP 从下往上滑入
    gsap.fromTo(".hero-title .line",
      {
        y: 100, // 初始位置在下方 100px
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.15, // 两行文字错开 0.15 秒出现
        delay: START_DELAY
      }
    );

    // 按钮稍微晚一点出现
    gsap.fromTo(".explore-btn",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.6 + START_DELAY, ease: "power2.out" }
    );
    /* ↑↑↑ 出场动画结束 ↑↑↑ */

    armExit();
  }

  function whenReady(cb) {
    if (document.body.classList.contains("is-ready")) return cb();

    var fired = false;
    var once = function () {
      if (fired) return;
      fired = true;
      cb();
    };
    document.addEventListener("site:ready", once, { once: true });

    /* 兜底轮询：万一事件早于本脚本派发（或旧版 index.html 还没派发事件） */
    var tries = 0;
    var timer = setInterval(function () {
      if (document.body.classList.contains("is-ready")) {
        clearInterval(timer);
        once();
      } else if (++tries > 150) {          /* 约 15 秒 */
        clearInterval(timer);
        once();
      }
    }, 100);
  }

  function whenGsap(cb) {
    if (window.gsap) return cb(true);
    var tries = 0;
    var timer = setInterval(function () {
      if (window.gsap) { clearInterval(timer); cb(true); return; }
      if (++tries > 80) { clearInterval(timer); cb(false); }  /* 约 8 秒 */
    }, 100);
  }

  /* ---------- 4. 随门面淡出（可选） ---------- */
  var exitArmed = false;
  function armExit() {
    if (!EXIT_ON_SCROLL || exitArmed) return;
    if (!window.ScrollTrigger || !window.gsap) return;
    exitArmed = true;

    /* 只读、不回写：把标题在第一屏滚完这一段（约 1 屏）内淡出上移，
       不改门面的 pin 长度、不改任何既有 trigger。
       start/end 与门面自身的 pin 起点对齐（top top）。 */
    gsap.to(container, {
      autoAlpha: 0,
      y: -30,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "+=100%",
        scrub: true
      }
    });
  }

  /* ---------- 5. 开演 ---------- */
  if (window.__animMode === false) {
    /* ?hero=0 这类直达链接：门面整块是 display:none，不必演 */
    fallbackStatic();
    return;
  }

  /* 8 秒还没演上（库被拦 / 事件没来）就把文字静态显示出来，绝不留下空白 */
  var guard = setTimeout(function () { if (!started) fallbackStatic(); }, 8000);

  whenReady(function () {
    whenGsap(function (ok) {
      if (!ok) { clearTimeout(guard); fallbackStatic(); return; }
      clearTimeout(guard);
      play();
    });
  });

  /* ScrollTrigger 比 gsap 晚到时补挂淡出（入场早已开始，不阻塞） */
  var waitST = setInterval(function () {
    if (!started) return;
    if (window.ScrollTrigger) { clearInterval(waitST); armExit(); }
  }, 300);
  setTimeout(function () { clearInterval(waitST); }, 20000);
})();
