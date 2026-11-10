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

/* ---------- ③ 主页大字：v22 起取消入场特效（用户 2026-11-10 定稿）----------
   这句是站点的核心定位句，应当一进来就"已经在那儿"，而不是表演一次。
   原来的「按 <br> 拆行 → 每行上滑 60px + 淡入 + 0.12s 错峰 + ScrollTrigger 反向回滚」
   整段删除；同时删掉了配套的 .about-line / .about-line-js CSS 与 JS 注入的 span，
   文字直接由 HTML 静态输出，任何库没加载、脚本报错都不会出现"字看不见"的状态。 */

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

    /* 正文拆词（2026-11-08 第二版）：英文按空格拆词，中文逐字拆。
       为什么中文要逐字：中文段没有空格，原来按空格拆只有 1 个"词"，
       整段一次性淡入 —— 看上去就是"中文不跳、只有英文在跳"。
       现在中文逐字、英文逐词，两边都是「一格一格跳出来」。
       ① 标点粘在前一个字上（"。" 不会单独成格，行首也不会孤零零挂个逗号）；
       ② 中文字与字之间插零宽空格（ZWSP）而不是普通空格：
          行内块之间没有空白时浏览器不给断行机会，整段会变成一条不断行的长条直接溢出；
          ZWSP 只提供断行点、不占宽度，所以换行与原来逐字排版完全一致。
       初始的「隐身」（opacity:0）直接写成内联样式，不等 gsap——
       以前写在 hideWords 的 gsap.set 里，库晚到时字早就亮着，动画看起来就"不见了" */
    var CN_PUNCT = /[，。、；：？！…—·“”‘’（）《》〈〉,.;:?!'"()\[\]{}]/;
    /* 2026-11-08 第三版：用户不要位移了（"有一个斜着上来的动画，不需要"）。
       现在每个字/词只做透明度，按阅读顺序从左到右依次亮起来，不再带 y 偏移。 */

    var splitWords = function (el) {
        var text = el.textContent.replace(/\s+/g, " ").trim();
        if (!text) { el.textContent = ""; return []; }
        var spaced = /\s/.test(text);
        var tokens = [];
        if (spaced) {
            tokens = text.split(" ");
        } else {
            for (var i = 0; i < text.length; i++) {
                var ch = text.charAt(i);
                if (CN_PUNCT.test(ch) && tokens.length) tokens[tokens.length - 1] += ch;
                else tokens.push(ch);
            }
        }
        el.textContent = "";
        var spans = [];
        tokens.forEach(function (w, i) {
            var s = document.createElement("span");
            s.className = "word";
            s.textContent = w;
            s.style.opacity = "0";
            el.appendChild(s);
            spans.push(s);
            if (i < tokens.length - 1) {
                el.appendChild(document.createTextNode(spaced ? " " : "\u200B"));
            }
        });
        return spans;
    };

    /* 标题中文：照抄开场「支援未来」那套遮罩——整串字装进一个 overflow:hidden 的壳里，
       从 translateY(120%) 一起抬回 0。
       2026-11-08 第三版：用户要「四个字同时出现，不要一个一个上来」，
       所以不再按两字一组拆分、也去掉错峰 —— 整个标题就是一个字块，
       起落完全同步（拆分反而会让首尾差 0.06s，肉眼能看出是两段）。
       只包两层 span，原文、字号、字距、换行点一概不动。
       初始位移同样写成内联样式，不依赖 gsap 是否已就位。 */
    var splitTitleCn = function (el) {
        if (!el) return [];
        if (el.querySelector(".cn-mask")) return [].slice.call(el.querySelectorAll(".cn-word"));
        var raw = el.textContent.trim();
        if (!raw) return [];
        el.textContent = "";
        var mask = document.createElement("span");
        mask.className = "cn-mask";
        var w = document.createElement("span");
        w.className = "cn-word";
        w.textContent = raw;
        w.style.transform = "translate3d(0,120%,0)";
        mask.appendChild(w);
        el.appendChild(mask);
        return [w];
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

    /* 正文：字/词按阅读顺序从左到右依次亮起，只动 opacity，不做任何位移。
       2026-11-10 第六版（用户定稿）：英文不等中文全部亮完——
         「中文快完结的时候」英文就开始进场（重叠尾部，不重叠主体）。
       实现：下一组起跑时刻 = 上一组总时长 × 85%，即中文最后 ~15% 的
         时间内英文已经开始亮，等中文最后一个字落定，英文前几个词也已
         出现，节奏紧凑但不抢戏。
       其余节奏不变：中文段排完仍约 3.2~3.9s（REVEAL_SPAN 兜住），单字淡入 .7s。
       CSS 兜底分支（库没到时）用同一套时刻表，两条路径观感一致。 */
    var REVEAL_SPAN = 3.2;    /* 每组排完的时间（秒），不含最后一字的淡入 */
    var REVEAL_DELAY = 0.22;  /* 等标题抬出来再起 */
    var OVERLAP = 0.85;       /* 下一组在上一组进行到 85% 时进场（0.85 ≈ 尾部重叠） */
    var staggerFor = function (n) {
        return Math.min(0.09, REVEAL_SPAN / Math.max(n, 1));
    };
    /* 一组从起跑到「最后一字淡入结束」的总秒数（用于推算下一组的起跑时刻） */
    var groupSpanFor = function (n) {
        return staggerFor(n) * Math.max(n - 1, 0) + 0.7;
    };
    var runWordReveal = function (groups) {
        var wait = REVEAL_DELAY;   /* 中文先起跑 */
        groups.forEach(function (g) {
            if (!g.length) return;
            gsap.to(g, {
                opacity: 1,
                duration: 0.7,
                ease: "power1.out",
                stagger: staggerFor(g.length),
                delay: wait,
            });
            wait += groupSpanFor(g.length) * OVERLAP;   /* 英文在中文快收尾时进场 */
        });
    };

    /* 标题中文：遮罩内从下往上抬出（开场「支援未来」同款），两字一组错峰 0.06s。
       ⚠ 必须先 gsap.set 把 y 归零再动 yPercent：字块初始的内联样式是
         translate3d(0,120%,0)，gsap 读到的是一段已经换算成 px 的 transform（y=47.6px），
         只动 yPercent 的话它会一直保留这 47.6px 的残留位移，字块永远抬不回来
         （实测：yPercent 归 0 了，视觉上却还沉在遮罩下面）。 */
    var runTitleCnReveal = function (words) {
        gsap.set(words, { x: 0, y: 0, yPercent: 120 });
        gsap.to(words, {
            yPercent: 0,
            duration: 0.9,
            ease: "power3.out",   /* 整块一起抬，没有 stagger */
            delay: 0.05,
        });
    };
    /* ======== ↑↑ 母本抄写结束 ↑↑ ======== */

    /* ---- 组装：标题原文 / 正文拆词 / 按钮标签 ---- */
    var items = blocks.map(function (block) {
        var title = block.querySelector(".value-title");
        /* 2026-11-08 中英双文：乱码改挂到「小号英文副标题」上。
           原因有两条：① scrambleToken 只替换 [A-Za-z]，汉字本来就跳不动；
           ② runTitleScramble 收尾是直接写 el.textContent —— 挂到 h3 上，
              里面的 .value-title-cn / .value-title-en 两个 span 会被冲掉，
              中文大字瞬间变回原字号的一行纯文本。所以只动这个子节点。 */
        var titleEn = title ? title.querySelector(".value-title-en") : null;
        /* 中文标题：包成遮罩 + 字块，等 play 时从下往上抬出来 */
        var cnWords = splitTitleCn(title ? title.querySelector(".value-title-cn") : null);
        var text = block.querySelector(".value-text");
        var btn = block.querySelector(".value-btn");
        var label = btn ? btn.querySelector(".value-btn-label") : null;
        /* 正文：中文逐字、英文逐词，但各成一组、同时开演（不再排队）。
           groups = [[中文字块…], [英文词…]]，play 里每组一条补间。 */
        var groups = [].slice.call(block.querySelectorAll(".value-text")).map(splitWords);
        var words = [];
        groups.forEach(function (g) { words = words.concat(g); });
        return {
            block: block,
            content: block.querySelector(".value-content") || block,  /* 触发器挂在文字容器上 */
            title: titleEn || title,
            titleText: titleEn ? titleEn.textContent : (title ? title.textContent : ""),
            cnWords: cnWords,
            text: text,
            words: words,
            groups: groups,
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
         ② IntersectionObserver 挂主触发（rootMargin -45% ≈ top 55% 线）；
         ③ scroll 监听兜底。gsap 只负责「怎么演」，不负责「何时演」。
       触发线（2026-11-10 第六版用户定稿）：块顶到达屏幕 55% 线才开演。
         原来 80% 线太靠下——块还在屏幕底部就开始播，等用户把块滑到
         舒适的阅读位置，动画已经演完了大半，后面的段落根本看不全。
         55% 线意味着块已经占了屏幕下半到中间的位置，开演时用户正好盯着它。
       ⚠ inView（scroll 兜底）与 IO 的 rootMargin 必须是同一条线，
         否则两条路径会在不同时刻开演。 */
    function inView(el) {
        return el.getBoundingClientRect().top < window.innerHeight * 0.55;
    }

    function play(it) {
        if (it.done) return;
        it.done = true;
        /* 英文小标题：乱码落定（不动它，还是老样子） */
        if (it.title) runTitleScramble(it.title, it.titleText);
        if (window.gsap) {
            /* 中文标题：遮罩内从下往上抬出；正文：字/词逐个跳出来 */
            if (it.cnWords.length) runTitleCnReveal(it.cnWords);
            if (it.groups.length) runWordReveal(it.groups);
        } else {
            /* 库没到：同款位移换成 CSS 过渡，绝不把字停在不可见状态 */
            it.cnWords.forEach(function (w) {
                w.style.transition = "transform .9s cubic-bezier(.215,.61,.355,1)";
                w.style.transform = "translate3d(0,0,0)";
            });
            var waitAcc = REVEAL_DELAY;   /* 与 gsap 分支同一时刻表：英文在中文快收尾时进场 */
            it.groups.forEach(function (g) {
                var step = staggerFor(g.length);
                var wait = waitAcc;
                g.forEach(function (w, i) {
                    var d = (wait + i * step).toFixed(3) + "s";
                    w.style.transition = "opacity .7s ease-out " + d;
                    w.style.opacity = "1";
                });
                waitAcc = wait + groupSpanFor(g.length) * OVERLAP;
            });
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
            }, { rootMargin: "0px 0px -45% 0px" });
            io.observe(it.content);
        }
        /* scroll 兜底：IO 都不可用的老浏览器也能演（done 防重入） */
        var onScroll = function () {
            if (inView(it.content)) { play(it); window.removeEventListener("scroll", onScroll); }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* 挂触发器（2026-11-10 第六版）：不再"立即"挂——等布局稳定后再挂。
       原因（线上实锤）：本脚本在 DOMContentLoaded 就跑，而门面的
       ScrollTrigger pin 那时还没建，整页比最终布局短一大截，
       简介块在"假布局"里已经够到触发线 → 页面一加载动画就偷偷开演
       （字藏在屏幕外亮），用户真正滑到位时只剩尾巴，后面的段落看不全。
       做法：load + 500ms（pin 建好、ScrollTrigger refresh 完）再 arm；
       极端情况下 load 迟迟不 fired 就用 3s 兜底。字本来就是内联
       opacity:0 隐藏的，晚挂触发器不会有任何视觉副作用。 */
    var armedAll = false;
    function armAll() {
        if (armedAll) return;
        armedAll = true;
        items.forEach(arm);
        armFuse();
    }
    if (document.readyState === "complete") {
        setTimeout(armAll, 500);
    } else {
        window.addEventListener("load", function () { setTimeout(armAll, 500); });
        setTimeout(armAll, 3000);   /* load 迟到/被卡时的兜底 */
    }

    /* 保险丝：arm 后 3s 仍在触发线内却没演过的块，强制演一次。
       触发器本身有三层（已在视口 / IO / scroll），这里只是兜住极端情况，
       免得任何一个环节被脚本打断时，字永久停在不可见状态。
       ⚠ 必须挂在 armAll 之后计时：提前跑的话 pin 还没建，"假布局"
       会把远在屏幕外的块误判成已入视口（本轮 bug 的根源之一）。 */
    function armFuse() {
        setTimeout(function () {
            items.forEach(function (it) { if (!it.done && inView(it.content)) play(it); });
        }, 3000);
    }

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
                        start: "top 55%",   /* 与 IO / scroll 兜底同一条触发线 */
                        once: true,
                        /* ⚠ 必须实时校验：这些 ST 可能是在门面 pin 建好之前的
                           旧布局上算的 start（偏小几千像素），滚动时会提前
                           onEnter——线上实测三个块被一次全放完。位置不对就
                           不演、不杀，由 IO / scroll 兜底在真正的 55% 线接管。 */
                        onEnter: function () { if (inView(it.content)) play(it); }
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
