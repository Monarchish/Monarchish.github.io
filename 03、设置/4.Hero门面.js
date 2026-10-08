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
    // 蒙版窗 SVG（8.门面蒙版窗.svg）是横版的 1632×1056（高/宽 ≈ 0.647）。
    // 电脑横屏下窗口放大 2.5 倍足够盖住屏幕；但手机竖屏（如 390×844）下
    // 窗口 2.5 倍只有约 473px 高，盖不住 844px 的屏 —— 上下会露出两大块黑底。
    // 所以"满屏档"按当前视口实测：保证窗口盖满屏幕，且不小于设计值 2.5。
    const MASK_ASPECT = 1056 / 1632;
    const maskFrac = window.matchMedia("(max-width: 800px)").matches ? 0.75 : 0.5;
    const maskWinH = window.innerWidth * maskFrac * MASK_ASPECT; // scale=1 时窗口高
    let FULL = Math.max(2.5, (window.innerHeight / maskWinH) * 1.30); // 1.30 = 蒙版窗边缘有"缺口"造型（实测最多只能干净覆盖 0.82），再留地址栏伸缩余量

    // Match source start state before first scrub tick
    gsap.set(heroMask, { scale: FULL, autoAlpha: 1 });
    gsap.set(heroGridOverlay, { opacity: 0 });
    gsap.set([marker1, marker2], { opacity: 0 });

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

    document.querySelector(".skip-hero")?.addEventListener("click", () => {
      const target = document.getElementById("manual");
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: "smooth" });
    });

    window.addEventListener("resize", () => {
      // 转屏/改窗口尺寸后满屏倍数要重算（横竖屏切换时差异很大）
      const maskFracR = window.matchMedia("(max-width: 800px)").matches ? 0.75 : 0.5;
      FULL = Math.max(2.5, (window.innerHeight / (window.innerWidth * maskFracR * MASK_ASPECT)) * 1.30);
      ScrollTrigger.refresh();
    });
  }

  window.SupportFutureScroll = { init: initScroll };
})();
