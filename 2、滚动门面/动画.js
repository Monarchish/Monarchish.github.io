/* Scroll logic ported from ti-inversa-scroll-animation-nextjs/app/page.js */
(function () {
  const ease = (x) => x * x * (3 - 2 * x);

  function initScroll() {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    const hero = document.querySelector(".hero");
    const heroContent = document.querySelector(".hero-content");
    const heroImg = document.querySelector(".hero-img");
    const heroImgElement = document.querySelector(".hero-img img");
    const heroImgSecond = document.querySelector(".hero-img img.img2");
    const heroMask = document.querySelector(".hero-mask");
    const heroGridOverlay = document.querySelector(".hero-grid-overlay");
    const bgFineGrid = document.querySelector(".bg-fine-grid");
    const marker1 = document.querySelector(".hotspot-marker");
    const marker2 = document.querySelector(".specialist-marker");
    const hotspotsSvg = document.querySelector(".hotspots-svg");
    const progressBar = document.querySelector(".hero-scroll-progress-bar");

    if (!hero || !heroContent || !heroImgElement) return;

    const heroContentHeight = heroContent.offsetHeight;
    const viewportHeight = window.innerHeight;
    const contentMoveDistance = heroContentHeight - viewportHeight;

    const heroImgHeight = heroImgElement.offsetHeight;
    const heroImgMoveDistance = heroImgHeight - viewportHeight;

    // 满屏倍数动态计算。
    // 蒙版窗 SVG（素材/03.门面蒙版窗.svg）是 inversa 原版的"像素阶梯"窗：1030×701
    // （高/宽 ≈ 0.681），一条连续路径沿 21 格咬合出不规则边缘（最大内缩约 6%）。
    // 电脑横屏下窗口放大 2.5 倍足够盖住屏幕；但手机竖屏（如 390×844）下
    // 窗口 2.5 倍只有约 497px 高，盖不住 844px 的屏 —— 上下会露出两大块黑底。
    // 所以"满屏档"按当前视口实测：保证窗口盖满屏幕，且不小于设计值 2.5。
    const MASK_ASPECT = 701 / 1030;
    const maskFrac = window.matchMedia("(max-width: 800px)").matches ? 0.75 : 0.5;
    const maskWinH = window.innerWidth * maskFrac * MASK_ASPECT; // scale=1 时窗口高
    let FULL = Math.max(2.5, (window.innerHeight / maskWinH) * 1.30); // 1.30 = 阶梯边缘最大内缩约 6~12% + 地址栏伸缩余量

    // Match source start state before first scrub tick
    gsap.set(heroMask, { scale: FULL, autoAlpha: 1 });
    gsap.set(heroGridOverlay, { opacity: 0 });
    gsap.set([marker1, marker2], { opacity: 0, visibility: "hidden" });
    if (hotspotsSvg) gsap.set(hotspotsSvg, { opacity: 0, visibility: "hidden" });

    /* ============================================================
       文案「动态输入」效果（参考 inversa 的 BaseTitle scrambleText）：
       滑动后字不是直接出现，而是一串乱码逐字落定为正文。
       每段文案只演一次（inversa 的 scrollTrigger 也是播一次不回放）。
       ============================================================ */
    const scrambleItems = [];
    heroContent.querySelectorAll("h1, h2, p").forEach((el) => {
      scrambleItems.push({ el, text: el.textContent, top: 0, done: false });
    });
    const measureScramble = () => {
      const base = heroContent.getBoundingClientRect().top;
      scrambleItems.forEach((it) => {
        it.top = it.el.getBoundingClientRect().top - base; // 相对 hero-content 的布局偏移
      });
    };
    measureScramble();
    const runScramble = (movedUp, vh) => {
      if (!window.ScrambleTextPlugin) return;
      scrambleItems.forEach((it) => {
        if (it.done || it.top - movedUp >= vh * 0.9) return;
        it.done = true;
        gsap.to(it.el, {
          duration: 2,
          scrambleText: { text: it.text, speed: 0.5 },
        });
      });
    };

    /* ============================================================
       鼠标跟随圆环（参考 inversa 的 Cursor 组件）：
       · 内层 SCROLL 标签跟得快（lerp 0.3），外层圆环跟得慢（lerp 0.1），
         两层速度差产生"甩尾"感
       · 外环弧线随门面滚动进度绘制（onUpdate 里写 stroke-dashoffset）
       · 出现在门面上时标签用 scrambleText 打字落定；触屏不显示
       ============================================================ */
    const heroCursor = document.querySelector(".hero-cursor");
    let cursorArc = null;
    if (heroCursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const cInner = heroCursor.querySelector(".hero-cursor-inner");
      const cOuter = heroCursor.querySelector(".hero-cursor-outer");
      const cLabel = heroCursor.querySelector(".hero-cursor-label");
      cursorArc = heroCursor.querySelector(".hero-cursor-progress");
      const cTarget = [window.innerWidth / 2, window.innerHeight / 2];
      const cSlow = cTarget.slice();
      const cFast = cTarget.slice();
      let cursorShown = false;
      const lerp = (a, b, t) => a + (b - a) * t;
      const applyPos = (el, p) => {
        el.style.transform = "translate3d(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px,0)";
      };
      const tick = () => {
        cFast[0] = lerp(cFast[0], cTarget[0], 0.3); cFast[1] = lerp(cFast[1], cTarget[1], 0.3);
        cSlow[0] = lerp(cSlow[0], cTarget[0], 0.1); cSlow[1] = lerp(cSlow[1], cTarget[1], 0.1);
        applyPos(cInner, cFast);
        applyPos(cOuter, cSlow);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      hero.addEventListener("mouseenter", () => {
        if (cursorShown) return;
        cursorShown = true;
        cFast[0] = cSlow[0] = cTarget[0];
        cFast[1] = cSlow[1] = cTarget[1];
        heroCursor.classList.add("is-visible");
        if (window.ScrambleTextPlugin) {
          gsap.to(cLabel, { duration: 1, scrambleText: { text: "SCROLL", speed: 0.5 } });
        }
      });
      hero.addEventListener("mouseleave", () => {
        cursorShown = false;
        heroCursor.classList.remove("is-visible");
      });
      window.addEventListener("mousemove", (e) => {
        cTarget[0] = e.clientX;
        cTarget[1] = e.clientY;
      }, { passive: true });
    }

    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: `+=${window.innerHeight * 4}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onEnter: () => gsap.set(heroMask, { autoAlpha: 1 }),
      onEnterBack: () => gsap.set(heroMask, { autoAlpha: 1 }),
      onLeave: () => gsap.set(heroMask, { autoAlpha: 0 }),
      onUpdate: (self) => {
        gsap.set(progressBar, {
          "--progress": self.progress,
        });

        // 圆环外圈的弧线：随门面滚动进度绘制（inversa 的 cursor:progress 同款）
        if (cursorArc) {
          cursorArc.style.strokeDashoffset = (100 * (1 - self.progress)).toFixed(2);
        }

        // 文案「动态输入」：内容上移后进入视口下缘 90% 线的段落开始打字落定
        runScramble(ease(self.progress) * contentMoveDistance, window.innerHeight);

        gsap.set(heroContent, {
          y: -ease(self.progress) * contentMoveDistance,
        });

        /* 图片位移分段（2026-10-29 同步）：与蒙版节奏同为 0.1 / 0.4 / 0.7，
           前 10% 连位移一起冻结，画面真的「完全保持原样」；
           让「保持-收缩-停留-散开」期间画面整体凝固，不再各自错拍。 */
        let heroImgProgress;
        if (self.progress < 0.1) {
          heroImgProgress = 0;
        } else if (self.progress < 0.4) {
          heroImgProgress = ease((self.progress - 0.1) / 0.3) * 0.65;
        } else if (self.progress < 0.7) {
          heroImgProgress = 0.65;
        } else {
          heroImgProgress = 0.65 + ease((self.progress - 0.7) / 0.3) * 0.35;
        }

        gsap.set(heroImg, {
          y: heroImgProgress * heroImgMoveDistance,
        });

        let heroMaskScale;
        let heroImgSaturation;
        let heroImgOverlayOpacity;

        /* 蒙版节奏（2026-10-29 用户定稿）—— 等价于 timeline 的四段：
             0) 保持 duration .1  ：progress 0    → 0.1   窗口维持 FULL，画面原样（先看完整地图）
             1) 收缩 duration .3  ：progress 0.1  → 0.4   黑幕从 FULL 收到 FOCUS
             2) 停留 duration .3  ：progress 0.4  → 0.7   数值冻结，形成明显停顿
             3) 散开 duration .3  ：progress 0.7  → 1     从 FOCUS 放回 FULL
           聚焦档不再收缩到 1（窗口太小、中心地图看不全），放大到 FOCUS：
           1.3 倍窗口 ≈ 视口宽的 65%，四周留出黑边、取景框悬浮感仍在
           （1.2 偏小、1.4 偏满，用户最终定在 1.3）；同时兜底不超过 FULL 的 70%，
           保证任何视口下「收缩 → 停留 → 散开」都成立。
           ⚠ 本次只改这一个 if-else 块里的分段与 scale 数值，
             Lenis 初始化 / ScrollTrigger 配置 / 其他动画一律未动。 */
        const FOCUS = Math.min(1.3, FULL * 0.7);

        if (self.progress < 0.1) {
          // 0) 前 10%：完全保持原样——窗口维持在 FULL，用户先看到完整地图
          heroMaskScale = FULL;
          heroImgSaturation = 1;
          heroImgOverlayOpacity = 0.16;
        } else if (self.progress < 0.4) {
          // 1) 收缩：0.1 → 0.4（推迟 10% 后才开始，占 30% 滚动距离）
          const phaseProgress = ease((self.progress - 0.1) / 0.3);
          heroMaskScale = FULL - phaseProgress * (FULL - FOCUS);
          heroImgSaturation = 1 - phaseProgress;
          heroImgOverlayOpacity = 0.16 + phaseProgress * 0.26;
        } else if (self.progress < 0.7) {
          // 2) 停留：占中间 30%，数值不变保持冻结
          heroMaskScale = FOCUS;
          heroImgSaturation = 0;
          heroImgOverlayOpacity = 0.42;
        } else {
          // 3) 散开：占最后 30%
          const phaseProgress = ease((self.progress - 0.7) / 0.3);
          heroMaskScale = FOCUS + phaseProgress * (FULL - FOCUS);
          heroImgSaturation = phaseProgress;
          heroImgOverlayOpacity = 0.42 - phaseProgress * 0.26;
        }

        /* 自检日志：确认 0% → 10% 区间里 scale 恒等于 FULL（蒙版还没开始收缩）。
           只在开局这段打，过了 10% 就自动静默；验收完可整段删掉。 */
        if (self.progress <= 0.1) {
          console.log(
            "[mask] 前10%保持原样 progress=" + self.progress.toFixed(3) +
            " scale=" + heroMaskScale.toFixed(2) + " FULL=" + FULL.toFixed(2)
          );
        }

        gsap.set(heroMask, {
          scale: heroMaskScale,
        });
        gsap.set(heroImgElement, {
          filter: `saturate(${heroImgSaturation})`,
        });
        gsap.set(heroImg, {
          "--overlay-opacity": heroImgOverlayOpacity,
        });

        /* 门面双图：从滚动一开始就匀速把第二张背景图渐变进来，p=1 换完；
           与饱和度节奏同步 */
        if (heroImgSecond) {
          const swapProgress = Math.min(1, Math.max(0, self.progress));
          gsap.set(heroImgSecond, {
            opacity: swapProgress,
            filter: `saturate(${heroImgSaturation})`,
          });
        }

        /* 出场时序（2026-10-29 用户定稿）—— 四阶段错峰，做出呼吸感：
             阶段1：蒙版收缩期（0.1→0.4）画面里什么都不要有
             阶段2：蒙版刚聚焦（0.42→0.46）大网格 + 底层细网格 先淡入
             阶段3：再延迟一点（0.52→0.56）红点 SF-01 淡入
             阶段4：最后（0.62→0.66）SF-02 淡入
           收尾统一在 0.7 之后（蒙版开始散开时）依次淡出。
           ⚠ 只改 opacity 的分段点，蒙版收缩/停留/散开的 scale 逻辑一行未动；
             Lenis 与 ScrollTrigger 配置同样未动。 */
        let heroGridOpacity;
        if (self.progress <= 0.42) {
          heroGridOpacity = 0;
        } else if (self.progress <= 0.46) {
          heroGridOpacity = ease((self.progress - 0.42) / 0.04);
        } else if (self.progress <= 0.7) {
          heroGridOpacity = 1;
        } else if (self.progress <= 0.75) {
          heroGridOpacity = 1 - ease((self.progress - 0.7) / 0.05);
        } else {
          heroGridOpacity = 0;
        }

        gsap.set(heroGridOverlay, {
          opacity: heroGridOpacity,
        });
        if (bgFineGrid) {
          gsap.set(bgFineGrid, {
            opacity: heroGridOpacity,
          });
        }

        /* ===== HUD 严格时序（2026-10-29 终极版，用户定稿）=====
           0–0.38   全部隐藏（散点/红点/绿点 opacity 0 + visibility hidden，绝不出现在黑幕外）
           0.38–0.45 外围散点 SVG 淡入
           0.45–0.52 HOTSPOT 红点淡入
           0.52–0.60 SPECIALIST 绿点淡入
           0.60–0.70 全部保持显示（蒙版冻结期）
           0.70–0.75 全部迅速淡出，黑幕散开时屏幕干净
           ⚠ 只改 HUD 的 opacity/visibility；蒙版 scale 分段、Lenis、ScrollTrigger 一行未动。 */
        const hudFade = (p, inStart, inEnd) => {
          if (p < inStart) return 0;
          if (p < inEnd) return ease((p - inStart) / (inEnd - inStart));
          if (p <= 0.7) return 1;
          if (p <= 0.75) return 1 - ease((p - 0.7) / 0.05);
          return 0;
        };
        const svgOp = hudFade(self.progress, 0.38, 0.45);
        const hotspotOp = hudFade(self.progress, 0.45, 0.52);
        const specialistOp = hudFade(self.progress, 0.52, 0.6);
        if (hotspotsSvg) {
          gsap.set(hotspotsSvg, { opacity: svgOp, visibility: svgOp > 0.001 ? "visible" : "hidden" });
        }
        gsap.set(marker1, { opacity: hotspotOp, visibility: hotspotOp > 0.001 ? "visible" : "hidden" });
        gsap.set(marker2, { opacity: specialistOp, visibility: specialistOp > 0.001 ? "visible" : "hidden" });
      },
    });

    /* ---------- 右上角 Menu（原「跳过动画 · 进入手册」，行为不变） ---------- */
    document.querySelector(".hero-menu")?.addEventListener("click", () => {
      const target = document.getElementById("manual") || document.getElementById("siteShell");
      const t = target || document.querySelector(".site-shell");
      if (!t) return;
      const y = t.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: "smooth" });
    });

    window.addEventListener("resize", () => {
      // 转屏/改窗口尺寸后满屏倍数要重算（横竖屏切换时差异很大）
      const maskFracR = window.matchMedia("(max-width: 800px)").matches ? 0.75 : 0.5;
      FULL = Math.max(2.5, (window.innerHeight / (window.innerWidth * maskFracR * MASK_ASPECT)) * 1.30);
      measureScramble(); // 文案的布局偏移也跟着变，重新量一遍
      ScrollTrigger.refresh();
    });
  }

    window.SupportFutureScroll = { init: initScroll };

    /* ===== v25：散点雷达随机漂移（纯新增，独立于门面逻辑；gsap 由加载器保证已就绪） =====
       仅给 .drift-point 加无限 yoyo 漂移 + 透明度随机跳动，不影响任何网格/蒙版/Lenis 行为。 */
    if (window.gsap) {
      const driftDots = document.querySelectorAll('.drift-point');
      driftDots.forEach(function (dot) {
        gsap.to(dot, {
          x: 'random(-8, 8)',
          y: 'random(-8, 8)',
          duration: 'random(2, 4)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
        gsap.to(dot, {
          opacity: 'random(0.7, 1)',
          duration: 'random(1, 2.5)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    }
})();
