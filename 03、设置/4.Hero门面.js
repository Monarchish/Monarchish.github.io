/* ============================================================
   03、设置 · 4.Hero门面.js
   ------------------------------------------------------------
   这是什么：首页「支援未来」门面——一段可以往下滚的长流程。
   结构照 inversa.com 的 hero 复刻：400vh 长滚动 + sticky 视口 +
   像素菱形 mask 窗口随滚动 135%→64%→135% 缩放 + 中段压黑去饱和 +
   热点脉冲浮现退场 + 双层地形交叉（现状→改善）+ 右侧进度线 +
   桌面端自定义光标（圆环 + 进度圈 + 「滚动」标签）。
   mask 图形是程序自生成的，配色变量/字体/代码/文案全部是我们自己的。
   滚轮是浏览器原生的 1:1 手感（平滑滚动库已按用户要求移除）。

   它管什么：
     ① 搭画面：LOADING 开屏层 + sticky 视口（地图/热点/进度线/顶栏）
        + 4 屏文字 + 自定义光标
     ② LOADING 开屏：进站先盖黑屏（LOADING... 打字 + PHASE 百分比 + 横线），
        这段时间后台抓文档索引；PHASE 涨满淡出，门面第 1 屏才开始入场
     ③ 滚动剧情：一条 GSAP scrub 时间轴，滚动进度 0→1 映射剧情 0→10——
        前景文字随文档流向上滚出，背景地图反着向下移动（反向视差）
     ④ 入场动效：大字逐字顶上（首次完整版 / 回访短版），注解标题乱码解码
     ⑤ 库没加载成功、或系统开了"减少动态效果"，就直接把画面摆好
   它不做的事：不碰侧栏、不碰目录、不碰正文——那些还是 1.站点主程序.js 的活。
   ============================================================ */
(function () {
    "use strict";

    /* 这一趟旅程上写的字，想改文案就改这里。
       notes 里 body 开头的【占位】标记 = 文案还没定稿，后面替换正文即可，
       kicker（角标）+ title（小标题）+ body（两三行小字）构成一块注解。 */
    var CONTENT = {
        logo: "支援未来",
        barLink: "直达目录",
        kicker: "Support The Future · 标准作业手册",
        title: "支援未来",
        meta: "29 个流程 · 5 大环节 · 持续更新",
        btn: "Menu",
        cursorLabel: "滚动",
        /* LOADING 开屏：进站先盖一层黑，中间画幅从下往上生长，
           涨满后向全页扩充再淡出，露出第 1 屏（这段时间后台在抓索引）。
           PHASE 的数值由 JS 按画幅生长进度实时写；FREQ 是恒定读数 16HZ。 */
        boot: {
            word: "LOADING...",
            freq: "16HZ"
        },
        /* 地图窗口上的两个脉冲标签 */
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
        ]
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

    /* ============================================================
       搭画面
       ------------------------------------------------------------
       .hero-stick   sticky 视口：钉在视口上不动，4 屏文字从它上面滚过去
                     （背景不动、内容换景；不用 position:fixed，
                      不和站点里其它 sticky 元素打架）
       .hero-slides  4 屏文字，正常文档流：第 1 屏门面正脸，2-4 屏注解
       .hero-cursor  桌面端自定义光标（pointer:fine 才启用，见 JS 尾部）
       ============================================================ */
    var chs = CONTENT.title.split("").map(function (c) {
        return '<span class="hero-ch"><i>' + escapeHtml(c) + "</i></span>";
    }).join("");

    var slidesHtml = '<section class="hero-slide hero-face">' +
        '<div class="hero-slide-content">' +
        '<p class="hero-kicker">' + escapeHtml(CONTENT.kicker) + "</p>" +
        '<h1 class="hero-display">' + chs + "</h1>" +
        '<p class="hero-meta">' + escapeHtml(CONTENT.meta) + "</p>" +
        '<a class="hero-btn" href="#siteShell" data-jump-manual>' + escapeHtml(CONTENT.btn) + " →</a>" +
        "</div></section>" +
        CONTENT.notes.map(function (n) {
            return '<section class="hero-slide">' +
                '<div class="hero-slide-content">' +
                '<p class="hero-note-kicker">' + escapeHtml(n.kicker) + "</p>" +
                '<h2 class="hero-note-title" data-scramble>' + escapeHtml(n.title) + "</h2>" +
                '<p class="hero-note-body">' + escapeHtml(n.body) + "</p>" +
                "</div></section>";
        }).join("");

    stage.innerHTML =
        '<div class="hero-stick">' +
        '<div class="hero-map">' +
        '<div class="hero-map-layer is-a"></div>' +
        '<div class="hero-map-layer is-b"></div>' +
        "</div>" +
        '<div class="hero-raster"></div>' +
        '<div class="hero-dim"></div>' +
        '<div class="hero-desat"></div>' +
        '<div class="hero-hotspot"><div class="hero-pulse"></div><div class="hero-pulse"></div>' +
        '<span class="hero-hotspot-mark"></span>' +
        '<span class="hero-hotspot-label">' + escapeHtml(CONTENT.mapPoints.hotspot) + "</span></div>" +
        '<div class="hero-specialist"><div class="hero-pulse"></div>' +
        '<span class="hero-hotspot-mark"></span>' +
        '<span class="hero-specialist-label">' + escapeHtml(CONTENT.mapPoints.specialist) + "</span></div>" +
        '<div class="hero-indicator" aria-hidden="true"><i></i></div>' +
        '<div class="hero-bar">' +
        '<span class="hero-bar-logo">' + escapeHtml(CONTENT.logo) + "</span>" +
        '<a class="hero-bar-link" href="#siteShell" data-jump-manual>' + escapeHtml(CONTENT.barLink) + "</a>" +
        "</div>" +
        '<div class="hero-boot">' +
        '<div class="hero-boot-grid"></div>' +
        '<div class="hero-boot-frame"></div>' +
        '<i class="hero-boot-line"></i>' +
        '<span class="hero-boot-word"></span>' +
        '<div class="hero-boot-readout">' +
        '<span class="hero-boot-row"><b>PHASE</b><i class="hero-boot-phase">0%</i></span>' +
        '<span class="hero-boot-row"><b>FREQ</b><i>' + escapeHtml(CONTENT.boot.freq) + "</i></span>" +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="hero-slides">' + slidesHtml + "</div>" +
        '<div class="hero-cursor" aria-hidden="true">' +
        '<div class="hero-cursor-ring"></div>' +
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48.5" pathLength="100" /></svg>' +
        '<span class="hero-cursor-label">' + escapeHtml(CONTENT.cursorLabel) + "</span>" +
        "</div>";

    /* ============================================================
       乱码解码标题（参考站那种"标题在跳"的效果）
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

    /* ---------- 按钮直达目录（顶栏「直达目录」+ 第 1 屏「Menu」） ---------- */
    function goManual(e) {
        if (e) e.preventDefault();
        var shell = document.getElementById("siteShell");
        var y = shell ? shell.offsetTop : window.innerHeight * 4;
        try { window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" }); }
        catch (err) { window.scrollTo(0, y); }
    }

    stage.querySelectorAll("[data-jump-manual]").forEach(function (a) {
        a.addEventListener("click", goManual);
    });

    /* ============================================================
       入场动效（第 1 屏正脸）
       ------------------------------------------------------------
       首次访问：完整版（大字逐字从裁剪窗口里顶上）
       回访：短文版（不到 1 秒到位，不强制等待）
       prepare = 只摆初始态（藏在 LOADING 层下面），reveal = 播入场
       ============================================================ */
    var started = false;

    function animateIn() {
        var g = window.gsap;
        var kicker = stage.querySelector(".hero-kicker");
        var chars = stage.querySelectorAll(".hero-display .hero-ch i");
        var meta = stage.querySelector(".hero-meta");
        var btn = stage.querySelector(".hero-btn");
        var bar = stage.querySelector(".hero-bar");
        var ind = stage.querySelector(".hero-indicator");
        var tl = g.timeline();
        /* 注意：一律用 fromTo 并写明终点值。
           prepare() 已经把元素摆成隐藏态，.from() 会把"当前值"记成终点，
           0 → 0 永远显形不了（线上踩过：第 1 屏文字集体隐身）。 */
        if (isReturn) {
            tl.fromTo(kicker, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" })
                .fromTo(chars, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.04 }, "-=0.2")
                .fromTo([meta, btn], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.07 }, "-=0.3");
        } else {
            tl.fromTo(kicker, { opacity: 0, letterSpacing: "0.55em" }, { opacity: 1, letterSpacing: "0.28em", duration: 0.8, ease: "power3.out" })
                /* 大字逐字从裁剪窗口里顶上（参考站 SplitText lines 的按字版） */
                .fromTo(chars, { yPercent: 120 }, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.09 }, "-=0.5")
                .fromTo(meta, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" }, "-=0.6")
                .fromTo(btn, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, "-=0.45")
                .fromTo(bar, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, "-=0.5")
                .fromTo(ind, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.4");
        }
    }

    function prepare() {
        if (!window.gsap || reduce) return;   /* 没有 GSAP / 少动效：画面保持 CSS 原生可见 */
        window.gsap.set(stage.querySelectorAll(".hero-display .hero-ch i"), { yPercent: isReturn ? 100 : 120 });
        window.gsap.set([".hero-kicker", ".hero-meta", ".hero-btn"], { opacity: 0 });
    }

    function reveal() {
        if (!window.gsap || reduce) return;
        /* 等字体就位再入场，免得逐字动画用兜底字体算位置、中途跳一下 */
        if (document.fonts && document.fonts.ready) {
            var fired = false;
            document.fonts.ready.then(function () { if (!fired) { fired = true; animateIn(); } });
            setTimeout(function () { if (!fired) { fired = true; animateIn(); } }, 600);
        } else {
            animateIn();
        }
    }

    /* ============================================================
       LOADING 开屏（严格照参考视频 QQ20260924-122358.mp4）
       ------------------------------------------------------------
       进站先盖一层黑：稀疏点阵 + 底部横线（83% 高）；
       横线左端 LOADING... 逐字打出；中间画幅 = 门面主图本身
       （竖版 1952x2477 同比例的窗口），从横线上由下往上生长；
       画幅右缘外两行读数 PHASE / FREQ，PHASE 就是画幅的生长指数
       （与 height 同一个补间驱动），FREQ 恒定 16HZ。

       节奏：开始快、收尾缓慢（power2.out）。
       涨满后画幅放大到「盖满整个视口」（照片铺满全屏），
       同时横线/读数/点阵淡出，最后整层淡出——因为门面第 1 屏
       的背景就是同一张照片（cover 全屏），衔接是无缝的。

       回访：短版快闪（~0.85s）；系统少动效 / 没有 GSAP：直接摘掉开屏层。
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
            wordEl.textContent = WORD;           /* 回访：不打字，直接上全文 */
        } else {
            wordEl.textContent = "";             /* 首次：从空开始逐字打 */
        }

        /* 画幅的生长路程：从 0 长到「宽 × 原图高宽比」（1952x2477 竖版，
           高 = 宽 × 1.2683），和用户后续替换的主图比例严格一致。 */
        var frameW = frameEl.offsetWidth || Math.min(window.innerWidth * 0.31, 460);
        var growTo = Math.round(frameW * 1.2683);
        if (!isFinite(growTo) || growTo <= 0) growTo = Math.round((boot.clientHeight || 800) * 0.5);
        /* 涨满后要放大到盖满全页（cover）：横向或纵向谁需要的倍数大用谁 */
        var vw = window.innerWidth || 1200, vh = window.innerHeight || 800;
        var coverScale = Math.max(vw / frameW, vh / growTo) * 1.06;

        var tl = g.timeline({
            onComplete: function () {
                document.documentElement.classList.remove("hero-booting");
                boot.remove();
                done();
            }
        });

        if (!isReturn) {
            /* 逐字打出 LOADING...（开始几拍就打完，不拖节奏） */
            WORD.split("").forEach(function (ch, idx) {
                tl.call(function (c) { wordEl.textContent += c; }, [ch], 0.12 + idx * 0.055);
            });
        }
        /* 中部横线：左起铺满 */
        tl.to(lineEl, { scaleX: 1, duration: total, ease: "power2.out" }, 0);
        /* 画幅从下往上生长（高度 0 → growTo，底部对齐所以是"长"不是"铺"） */
        var fm = { h: parseFloat(frameEl.style.height || "0") || 0 };
        tl.to(fm, {
            h: growTo, duration: total, ease: "power2.out",
            onUpdate: function () {
                frameEl.style.height = fm.h + "px";
                /* PHASE = 画幅的生长指数（与画幅同一个补间，天然同步） */
                phaseEl.textContent = Math.round((fm.h / growTo) * 100) + "%";
            }
        }, 0);
        /* 收尾小顿挫：读数停在 100% 站稳一拍，再宣布"涨满" */
        tl.to({}, { duration: isReturn ? 0.12 : 0.35 });
        if (!isReturn) {
            tl.call(function () { phaseEl.textContent = "100%"; });
        }
        /* 涨满 → 扩充到全页：画幅放大到 cover 整个视口（scale 动态算），
           点阵先压暗、横线/文字/读数淡出，照片铺满的瞬间整层退场。
           门面第 1 屏的背景是同一张照片（cover 全屏），所以淡出是无缝的。 */
        tl.to(boot.querySelector(".hero-boot-grid"), { opacity: 0.3, duration: 0.45, ease: "power1.inOut" }, ">-0.05");
        tl.to([wordEl, lineEl, boot.querySelector(".hero-boot-readout")], {
            opacity: 0, duration: 0.4, ease: "power1.inOut"
        }, "<");
        tl.to(frameEl, {
            scale: coverScale, duration: 0.9, ease: "power2.inOut",
            transformOrigin: "50% 100%"
        }, "<0.05");
        /* 照片已盖满：整层淡出（照片和下面 hero 的同一张图重叠，看不出切换） */
        tl.to(boot, { opacity: 0, duration: 0.45, ease: "power1.inOut" }, ">-0.1");
        tl.to({}, { duration: 0.05 });
    }

    /* ============================================================
       滚动剧情：一条 scrub 时间轴，进度 0→1 对应剧情刻度 0→10
       ------------------------------------------------------------
       照参考站的关键帧编排：
         0-5    地图缓慢上移（power1.inOut）
         3-6    mask 窗口收缩 135% → 64%（power2.inOut）
         3.5-6  去饱和灰滤镜淡入；4-6 压黑蒙层升到 0.75
         5-6.2  扫描线 + 两个热点脉冲浮现
         6.8-7.2 热点与扫描线退场；7-9 压黑/灰滤镜归零
         7-10   mask 放大回 135% + 地图向上滑出（power3.inOut）
                同时 A 层（现状·珊瑚红）交叉到 B 层（改善·薄荷/荧光黄）
         0-10   右侧进度线从 0 填到 1；自定义光标的进度圈同步
       ============================================================ */
    function setupScroll() {
        if (!window.gsap || !window.ScrollTrigger || reduce) return;
        var g = window.gsap;
        g.registerPlugin(window.ScrollTrigger);
        var ST = window.ScrollTrigger;

        var map = stage.querySelector(".hero-map");
        var layerA = stage.querySelector(".hero-map-layer.is-a");
        var layerB = stage.querySelector(".hero-map-layer.is-b");
        var raster = stage.querySelector(".hero-raster");
        var dim = stage.querySelector(".hero-dim");
        var desat = stage.querySelector(".hero-desat");
        var spots = stage.querySelectorAll(".hero-hotspot, .hero-specialist");
        var indFill = stage.querySelector(".hero-indicator i");
        var cursorDot = stage.querySelector(".hero-cursor circle");

        /* 关键：把 CSS 的 translate(-50%,-50%) 居中交给 GSAP 接管。
           不接管的话，GSAP 补间 yPercent 会和 CSS transform 打架，
           中间态位移失控（探针抓到过 -23% 这种不对劲的值）。 */
        if (map) g.set(map, { xPercent: -50, yPercent: -50 });

        var tl = g.timeline({
            scrollTrigger: {
                trigger: stage, start: "top top", end: "bottom bottom", scrub: 0.5,
                onUpdate: function (self) {
                    /* 光标进度圈：整段旅程滚到哪，荧光圈画到哪 */
                    if (cursorDot) cursorDot.style.strokeDashoffset = String(100 - self.progress * 100);
                }
            }
        });

        /* 前景文字随文档流向上滚出，背景地图反着走——向下移（参考站的反向视差）：
           0-5 刻度地图向下沉 12% 视口高，7-10 轻微回正 */
        if (map) tl.to(map, { yPercent: -38, duration: 5, ease: "power1.inOut" }, 0);
        if (map) tl.to(map, { "--hero-ms": "64%", duration: 3, ease: "power2.inOut" }, 3);
        if (desat) tl.to(desat, { opacity: 0.55, duration: 2.5, ease: "power1.inOut" }, 3.5);
        if (dim) tl.to(dim, { opacity: 0.75, duration: 2, ease: "power1.inOut" }, 4);
        if (raster) tl.to(raster, { opacity: 1, duration: 0.2, ease: "none" }, 5);
        if (spots.length) tl.to(spots, { opacity: 1, duration: 0.2, ease: "none", stagger: 0.1 }, 5.1);
        if (spots.length) tl.to(spots, { opacity: 0, duration: 0.2, ease: "none" }, 6.8);
        if (raster) tl.to(raster, { opacity: 0, duration: 0.2, ease: "none" }, 7);
        if (dim) tl.to(dim, { opacity: 0, duration: 2, ease: "power1.inOut" }, 7);
        if (desat) tl.to(desat, { opacity: 0, duration: 1.6, ease: "power1.inOut" }, 7.2);
        if (map) tl.to(map, { "--hero-ms": "135%", duration: 3, ease: "power2.inOut" }, 7);
        if (map) tl.to(map, { yPercent: -46, duration: 3, ease: "power3.inOut" }, 7);
        if (layerA) tl.to(layerA, { opacity: 0, duration: 3, ease: "none" }, 7);
        if (layerB) tl.to(layerB, { opacity: 1, duration: 3, ease: "none" }, 7);
        if (indFill) tl.fromTo(indFill, { scaleY: 0 }, { scaleY: 1, duration: 10, ease: "none" }, 0);

        /* ---------- 注解屏（2-4 屏）：文字块浮现/退场 + 标题解码一次 ---------- */
        g.utils.toArray(".hero-slide:not(.hero-face)").forEach(function (sec) {
            var content = sec.querySelector(".hero-slide-content");
            if (content) {
                g.fromTo(content,
                    { opacity: 0, y: 42 },
                    {
                        opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
                        scrollTrigger: { trigger: sec, start: "top 62%", toggleActions: "play none none reverse" }
                    });
            }
            /* 滚到跟前时，标题"解码"一次，制造"被发现"的感觉（每个标题只解一次） */
            ST.create({
                trigger: sec, start: "top 55%",
                onEnter: function () {
                    var t = sec.querySelector(".hero-note-title[data-scramble]");
                    if (t && !t.dataset.done) { t.dataset.done = "1"; scrambleIn(t, { step: 42 }); }
                }
            });
        });

        /* ---------- 桌面端自定义光标：位置跟随 + 进度圈已挂到 scrub 上 ---------- */
        var cursor = stage.querySelector(".hero-cursor");
        if (cursor && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
            var xTo = g.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
            var yTo = g.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
            window.addEventListener("mousemove", function (e) {
                /* 门面已经滚完（目录接手）：光标退场，原生光标由 CSS 恢复 */
                if (document.documentElement.classList.contains("hero-passed")) {
                    cursor.classList.remove("is-visible");
                    return;
                }
                xTo(e.clientX);
                yTo(e.clientY);
                cursor.classList.add("is-visible");
            }, { passive: true });
        }
    }

    /* ============================================================
       兼做"加载器"：LOADING 开屏的这段时间，把目录和索引在后台备好
       ------------------------------------------------------------
       1.站点主程序.js 自己会在加载时抓索引，这里只是"提前催一下"，
       让它别等用户滚到目录才开始。抓不到也没关系，主程序会重试。
       ============================================================ */
    var preloadStarted = false;
    function preload() {
        if (preloadStarted) return;
        preloadStarted = true;
        try {
            if (typeof window.prefetchIndex === "function") window.prefetchIndex();
        } catch (e) { /* 忽略：主程序自己会处理 */ }
    }

    /* 滚动剧情只挂一次：ScrollTrigger 偶尔比 3 秒上限晚到（CDN 慢），
       到货时由 start() 的保险轮询补挂——没人补挂的话 scrub 永远失效
       （本地无头 Chrome 冷缓存实测踩过：ST 4.5 秒才下完，剧情整个没挂上） */
    var storyMounted = false;
    function mountStory() {
        if (storyMounted) return true;
        if (reduce) { storyMounted = true; return true; }
        if (!window.gsap || !window.ScrollTrigger) return false;
        storyMounted = true;
        setupScroll();
        return true;
    }

    window.HeroFacade = {
        start: function () {
            if (started) return;
            started = true;
            stage.setAttribute("aria-hidden", "false");
            preload();                       /* 开屏第一毫秒就开始抓索引 */

            var go = function () {
                prepare();                   /* 第 1 屏摆好初始态，藏在 LOADING 层下面 */
                bootSequence(function () {   /* 开屏涨满淡出后—— */
                    reveal();                /* 第 1 屏逐字入场 */
                    mountStory();            /* 滚动剧情上线（只挂一次） */
                });
                /* ST 迟到保险：库里 ScrollTrigger 还没下完时，一到货立刻补挂 */
                var swaited = 0;
                var stimer = setInterval(function () {
                    if (mountStory()) { clearInterval(stimer); return; }
                    swaited += 120;
                    if (swaited >= 9000) clearInterval(stimer);
                }, 120);
            };

            /* 本文件在 DOMContentLoaded 就会被触发，而 GSAP 是异步注脚，
               多半还没下完——等它就位再开演（最多等 3 秒，超时照常亮画面） */
            if (window.gsap && window.ScrollTrigger) { go(); return; }
            var waited = 0;
            var timer = setInterval(function () {
                if (window.gsap && window.ScrollTrigger) { clearInterval(timer); go(); return; }
                waited += 100;
                if (waited >= 3000) { clearInterval(timer); go(); }
            }, 100);
        },
        /* 给外面用：手动触发一次乱码解码（调试 / 复用） */
        scramble: scrambleIn,
        goManual: goManual
    };

    /* 没有头部脚本触发（比如直接用 file:// 打开）时，自己开始 */
    if (!document.querySelector('script[src*="4.Hero门面.js"]')) return;
    var kick = document.readyState === "loading"
        ? document.addEventListener.bind(document, "DOMContentLoaded")
        : function (f) { f(); };
    kick(function () { setTimeout(function () { window.HeroFacade.start(); }, 0); });
})();
