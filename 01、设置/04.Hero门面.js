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
    const heroMask = document.querySelector(".hero-mask");
    const heroGridOverlay = document.querySelector(".hero-grid-overlay");
    const marker1 = document.querySelector(".marker-1");
    const marker2 = document.querySelector(".marker-2");
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
    gsap.set([marker1, marker2], { opacity: 0 });

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

        let heroImgProgress;
        if (self.progress < 0.45) {
          heroImgProgress = ease(self.progress / 0.45) * 0.65;
        } else if (self.progress < 0.75) {
          heroImgProgress = 0.65;
        } else {
          heroImgProgress = 0.65 + ease((self.progress - 0.75) / 0.25) * 0.35;
        }

        gsap.set(heroImg, {
          y: heroImgProgress * heroImgMoveDistance,
        });

        let heroMaskScale;
        let heroImgSaturation;
        let heroImgOverlayOpacity;

        if (self.progress <= 0.4) {
          heroMaskScale = FULL;
          heroImgSaturation = 1;
          heroImgOverlayOpacity = 0.35;
        } else if (self.progress <= 0.5) {
          const phaseProgress = ease((self.progress - 0.4) / 0.1);
          heroMaskScale = FULL - phaseProgress * (FULL - 1);
          heroImgSaturation = 1 - phaseProgress;
          heroImgOverlayOpacity = 0.35 + phaseProgress * 0.35;
        } else if (self.progress <= 0.75) {
          heroMaskScale = 1;
          heroImgSaturation = 0;
          heroImgOverlayOpacity = 0.7;
        } else if (self.progress <= 0.85) {
          const phaseProgress = ease((self.progress - 0.75) / 0.1);
          heroMaskScale = 1 + phaseProgress * (FULL - 1);
          heroImgSaturation = phaseProgress;
          heroImgOverlayOpacity = 0.7 - phaseProgress * 0.35;
        } else {
          heroMaskScale = FULL;
          heroImgSaturation = 1;
          heroImgOverlayOpacity = 0.35;
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

        let heroGridOpacity;
        if (self.progress <= 0.475) {
          heroGridOpacity = 0;
        } else if (self.progress <= 0.5) {
          heroGridOpacity = ease((self.progress - 0.475) / 0.025);
        } else if (self.progress <= 0.75) {
          heroGridOpacity = 1;
        } else if (self.progress <= 0.775) {
          heroGridOpacity = 1 - ease((self.progress - 0.75) / 0.025);
        } else {
          heroGridOpacity = 0;
        }

        gsap.set(heroGridOverlay, {
          opacity: heroGridOpacity,
        });

        let marker1Opacity;
        if (self.progress <= 0.5) {
          marker1Opacity = 0;
        } else if (self.progress <= 0.525) {
          marker1Opacity = ease((self.progress - 0.5) / 0.025);
        } else if (self.progress <= 0.7) {
          marker1Opacity = 1;
        } else if (self.progress <= 0.75) {
          marker1Opacity = 1 - ease((self.progress - 0.7) / 0.05);
        } else {
          marker1Opacity = 0;
        }

        gsap.set(marker1, {
          opacity: marker1Opacity,
        });

        let marker2Opacity;
        if (self.progress <= 0.55) {
          marker2Opacity = 0;
        } else if (self.progress <= 0.575) {
          marker2Opacity = ease((self.progress - 0.55) / 0.025);
        } else if (self.progress <= 0.7) {
          marker2Opacity = 1;
        } else if (self.progress <= 0.75) {
          marker2Opacity = 1 - ease((self.progress - 0.7) / 0.05);
        } else {
          marker2Opacity = 0;
        }

        gsap.set(marker2, {
          opacity: marker2Opacity,
        });
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
})();
