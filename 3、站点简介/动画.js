/* ===== 3、站点简介：随鼠标微微晃动 + 图片滚动视差 =====
   全部原生实现（不依赖 gsap/lenis，库挂了照常工作）。
   ① 鼠标晃动：幅度很小，是「呼吸感」不是「跟手」。幅度调 data-sway 和 22/16 两个系数。
   ② 滚动视差：inversa 同款——图片比遮罩框高 16%，随滚动在框内上下平移。 */
(function () {
    /* ---------- ① 鼠标晃动（触屏自动禁用） ---------- */
    var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var els = [].slice.call(document.querySelectorAll("[data-sway]"));
    if (fine && els.length) {
        var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
        function loop() {
            cx += (tx - cx) * 0.06;
            cy += (ty - cy) * 0.06;
            for (var i = 0; i < els.length; i++) {
                var d = parseFloat(els[i].getAttribute("data-sway")) || 1;
                els[i].style.transform =
                    "translate3d(" + (cx * d).toFixed(2) + "px," + (cy * d).toFixed(2) + "px,0)";
            }
            raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05)
                ? requestAnimationFrame(loop) : null;
        }
        window.addEventListener("mousemove", function (e) {
            tx = (e.clientX / window.innerWidth - 0.5) * 22;
            ty = (e.clientY / window.innerHeight - 0.5) * 16;
            if (!raf) raf = requestAnimationFrame(loop);
        }, { passive: true });
    }

    /* ---------- ② 滚动视差 ---------- */
    var assets = [].slice.call(document.querySelectorAll(".value-asset img"));
    if (!assets.length) return;
    var ticking = false;
    function parallax() {
        ticking = false;
        var vh = window.innerHeight;
        for (var i = 0; i < assets.length; i++) {
            var box = assets[i].parentElement.getBoundingClientRect();
            if (box.bottom < -80 || box.top > vh + 80) continue;  /* 视口外不算 */
            /* 元素中心相对视口中心的进度：-1（刚从下面进来）… 1（快滚出去了） */
            var p = ((box.top + box.height / 2) - vh / 2) / (vh / 2 + box.height / 2);
            p = Math.max(-1, Math.min(1, p));
            /* 图片高度是框的 118%（上下各 1% 缓冲防露黑边），正反走得满不满都不穿帮 */
            assets[i].style.transform = "translate3d(0," + (p * 8).toFixed(2) + "%,0)";
        }
    }
    function onScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    parallax();
})();

/* ---------- ③ 主页大字：逐行「从下往上 + 淡入」（ScrollTrigger） ----------
   文本按 HTML 里的 <br> 拆行（不按空格拆词：这句子太长，逐词会散成 40 段），
   每行包一个 .about-line，整行一起抬起来，行与行之间留 0.12s 的错峰。
   触发点 top 85%（标题顶边进到屏下 15% 时开演），回滚时反向退回原状。
   库没取到时走 CSS 过渡兜底，文字绝不会停在不可见状态。
   ⚠ 单独一个 IIFE：上面 ② 有 `if (!assets.length) return;`，
     写在一起的话没有图片时这段会被一起 return 掉。 */
(function initAboutReveal() {
    var title = document.querySelector(".about-title");
    if (!title) return;

    /* 按 <br> 拆行：只加包裹层，不改文本、不改换行点 */
    if (!title.querySelector(".about-line")) {
        var parts = title.innerHTML.split(/<br\s*\/?>/i);
        title.innerHTML = parts.map(function (t) {
            return '<span class="about-line">' + t + "</span>";
        }).join("");
    }
    var lines = [].slice.call(title.querySelectorAll(".about-line"));
    if (!lines.length) return;

    function playWithGsap() {
        gsap.registerPlugin(ScrollTrigger);
        gsap.fromTo(lines,
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.12,
                scrollTrigger: {
                    trigger: title,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            });
        ScrollTrigger.refresh();
        /* 门面那一段是 pin 住的，pin-spacer 会把整页高度改一次：
           如果本段在它建好之前就量了位置，start 会偏。等 load 完再校一遍。 */
        var reflow = function () { ScrollTrigger.refresh(); };
        if (document.readyState === "complete") setTimeout(reflow, 400);
        else window.addEventListener("load", function () { setTimeout(reflow, 400); });
    }

    /* CSS 过渡兜底：同样的位移/缓动，用 IntersectionObserver 触发 */
    function playWithCss() {
        var vh = window.innerHeight;
        lines.forEach(function (l, i) {
            l.style.transitionDelay = (i * 0.12) + "s";
            l.classList.add("about-line-js");
        });
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    en.target.classList.toggle("is-in", en.isIntersecting);
                });
            }, { rootMargin: "0px 0px -15% 0px" });
            lines.forEach(function (l) { io.observe(l); });
        }
        /* 已经在视口里（直达简介 / 刷新停在半页）：不再等观察器回调，立刻补一次，
           否则文字会停在 opacity:0 的状态上——宁可省掉动画，也不能让字看不见 */
        lines.forEach(function (l) {
            if (l.getBoundingClientRect().top < vh * 0.85) l.classList.add("is-in");
        });
    }

    /* gsap / ScrollTrigger 是页面底部异步装载的：这里轮询等待，超时就兜底 */
    var t0 = Date.now();
    (function waitLibs() {
        if (window.gsap && window.ScrollTrigger) { playWithGsap(); return; }
        if (Date.now() - t0 > 4000) { playWithCss(); return; }
        setTimeout(waitLibs, 120);
    })();
})();

/* ===================== 2026-11-03 重写：照抄门面母本（不发明新代码） =====================
   本段所有乱码/拆词/逐词逻辑逐行取自 2、滚动门面/动画.js 的 v56「文案入场」段：
     · SCRAMBLE_GLYPHS：只有 26 个大写字母，绝不出现符号或问号；
     · TICK_MS=130 / PER_WORD_TICKS=3：每 130ms 刷新一拍，每 3 拍落定一个词；
     · runTitleScramble：标题原地乱码落定（按词落定，收尾写回原文，杜绝残留）；
     · splitWords + runWordReveal：正文按空格拆词，逐个 opacity 淡入
       （duration .5 / power1.out / stagger .05，只有 opacity，没有位移）。
   触发器（ScrollTrigger/IntersectionObserver）沿用本文件原有的接管方式，动画本身是母本。

   悬停规则（用户指令）：
     · 标题：只乱码一次——dataset.scrambled 标记 + 首次执行后移除监听；
     · 三个 .value-btn 按钮的悬停乱码照抄门面左下角 EXPLORE 大按钮
       （2、滚动门面/动画.js v61 bindExploreScramble）：
         gsap.to(label, { scrambleText: { text: text, speed: 1 } })
       —— 0.5s、speed 1（每 50ms 换一批字符）、从左往右逐个落定，
       与开屏左下角按钮的节奏一字不差。库未就绪时退回 runTitleScramble 兜底。 */
(function initValueTextAnim() {
    var blocks = [].slice.call(document.querySelectorAll(".value-block"));
    if (!blocks.length) return;

    /* ======== ↓↓ 以下常量与函数照抄 2、滚动门面/动画.js v56 段 ↓↓ ======== */
    var SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 只允许 26 个字母，不出现符号
    var TICK_MS = 130;        // 乱码刷新频率：100~150ms 一跳，肉眼可见
    var PER_WORD_TICKS = 3;   // 每个词先乱跳 3 拍（≈390ms）再落定

    var scrambleToken = function (word) {
        var out = "";
        for (var i = 0; i < word.length; i++) {
            var ch = word.charAt(i);
            out += /[A-Za-z]/.test(ch)
                ? SCRAMBLE_GLYPHS.charAt((Math.random() * SCRAMBLE_GLYPHS.length) | 0)
                : ch;
        }
        return out;
    };

    /* 正文拆词：单词各包一个 span，词间空格的文本节点原样保留，
       这样宽度/换行与原来完全一致，只是每个词可以单独动 */
    var splitWords = function (el) {
        var text = el.textContent.replace(/\s+/g, " ").trim();
        var words = text ? text.split(" ") : [];
        el.textContent = "";
        var spans = [];
        words.forEach(function (w, i) {
            var s = document.createElement("span");
            s.className = "word";
            s.textContent = w;
            el.appendChild(s);
            spans.push(s);
            if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
        });
        return spans;
    };

    /* 小标题乱码：定时器每 TICK_MS 才重画一次，字符肉眼可见地跳；
       每 PER_WORD_TICKS 拍落定一个词，落完即收 */
    var runTitleScramble = function (el, text) {
        var parts = text.split(/(\s+)/); // 单词 / 空白交替，空白原样保留
        var wordPos = [];
        for (var i = 0; i < parts.length; i++) {
            if (!/^\s+$/.test(parts[i])) wordPos.push(i);
        }
        var total = wordPos.length;
        if (!total) { el.textContent = text; return; }
        var render = function (settled) {
            var out = "";
            for (var i = 0; i < parts.length; i++) {
                if (/^\s+$/.test(parts[i])) {
                    out += parts[i];
                } else {
                    out += wordPos.indexOf(i) < settled ? parts[i] : scrambleToken(parts[i]);
                }
            }
            el.textContent = out;
        };
        var ticks = 0;
        render(0);
        var timer = setInterval(function () {
            ticks++;
            var settled = Math.floor(ticks / PER_WORD_TICKS);
            if (settled >= total) {
                clearInterval(timer);
                el.textContent = text; // 收尾写回原文，杜绝残留乱码
                return;
            }
            render(settled);
        }, TICK_MS);
    };

    /* 正文：单词依次淡入，只动 opacity，不做任何位移（门面用户定稿：不要从下往上） */
    var runWordReveal = function (words) {
        gsap.to(words, {
            opacity: 1,
            duration: 0.5,
            ease: "power1.out",
            stagger: 0.05,
        });
    };
    /* ======== ↑↑ 母本抄写结束 ↑↑ ======== */

    /* ---- 组装：标题原文 / 正文拆词 / 按钮标签 ---- */
    var items = blocks.map(function (block) {
        var title = block.querySelector(".value-title");
        var text = block.querySelector(".value-text");
        var btn = block.querySelector(".value-btn");
        var label = btn ? btn.querySelector(".value-btn-label") : null;
        var words = text ? splitWords(text) : [];
        return {
            block: block,
            content: block.querySelector(".value-content") || block,  /* 触发器挂在文字容器上 */
            title: title,
            titleText: title ? title.textContent : "",
            text: text,
            words: words,
            btn: btn,
            label: label,
            labelText: label ? label.textContent : "",
            done: false
        };
    });

    /* ---- 悬停（2026-11-03 用户定稿）：
       标题：悬停乱码已全部删除——鼠标放上去零动画。标题的乱码只在
             「初次滚到本块」时演一次（play 里的 runTitleScramble），之后永久静止。
       按钮：悬停乱码保留（上一轮按开屏左下角母本 1:1 复刻，用户已验收）。 ---- */
    items.forEach(function (it) {
        if (it.btn && it.label) {
            it.btn.addEventListener("mouseenter", function () {
                if (window.gsap && window.ScrambleTextPlugin) {
                    /* 照抄 2、滚动门面/动画.js v61 bindExploreScramble 的原调用，
                       不换时长、不换参数——节奏与开屏左下角 EXPLORE 按钮完全一致。
                       ★ 插件文件虽已加载但全站从未 registerPlugin（诊断实测：门面
                         按钮同样不乱码，控制台报 Invalid property scrambleText）。
                         registerPlugin 幂等，这里注册一次，门面 EXPLORE 按钮也一起复活。 */
                    gsap.registerPlugin(ScrambleTextPlugin);
                    gsap.to(it.label, { scrambleText: { text: it.labelText, speed: 1 } });
                } else {
                    runTitleScramble(it.label, it.labelText);   /* 库没到时的兜底 */
                }
            });
        }
    });

    /* ---- 触发：与库加载时序彻底解耦（2026-11-03 重构）----
       旧版要先等 gsap/ScrollTrigger 就绪（最多 4s）才挂触发器，而线上
       GitHub Pages 单请求可能 6s+ 超时，一旦超时走降级分支，ScrollTrigger
       就永远不会创建 → 动画静默不播（实测 stCount 只有门面自己的 1 个）。
       新版：页面加载「立即」做三件事，一个库都不等——
         ① 已在视口内的块立刻演；
         ② IntersectionObserver 挂主触发（rootMargin -20% ≈ top 80% 线）；
         ③ scroll 监听兜底。gsap 只负责「怎么演」，不负责「何时演」。
       用户定稿：触发器绑 .value-content、start top 80%、once 只演一次。 */
    function inView(el) {
        return el.getBoundingClientRect().top < window.innerHeight * 0.8;
    }

    function play(it) {
        if (it.done) return;
        it.done = true;
        if (it.title) runTitleScramble(it.title, it.titleText);
        if (!it.words.length) return;
        if (window.gsap) {
            runWordReveal(it.words);
        } else if (it.text) {
            it.text.classList.add("is-in");   /* CSS 兜底：同样只有 opacity */
        }
    }

    function arm(it) {
        /* 已经在视口里（直达简介 / 刷新停在半页）：直接演，不等滚动 */
        if (inView(it.content)) { setTimeout(function () { play(it); }, 80); return; }
        if ("IntersectionObserver" in window) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting) { play(it); io.disconnect(); }
                });
            }, { rootMargin: "0px 0px -20% 0px" });
            io.observe(it.content);
        }
        /* scroll 兜底：IO 都不可用的老浏览器也能演（done 防重入） */
        var onScroll = function () {
            if (inView(it.content)) { play(it); window.removeEventListener("scroll", onScroll); }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    function hideWords() {
        items.forEach(function (it) {
            if (!it.words.length) return;
            if (window.gsap) gsap.set(it.words, { opacity: 0 });   /* 只隐身，不位移 */
            else if (it.text) {
                it.text.classList.add("word-anim");
                /* CSS 兜底的逐词错峰：与母本 stagger 0.05 同拍 */
                it.words.forEach(function (w, i) {
                    w.style.transitionDelay = (i * 0.05).toFixed(3) + "s";
                });
            }
        });
    }

    /* 立即隐身 + 立即挂触发器：不等任何库 */
    hideWords();
    items.forEach(arm);

    /* 库是页面底部异步取回来的：就绪后补挂 ScrollTrigger 作为第二保险
       （IO 先触发也无妨，done 会拦住重复播放），并做 pin 布局校正 */
    var t0 = Date.now();
    (function waitLibs() {
        if (window.gsap && window.ScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
            if (window.ScrambleTextPlugin) gsap.registerPlugin(ScrambleTextPlugin);
            items.forEach(function (it) {
                if (!it.done) {
                    ScrollTrigger.create({
                        trigger: it.content,
                        start: "top 80%",
                        once: true,
                        onEnter: function () { play(it); }
                    });
                }
            });
            ScrollTrigger.refresh();
            /* 门面 pin 会改页面高度，load 后补一次量测（与主页大字同款处理） */
            var reflow = function () { ScrollTrigger.refresh(); };
            if (document.readyState === "complete") setTimeout(reflow, 400);
            else window.addEventListener("load", function () { setTimeout(reflow, 400); });
            return;
        }
        /* 等，但不等死：IO 主触发不依赖这里，超时只是少一层保险 */
        if (Date.now() - t0 < 8000) { setTimeout(waitLibs, 150); }
    })();
})();
