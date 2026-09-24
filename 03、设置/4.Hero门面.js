/* ============================================================
   03、设置 · 4.Hero门面.js
   ------------------------------------------------------------
   这是什么：首页「支援未来」门面——一段可以往下滚的长流程。
   【逐步照教学视频复刻】TTTISE《coding a website (-ish) animation》
   （React + Next.js 教学项目 coding-a-website-(-ish)-animation），
   不再照 inversa 源码、不掺自己的设计想法：

     结构（照 page.js）：
       section.hero
       ├ .hero-img > img            竖长照片带（200svh，随进度缓移）
       ├ .hero-mask                 fixed 观察窗（满幅渐变 − 锯齿 SVG）
       ├ .hero-grid-overlay > img   网格纹理（分段显现）
       ├ .marker.marker-1           标记一 Anchor Field（橙红）
       ├ .marker.marker-2           标记二 Drift Field（黄绿）
       ├ .hero-content              400svh 文字层（4 块左右交替）
       └ .hero-scroll-progress-bar  右侧进度线（--progress 缩放）
       section.outro                收场白

     滚动（照 ScrollTrigger.create）：
       trigger: .hero, start: "top top", end: "+= 4 × 视口高",
       pin: true, pinSpacing: true, scrub: 1,
       onUpdate 里按 progress 分档：
         · 照片带 y = heroImgProgress × (带高 − 视口高)
           （0→0.45 缓动爬到 5%，平持，0.75→1 爬到 40%）
         · 窗 scale：2.5 →(0.4-0.5)→ 1 →(0.75-0.85)→ 2.5
         · 照片 saturate：1 → 0 → 1（同上分档）
         · 压暗 --overlay-opacity：0.35 → 0.7 → 0.35
         · 网格：0 →(0.475-0.5)→ 1 →(0.75-0.775)→ 0
         · 标记一：0.5-0.525 进 / 0.7-0.75 出
         · 标记二：0.55-0.575 进 / 0.7-0.75 出
         · 进度线 --progress = progress
       缓动一律 smoothstep：ease = x·x·(3−2x)
     平滑滚动（照 ReactLenis root）：Lenis + GSAP ticker；
     滚出门面（hero-passed）后即销毁，目录阶段保持原生滚轮。

   本站自有配置（不属于教学版、但保留）：LOADING 开屏、门面顶栏。
   它不做的事：不碰侧栏、不碰目录、不碰正文——那些是 1.站点主程序.js 的活。
   ============================================================ */
(function () {
    "use strict";

    /* 这一趟旅程上写的字：文案照抄教学版（要换中文只改这里）。
       照片位先用旧主图 A 占位，用户给图后同路径换文件即可。 */
    var CONTENT = {
        logo: "支援未来",
        barLink: "直达目录",
        imgSrc: "03、设置/6.门面主图A.jpg",
        markers: [
            { cls: "marker-1", label: "Anchor Field" },
            { cls: "marker-2", label: "Drift Field" }
        ],
        blocks: [
            { title: "Location Framework", body: "" },
            {
                title: "Coordinate Mapping",
                body: "Terrain data is interpreted through directional vectors. Movement responds to relative position rather than absolute distance."
            },
            {
                title: "Active Locations",
                body: "Key points are indexed within the field. Each location functions as a reference for spatial alignment and transition logic."
            },
            {
                title: "Spatial Center",
                body: "The system converges toward a balanced focal region. Motion decelerates as positional variance reaches equilibrium."
            }
        ],
        outroText: "The system has reached its final spatial state.",
        /* LOADING 开屏（本站自有） */
        boot: {
            word: "LOADING...",
            freq: "16HZ"
        }
    };

    /* 网格纹理（教学版 /grid-overlay.svg 的等形资产，程序自生成：
       方格阵 + 四缘凸出格），内联免请求 */
    var GRID_URI = "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='1120'%20height='640'%20viewBox='0%200%201120%20640'%3E%3Cg%20fill='none'%20stroke='%23ffffff'%20stroke-width='2'%3E%3Cpath%20d='M0%200h80v80h-80zM80%200h80v80h-80zM160%200h80v80h-80zM240%200h80v80h-80zM320%200h80v80h-80zM400%200h80v80h-80zM480%200h80v80h-80zM560%200h80v80h-80zM640%200h80v80h-80zM720%200h80v80h-80zM800%200h80v80h-80zM880%200h80v80h-80zM960%200h80v80h-80zM1040%200h80v80h-80zM0%2080h80v80h-80zM80%2080h80v80h-80zM160%2080h80v80h-80zM240%2080h80v80h-80zM320%2080h80v80h-80zM400%2080h80v80h-80zM480%2080h80v80h-80zM560%2080h80v80h-80zM640%2080h80v80h-80zM720%2080h80v80h-80zM800%2080h80v80h-80zM880%2080h80v80h-80zM960%2080h80v80h-80zM1040%2080h80v80h-80zM0%20160h80v80h-80zM80%20160h80v80h-80zM160%20160h80v80h-80zM240%20160h80v80h-80zM320%20160h80v80h-80zM400%20160h80v80h-80zM480%20160h80v80h-80zM560%20160h80v80h-80zM640%20160h80v80h-80zM720%20160h80v80h-80zM800%20160h80v80h-80zM880%20160h80v80h-80zM960%20160h80v80h-80zM1040%20160h80v80h-80zM0%20240h80v80h-80zM80%20240h80v80h-80zM160%20240h80v80h-80zM240%20240h80v80h-80zM320%20240h80v80h-80zM400%20240h80v80h-80zM480%20240h80v80h-80zM560%20240h80v80h-80zM640%20240h80v80h-80zM720%20240h80v80h-80zM800%20240h80v80h-80zM880%20240h80v80h-80zM960%20240h80v80h-80zM1040%20240h80v80h-80zM0%20320h80v80h-80zM80%20320h80v80h-80zM160%20320h80v80h-80zM240%20320h80v80h-80zM320%20320h80v80h-80zM400%20320h80v80h-80zM480%20320h80v80h-80zM560%20320h80v80h-80zM640%20320h80v80h-80zM720%20320h80v80h-80zM800%20320h80v80h-80zM880%20320h80v80h-80zM960%20320h80v80h-80zM1040%20320h80v80h-80zM0%20400h80v80h-80zM80%20400h80v80h-80zM160%20400h80v80h-80zM240%20400h80v80h-80zM320%20400h80v80h-80zM400%20400h80v80h-80zM480%20400h80v80h-80zM560%20400h80v80h-80zM640%20400h80v80h-80zM720%20400h80v80h-80zM800%20400h80v80h-80zM880%20400h80v80h-80zM960%20400h80v80h-80zM1040%20400h80v80h-80zM0%20480h80v80h-80zM80%20480h80v80h-80zM160%20480h80v80h-80zM240%20480h80v80h-80zM320%20480h80v80h-80zM400%20480h80v80h-80zM480%20480h80v80h-80zM560%20480h80v80h-80zM640%20480h80v80h-80zM720%20480h80v80h-80zM800%20480h80v80h-80zM880%20480h80v80h-80zM960%20480h80v80h-80zM1040%20480h80v80h-80zM0%20560h80v80h-80zM80%20560h80v80h-80zM160%20560h80v80h-80zM240%20560h80v80h-80zM320%20560h80v80h-80zM400%20560h80v80h-80zM480%20560h80v80h-80zM560%20560h80v80h-80zM640%20560h80v80h-80zM720%20560h80v80h-80zM800%20560h80v80h-80zM880%20560h80v80h-80zM960%20560h80v80h-80zM1040%20560h80v80h-80zM160%20-80h80v80h-80zM480%20-80h80v80h-80zM720%20-80h80v80h-80zM960%20-80h80v80h-80zM0%20640h80v80h-80zM320%20640h80v80h-80zM560%20640h80v80h-80zM880%20640h80v80h-80zM1040%20640h80v80h-80zM-80%2080h80v80h-80zM-80%20320h80v80h-80zM-80%20480h80v80h-80zM1120%20160h80v80h-80zM1120%20400h80v80h-80zM1120%20560h80v80h-80z'/%3E%3C/g%3E%3C/svg%3E";

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

    /* ---------- 有没有见过（回访）---------- */
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

    /* ============================================================
       搭画面（DOM 逐步照教学版 page.js 的 JSX）
       ============================================================ */
    var markersHtml = CONTENT.markers.map(function (m) {
        return '<div class="marker ' + m.cls + '">' +
            '<span class="marker-icon"></span>' +
            '<p class="marker-label">' + escapeHtml(m.label) + "</p>" +
            "</div>";
    }).join("");

    var blocksHtml = CONTENT.blocks.map(function (b) {
        return '<div class="hero-content-block">' +
            '<div class="hero-content-copy">' +
            "<h2>" + escapeHtml(b.title) + "</h2>" +
            (b.body ? "<p>" + escapeHtml(b.body) + "</p>" : "") +
            "</div></div>";
    }).join("");
    /* 第 1 块在教学版里是 h1（大标题），其余是 h2 */
    blocksHtml = blocksHtml.replace("<h2>" + escapeHtml(CONTENT.blocks[0].title) + "</h2>",
        "<h1>" + escapeHtml(CONTENT.blocks[0].title) + "</h1>");

    stage.innerHTML =
        /* 照片带（竖长 200svh，bottom:0；压暗层是 CSS ::after） */
        '<div class="hero-img"><img src="' + encodeURI(CONTENT.imgSrc) + '" alt="" /></div>' +
        /* fixed 观察窗（窗外深色、窗内透出照片） */
        '<div class="hero-mask"></div>' +
        /* 网格纹理 */
        '<div class="hero-grid-overlay"><img src="' + GRID_URI + '" alt="" /></div>' +
        /* 两个脉冲标记点 */
        markersHtml +
        /* 400svh 文字层 */
        '<div class="hero-content">' + blocksHtml + "</div>" +
        /* 右侧进度线 */
        '<div class="hero-scroll-progress-bar"></div>' +
        /* 顶栏（本站自有） */
        '<div class="hero-bar">' +
        '<span class="hero-bar-logo">' + escapeHtml(CONTENT.logo) + "</span>" +
        '<a class="hero-bar-link" href="#siteShell" data-jump-manual>' + escapeHtml(CONTENT.barLink) + "</a>" +
        "</div>" +
        /* LOADING 开屏（本站自有） */
        '<div class="hero-boot">' +
        '<div class="hero-boot-grid"></div>' +
        '<div class="hero-boot-frame"></div>' +
        '<i class="hero-boot-line"></i>' +
        '<span class="hero-boot-word"></span>' +
        '<div class="hero-boot-readout">' +
        '<span class="hero-boot-row"><b>PHASE</b><i class="hero-boot-phase">0%</i></span>' +
        '<span class="hero-boot-row"><b>FREQ</b><i>' + escapeHtml(CONTENT.boot.freq) + "</i></span>" +
        "</div>" +
        "</div>";

    /* ---------- 顶栏「直达目录」 ---------- */
    function goManual(e) {
        if (e) e.preventDefault();
        var shell = document.getElementById("siteShell");
        if (!shell) return;
        var y = shell.offsetTop;
        /* 先归还原生滚轮，再平滑滚过去（Lenis 在跑时原生 scrollTo 会被拉回） */
        stopSmooth();
        try { window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }); }
        catch (err) { window.scrollTo(0, y); }
    }

    stage.querySelectorAll("[data-jump-manual]").forEach(function (a) {
        a.addEventListener("click", goManual);
    });

    /* ============================================================
       Lenis 平滑滚动（照教学版 <ReactLenis root />）
       ------------------------------------------------------------
       ReactLenis root 做的事 = 建一个 Lenis 实例 + 自跑 raf。
       原生等价：new Lenis() + raf 循环；再按官方推荐接进 GSAP
       ticker（lenis.on("scroll", ScrollTrigger.update)）。
       门面阶段跑 Lenis；一旦滚进目录（hero-passed）就销毁，
       站点正文回到原生 1:1 滚轮。
       ============================================================ */
    var lenis = null;
    var lenisTickerFn = null;

    function mountLenis() {
        if (reduce || lenis || !window.Lenis) return;
        try {
            lenis = new window.Lenis();
        } catch (e) { lenis = null; return; }
        if (window.gsap && window.ScrollTrigger) {
            lenis.on("scroll", window.ScrollTrigger.update);
            lenisTickerFn = function (time) { lenis.raf(time * 1000); };
            window.gsap.ticker.add(lenisTickerFn);
            window.gsap.ticker.lagSmoothing(0);
        } else {
            lenisTickerFn = function (t) { lenis.raf(t); requestAnimationFrame(lenisTickerFn); };
            requestAnimationFrame(lenisTickerFn);
        }
        window.HeroFacade.lenis = lenis;
    }

    function stopSmooth() {
        if (!lenis) return;
        try {
            if (lenisTickerFn && window.gsap) window.gsap.ticker.remove(lenisTickerFn);
            lenis.destroy();
        } catch (e) { /* 忽略 */ }
        lenis = null;
        lenisTickerFn = null;
        window.HeroFacade.lenis = null;
    }

    /* ============================================================
       滚动剧情：逐步照教学版 ScrollTrigger.create + onUpdate
       ------------------------------------------------------------
       pin: true + pinSpacing: true 由 GSAP 生成撑杆，舞台只有一屏高，
       行程是 4 × 视口高。scrub: 1 让画面用 1 秒追上滚轮（教学版同款）。
       onUpdate 里的全部分档逻辑与数值原样照抄。
       ============================================================ */
    function setupScroll() {
        if (!window.gsap || !window.ScrollTrigger || reduce) return;
        var g = window.gsap;
        g.registerPlugin(window.ScrollTrigger);

        /* 教学版里的 8 个 ref → 这里按类名查 */
        var heroImg = stage.querySelector(".hero-img");
        var heroImgElement = stage.querySelector(".hero-img img");
        var heroMask = stage.querySelector(".hero-mask");
        var heroGridOverlay = stage.querySelector(".hero-grid-overlay");
        var marker1 = stage.querySelector(".marker.marker-1");
        var marker2 = stage.querySelector(".marker.marker-2");
        var heroContent = stage.querySelector(".hero-content");
        var progressBar = stage.querySelector(".hero-scroll-progress-bar");

        /* 教学版：内容/照片的“可移动距离” = 自身高 − 视口高 */
        var viewportHeight = window.innerHeight;
        var heroContentHeight = heroContent.offsetHeight;
        var heroContentMoveDistance = heroContentHeight - viewportHeight;
        var heroImgHeight = heroImg.offsetHeight;
        var heroImgMoveDistance = heroImgHeight - viewportHeight;

        /* 教学版缓动：smoothstep */
        var ease = function (x) { return x * x * (3 - 2 * x); };

        /* progress = 0 的初始态（防 ScrollTrigger 晚一帧时闪现） */
        g.set(marker1, { opacity: 0 });
        g.set(marker2, { opacity: 0 });
        g.set(heroGridOverlay, { opacity: 0 });
        g.set(progressBar, { "--progress": 0 });

        /* 注意：用 window.ScrollTrigger.create，不要写 g.ScrollTrigger.create——
           GSAP 3.12 的 UMD 里 gsap 对象上没有挂 ScrollTrigger 属性
           （v6 旧版这里就埋了个 TypeError，把后面的注释解码全炸没了） */
        window.ScrollTrigger.create({
            trigger: stage,
            start: "top top",
            end: "+=" + window.innerHeight * 4 + "px",
            pin: true,
            pinSpacing: true,
            scrub: 1,
            onUpdate: function (self) {
                /* 进度线（教学版：写 CSS 变量 --progress，CSS 里 scaleY） */
                g.set(progressBar, { "--progress": self.progress });

                /* 文字层上移 */
                g.set(heroContent, { y: -self.progress * heroContentMoveDistance });

                /* 照片带缓移：0→0.45 爬到 5%，平持到 0.75，再爬到 40% */
                var heroImgProgress;
                if (self.progress <= 0.45) {
                    heroImgProgress = ease(self.progress / 0.45) * 0.05;
                } else if (self.progress <= 0.75) {
                    heroImgProgress = 0.05;
                } else {
                    heroImgProgress = 0.05 + ease((self.progress - 0.75) / 0.25) * 0.35;
                }
                g.set(heroImg, { y: heroImgProgress * heroImgMoveDistance });

                /* 窗 scale / 照片去饱和 / 压暗：0.4 / 0.5 / 0.75 / 0.85 四档 */
                var heroMaskScale, heroImgSaturation, heroImgOverlayOpacity;
                if (self.progress <= 0.4) {
                    heroMaskScale = 2.5;
                    heroImgSaturation = 1;
                    heroImgOverlayOpacity = 0.35;
                } else if (self.progress <= 0.5) {
                    var phaseA = ease((self.progress - 0.4) / 0.1);
                    heroMaskScale = 2.5 - phaseA * 1.5;
                    heroImgSaturation = 1 - phaseA;
                    heroImgOverlayOpacity = 0.35 + phaseA * 0.35;
                } else if (self.progress <= 0.75) {
                    heroMaskScale = 1;
                    heroImgSaturation = 0;
                    heroImgOverlayOpacity = 0.7;
                } else if (self.progress <= 0.85) {
                    var phaseB = ease((self.progress - 0.75) / 0.1);
                    heroMaskScale = 1 + phaseB * 1.5;
                    heroImgSaturation = phaseB;
                    heroImgOverlayOpacity = 0.7 - phaseB * 0.35;
                } else {
                    heroMaskScale = 2.5;
                    heroImgSaturation = 1;
                    heroImgOverlayOpacity = 0.35;
                }

                g.set(heroMask, { scale: heroMaskScale });
                g.set(heroImgElement, { filter: "saturate(" + heroImgSaturation + ")" });
                g.set(heroImg, { "--overlay-opacity": heroImgOverlayOpacity });

                /* 网格：0.475-0.5 进，0.75-0.775 出 */
                var heroGridOpacity;
                if (self.progress < 0.475) {
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
                g.set(heroGridOverlay, { opacity: heroGridOpacity });

                /* 标记一：0.5-0.525 进，0.7-0.75 出 */
                var marker1Opacity;
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
                g.set(marker1, { opacity: marker1Opacity });

                /* 标记二：0.55-0.575 进，0.7-0.75 出（比标记一晚半拍） */
                var marker2Opacity;
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
                g.set(marker2, { opacity: marker2Opacity });
            }
        });

        window.addEventListener("resize", function () {
            g.ScrollTrigger.refresh();
        });
    }

    /* ============================================================
       LOADING 开屏（本站自有，保留不动）
       ============================================================ */
    function bootSequence(done) {
        var boot = stage.querySelector(".hero-boot");
        if (!boot || !window.gsap || reduce) {
            if (boot) boot.remove();
            document.documentElement.classList.remove("hero-booting");
            done();
            return;
        }
        var wordEl = boot.querySelector(".hero-boot-word");
        var lineEl = boot.querySelector(".hero-boot-line");
        var frameEl = boot.querySelector(".hero-boot-frame");
        var phaseEl = boot.querySelector(".hero-boot-phase");
        var g = window.gsap;
        var WORD = CONTENT.boot.word;
        var total = isReturn ? 0.85 : 2.2;

        document.documentElement.classList.add("hero-booting");
        if (isReturn) {
            wordEl.textContent = WORD;
        } else {
            wordEl.textContent = "";
        }

        var frameW = frameEl.offsetWidth || Math.min(window.innerWidth * 0.31, 460);
        var growTo = Math.round(frameW * 1.2683);
        if (!isFinite(growTo) || growTo <= 0) growTo = Math.round((boot.clientHeight || 800) * 0.5);

        var tl = g.timeline({
            onComplete: function () {
                document.documentElement.classList.remove("hero-booting");
                boot.remove();
                done();
            }
        });

        if (!isReturn) {
            WORD.split("").forEach(function (ch, idx) {
                tl.call(function (c) { wordEl.textContent += c; }, [ch], 0.12 + idx * 0.055);
            });
        }
        tl.to(lineEl, { scaleX: 1, duration: total, ease: "power2.out" }, 0);
        var fm = { h: parseFloat(frameEl.style.height || "0") || 0 };
        tl.to(fm, {
            h: growTo, duration: total, ease: "power2.out",
            onUpdate: function () {
                frameEl.style.height = fm.h + "px";
                phaseEl.textContent = Math.round((fm.h / growTo) * 100) + "%";
            }
        }, 0);
        tl.to({}, { duration: isReturn ? 0.12 : 0.35 });
        if (!isReturn) {
            tl.call(function () { phaseEl.textContent = "100%"; });
        }
        tl.to(boot.querySelector(".hero-boot-grid"), { opacity: 0.3, duration: 0.45, ease: "power1.inOut" }, ">-0.05");
        tl.to([wordEl, lineEl, boot.querySelector(".hero-boot-readout")], {
            opacity: 0, duration: 0.4, ease: "power1.inOut"
        }, "<");
        tl.to(frameEl, {
            scale: Math.max((window.innerWidth || 1200) / frameW, (window.innerHeight || 800) / growTo) * 1.06,
            duration: 0.9, ease: "power2.inOut",
            transformOrigin: "50% 100%"
        }, "<0.05");
        tl.to(boot, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, ">-0.1");
        tl.to({}, { duration: 0.05 });
    }

    /* ============================================================
       兼做"加载器"：开屏期间后台抓索引（本站自有）
       ============================================================ */
    var preloadStarted = false;
    function preload() {
        if (preloadStarted) return;
        preloadStarted = true;
        try {
            if (typeof window.prefetchIndex === "function") window.prefetchIndex();
        } catch (e) { /* 忽略 */ }
    }

    /* 滚动剧情只挂一次（GSAP/ST 走 CDN，迟到要用保险轮询补挂） */
    var storyMounted = false;
    function mountStory() {
        if (storyMounted) return true;
        if (reduce) { storyMounted = true; return true; }
        if (!window.gsap || !window.ScrollTrigger) return false;
        storyMounted = true;
        /* start() 被 2.5s 兜底提前触发时 Lenis 可能还没下完——这里再补一枪 */
        mountLenis();
        setupScroll();
        return true;
    }

    var started = false;

    window.HeroFacade = {
        start: function () {
            if (started) return;
            started = true;
            stage.setAttribute("aria-hidden", "false");
            preload();
            mountLenis();

            var go = function () {
                bootSequence(function () {
                    mountStory();
                });
                var swaited = 0;
                var stimer = setInterval(function () {
                    if (mountStory()) { clearInterval(stimer); return; }
                    swaited += 120;
                    if (swaited >= 9000) clearInterval(stimer);
                }, 120);
            };

            /* GSAP 是异步注入，等它就位再开演（最多等 3 秒，超时照常亮画面） */
            if (window.gsap && window.ScrollTrigger) { go(); return; }
            var waited = 0;
            var timer = setInterval(function () {
                if (window.gsap && window.ScrollTrigger) { clearInterval(timer); go(); return; }
                waited += 100;
                if (waited >= 3000) { clearInterval(timer); go(); }
            }, 100);
        },
        /* 滚进目录后归还原生滚轮（index.html 的 hero-passed 会调） */
        stopSmooth: stopSmooth,
        goManual: goManual,
        lenis: null
    };

    /* 没有头部脚本触发（比如直接用 file:// 打开）时，自己开始 */
    if (!document.querySelector('script[src*="4.Hero门面.js"]')) return;
    var kick = document.readyState === "loading"
        ? document.addEventListener.bind(document, "DOMContentLoaded")
        : function (f) { f(); };
    kick(function () { setTimeout(function () { window.HeroFacade.start(); }, 0); });
})();
