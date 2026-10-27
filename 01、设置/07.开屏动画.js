/* Ported from ti-landing-page-reveal-004/script.js — no Club SplitText */
(function () {
  function splitLines(root) {
    root.querySelectorAll("p").forEach((p) => {
      if (p.querySelector(".line-mask")) return;
      const text = p.textContent;
      p.textContent = "";
      const mask = document.createElement("span");
      mask.className = "line-mask";
      const line = document.createElement("span");
      line.className = "line";
      line.textContent = text;
      mask.appendChild(line);
      p.appendChild(mask);
    });
  }

  function splitWords(el) {
    if (!el || el.querySelector(".word-mask")) return;
    const raw = el.textContent.trim();
    el.textContent = "";
    let parts;
    if (raw.includes(" ")) {
      parts = raw.split(/\s+/);
    } else if (/^[\u4e00-\u9fff]+$/.test(raw) && raw.length === 4) {
      parts = [raw.slice(0, 2), raw.slice(2)];
    } else if (/^[\u4e00-\u9fff]+$/.test(raw)) {
      parts = [...raw];
    } else {
      parts = raw.match(/[\u4e00-\u9fff]+|[A-Za-z0-9]+|[^\s]/g) || [raw];
    }

    parts.forEach((part, i) => {
      if (i > 0 && raw.includes(" ")) el.appendChild(document.createTextNode(" "));
      const mask = document.createElement("span");
      mask.className = "word-mask";
      // Keep CJK stagger readable: small gap between word masks
      // 最后一个词不加边距：否则标题整体会被这 0.12em 顶得偏离正中
      if (!raw.includes(" ") && i < parts.length - 1) mask.style.marginRight = "0.12em";
      const word = document.createElement("span");
      word.className = "word";
      word.textContent = part;
      mask.appendChild(word);
      el.appendChild(mask);
    });
  }

  function bootReveal(gsap, CustomEase) {
    const root = document.getElementById("reveal-root");
    if (!root) return Promise.resolve();

    gsap.registerPlugin(CustomEase);
    CustomEase.create("hop", "0.9, 0, 0.1, 1");
    CustomEase.create("glide", "0.8, 0, 0.2, 1");

    let preloaderComplete = false;

    const preloaderBtn = root.querySelector(".preloader-btn-container");
    const btnOutlineTrack = root.querySelector(".stroke-track");
    const btnOutlineProgress = root.querySelector(".stroke-progress");
    const svgPathLength = btnOutlineTrack.getTotalLength();

    splitLines(root);
    splitWords(root.querySelector(".reveal-stage h1"));

    gsap.set([btnOutlineTrack, btnOutlineProgress], {
      strokeDasharray: svgPathLength,
      strokeDashoffset: svgPathLength,
    });

    const introTl = gsap.timeline({ delay: 0.35 });

    introTl
      .to(root.querySelectorAll(".preloader .p-row p .line"), {
        y: "0%",
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.1,
      })
      .to(
        btnOutlineTrack,
        {
          strokeDashoffset: 0,
          duration: 2,
          ease: "hop",
        },
        "<"
      )
      .to(
        root.querySelector(".pbc-svg-strokes svg"),
        {
          rotation: 270,
          duration: 2,
          ease: "hop",
        },
        "<"
      );

    const progressStops = [0.2, 0.25, 0.85, 1].map((base, i) => {
      if (i === 3) return 1;
      return base + (Math.random() - 0.5) * 0.1;
    });

    progressStops.forEach((stop, i) => {
      introTl.to(btnOutlineProgress, {
        strokeDashoffset: svgPathLength - svgPathLength * stop,
        duration: 0.75,
        ease: "glide",
        delay: i === 0 ? 0.3 : 0.3 + Math.random() * 0.2,
      });
    });

    introTl
      .to(
        root.querySelector("#pbc-logo"),
        {
          opacity: 0,
          duration: 0.35,
          ease: "power1.out",
        },
        "-=0.25"
      )
      .to(
        preloaderBtn,
        {
          scale: 0.9,
          duration: 1.5,
          ease: "hop",
        },
        "-=0.5"
      )
      .to(
        root.querySelectorAll("#pbc-label .line"),
        {
          y: "0%",
          duration: 0.75,
          ease: "power3.out",
          onComplete: () => {
            preloaderComplete = true;
          },
        },
        "-=0.75"
      )
      .add(() => {
        preloaderComplete = true;
      });

    gsap.delayedCall(11, () => {
      preloaderComplete = true;
    });

    return new Promise((resolve) => {
      const finishToSite = () => {
        gsap.to(root, {
          autoAlpha: 0,
          duration: 0.55,
          ease: "power2.out",
          onComplete: () => {
            root.classList.add("is-done");
            root.style.display = "none";
            resolve();
          },
        });
      };

      const engage = () => {
        if (!preloaderComplete) return;
        preloaderComplete = false;

        const exitTl = gsap.timeline({
          onComplete: () => {
            // Brief hold on title, then hand off to main site
            gsap.delayedCall(1.1, finishToSite);
          },
        });

        exitTl
          .to(root.querySelector(".preloader"), {
            scale: 0.75,
            duration: 1.25,
            ease: "hop",
          })
          .to(
            [btnOutlineTrack, btnOutlineProgress],
            {
              strokeDashoffset: -svgPathLength,
              duration: 1.25,
              ease: "hop",
            },
            "<"
          )
          .to(
            root.querySelectorAll("#pbc-label .line"),
            {
              y: "-100%",
              duration: 0.75,
              ease: "power3.out",
            },
            "-=1.25"
          )
          .to(
            root.querySelectorAll("#pbc-outro-label .line"),
            {
              y: "0%",
              duration: 0.75,
              ease: "power3.out",
            },
            "-=0.75"
          )
          .to(root.querySelector(".preloader"), {
            clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
            duration: 1.5,
            ease: "hop",
          })
          .to(
            root.querySelector(".preloader-revealer"),
            {
              clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
              duration: 1.5,
              ease: "hop",
              onComplete: () => {
                gsap.set(root.querySelector(".preloader"), { display: "none" });
              },
            },
            "-=1.45"
          )
          .to(root.querySelector(".reveal-stage"), {
            scale: 1,
            duration: 1.25,
            ease: "hop",
          })
          .to(
            root.querySelectorAll(".reveal-stage h1 .word"),
            {
              y: "0%",
              duration: 1,
              ease: "glide",
              stagger: 0.06,
            },
            "-=1.75"
          );
      };

      preloaderBtn.addEventListener("click", engage);
      preloaderBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          engage();
        }
      });
    });
  }

  window.SupportFutureReveal = { boot: bootReveal };
})();
