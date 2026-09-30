/* ============================================================
   03、设置 · 14.章节门厅.js
   ------------------------------------------------------------
   这是什么：主页的「章节门厅」——仿 inversa.com 的五章节画板
   （准入 / 采购 / 销售 / 财务 / 其他），每章占满一整屏。
   行为约定（按老板要求）：
     · 主页只显示这五个章节，「操作手册目录」及其下面的内容
       全部藏起来（给 .portal 加 hall-mode，CSS 负责藏）。
     · 点某章的「进入目录」→ 摘掉 hall-mode 露出目录区，
       同一网页内平滑滚到目录顶部，并且**自动筛选出该章的
       SOP**；目录页顶部有一排章节胶囊，可随时切换/看全部。
   它怎么工作：
     · 不改 1.站点主程序.js 的任何一行 —— 在这里把它的
       loadPortal() 包一层：等目录画完，挂门厅、进 hall-mode。
     · 章节筛选用独立的 grp-off 类，不碰搜索框自己的
       is-hidden 逻辑，两套筛选互不打架。
     · 滚动前先结束门面阶段（stopSmooth）：站点有「滚过门面
       55% 就销毁平滑滚动」的逻辑，任何跨门面的程序化跳转都
       得先走这一步，否则会卡死在门面半路（实测踩过的坑）。
   想改文案：只动下面 CHAPTERS 这一张表。
   ============================================================ */
(function () {
    "use strict";

    /* ---------- 五个章节的文案表（想改就改这里） ---------- */
    var CHAPTERS = [
        {
            no: "01", en: "ACCESS", zh: "准入",
            desc: "新供应商、账号权限与主数据的第一道关：谁能进来、进来后能看到什么、门槛在哪。"
        },
        {
            no: "02", en: "PROCUREMENT", zh: "采购",
            desc: "从采购申请到下单收货：每一步的标准动作、审批链路和常见坑。"
        },
        {
            no: "03", en: "SALES", zh: "销售",
            desc: "订单、开票与发货：对外的每一个承诺，都要有对内的标准动作兜底。"
        },
        {
            no: "04", en: "FINANCE", zh: "财务",
            desc: "收款、对账与资金安排：钱的事没有小事，规矩都在这里。"
        },
        {
            no: "05", en: "OTHERS", zh: "其他",
            desc: "系统之外但同样要紧的零散事项：临时任务、例外处理与备查记录。"
        }
    ];

    /* ---------- 五张配图：统一用这一张背景图，各裁不同部位 ----------
       想整体换图：改 HALL_IMG 一个字就行；想微调某章取景：动 CROPS。 */
    var HALL_IMG = "03、设置/6.门面主图A.jpg";
    var CROPS = ["22% 30%", "55% 18%", "82% 45%", "35% 72%", "62% 88%"];

    /* ---------- 当前选中的章节（null = 全部） ---------- */
    var activeChapter = null;

    function allGroups() {
        return Array.prototype.slice.call(document.querySelectorAll(".portal-group[data-group]"));
    }

    /* ---------- 找分组锚点：按名字模糊匹配目录里的 data-group ---------- */
    function findGroup(zh) {
        var groups = allGroups();
        for (var i = 0; i < groups.length; i++) {
            if ((groups[i].getAttribute("data-group") || "").indexOf(zh) !== -1) return groups[i];
        }
        return null;
    }

    /* ---------- 同网页内平滑跳转 ----------
       关键坑（实测发现，站点自带的「跳过动画」按钮也踩了同一个坑）：
       站点有「滚过门面 55% 就 stopSmooth() 销毁 Lenis」的逻辑。平时
       滚轮慢慢滚没事；但凡是跨过门面的程序化跳转，动画飞到半路就会
       触发这条逻辑，Lenis 被销毁，滚动卡死在门面里（表现为点了没反应）。
       所以下面先主动结束门面阶段（停掉 Lenis），再用原生平滑滚。 */
    function leaveHeroPhase() {
        var facade = window.HeroFacade;
        if (facade && facade.lenis && typeof facade.stopSmooth === "function") {
            facade.stopSmooth();
        }
    }

    function smoothTo(y) {
        leaveHeroPhase();
        window.scrollTo({ top: Math.max(y, 0), behavior: "smooth" });
    }

    function flashGroup(g) {
        setTimeout(function () {
            g.classList.remove("hall-flash");
            void g.offsetWidth;
            g.classList.add("hall-flash");
            setTimeout(function () { g.classList.remove("hall-flash"); }, 1800);
        }, 900);
    }

    /* ---------- 章节筛选 ----------
       给不匹配的分组打 grp-off（整组隐藏）。
       搜索框自己的 is-hidden 逻辑不受影响：搜索事件后再跑一遍
       本函数，两套筛选叠加生效。 */
    function applyChapterFilter() {
        allGroups().forEach(function (g) {
            var name = g.getAttribute("data-group") || "";
            var off = activeChapter !== null && name.indexOf(activeChapter) === -1;
            g.classList.toggle("grp-off", off);
        });
        /* 胶囊高亮同步 */
        document.querySelectorAll(".hall-chip").forEach(function (chip) {
            chip.classList.toggle("is-active", (chip.getAttribute("data-zh") || null) === activeChapter);
        });
        /* 空状态兜底：筛选 + 搜索叠加后一个流程都看不到时给提示 */
        var anyVisible = allGroups().some(function (g) {
            return !g.classList.contains("grp-off") && !g.classList.contains("is-hidden");
        });
        var empty = document.getElementById("portalEmpty");
        if (empty) empty.classList.toggle("is-visible", !anyVisible);
    }

    /* ---------- 从主页进入目录 ----------
       zh = 章节名：露出目录、筛到该章、滚到目录顶部；
       zh 为空 = 看全部。 */
    function enterCatalog(zh) {
        var portal = document.querySelector(".portal");
        if (!portal) return;
        portal.classList.remove("hall-mode");
        activeChapter = zh || null;
        applyChapterFilter();
        var hero = portal.querySelector(".portal-hero");
        if (hero) {
            smoothTo(hero.getBoundingClientRect().top + window.pageYOffset - 12);
        }
        if (zh) {
            var g = findGroup(zh);
            if (g) flashGroup(g);
        }
    }

    /* ---------- 目录页顶部的章节筛选胶囊 ---------- */
    function buildChips(portal) {
        if (portal.querySelector(":scope > .portal-hero .hall-chips")) return;
        var hero = portal.querySelector(".portal-hero");
        var search = portal.querySelector(".portal-search");
        if (!hero || !search) return;
        var bar = document.createElement("div");
        bar.className = "hall-chips";

        var all = document.createElement("button");
        all.type = "button";
        all.className = "hall-chip";
        all.setAttribute("data-zh", "");
        all.textContent = "全部";
        all.addEventListener("click", function () {
            activeChapter = null;
            applyChapterFilter();
        });
        bar.appendChild(all);

        CHAPTERS.forEach(function (c) {
            var chip = document.createElement("button");
            chip.type = "button";
            chip.className = "hall-chip";
            chip.setAttribute("data-zh", c.zh);
            chip.textContent = c.zh;
            chip.addEventListener("click", function () {
                activeChapter = c.zh;
                applyChapterFilter();
            });
            bar.appendChild(chip);
        });

        search.parentNode.insertBefore(bar, search.nextSibling);
    }

    /* ---------- 画门厅（五个全屏章节画板） ---------- */
    function buildHall() {
        var hall = document.createElement("section");
        hall.className = "chapter-hall";
        hall.setAttribute("aria-label", "手册章节门厅");

        CHAPTERS.forEach(function (c, idx) {
            var panel = document.createElement("div");
            panel.className = "hall-panel";

            var no = document.createElement("span");
            no.className = "hall-no";
            no.textContent = c.no;
            panel.appendChild(no);

            var copy = document.createElement("div");
            copy.className = "hall-copy";
            copy.innerHTML =
                '<p class="hall-kicker">' + c.no + " · " + c.en + "</p>" +
                '<h2 class="hall-title">' + c.zh + "</h2>" +
                '<p class="hall-desc">' + c.desc + "</p>";
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "hall-btn";
            btn.innerHTML = "进入目录 <span class=\"hall-arrow\">→</span>";
            btn.addEventListener("click", function () { enterCatalog(c.zh); });
            copy.appendChild(btn);
            panel.appendChild(copy);

            var fig = document.createElement("figure");
            fig.className = "hall-figure";
            var img = document.createElement("img");
            img.className = "hall-img";
            img.loading = "lazy";
            img.alt = c.zh + "章节配图";
            img.src = HALL_IMG;
            /* 同一张图，各章裁不同部位（object-position），不做其他花样 */
            img.style.objectPosition = CROPS[idx % CROPS.length];
            fig.appendChild(img);
            var cap = document.createElement("figcaption");
            cap.textContent = c.en;
            fig.appendChild(cap);
            panel.appendChild(fig);

            hall.appendChild(panel);
        });

        return hall;
    }

    /* ---------- 图片视差：滚动时图片在裁切框里微微滑动 ----------
       手感对齐 inversa.com：图片不跟着页面死滚，而是相对自己的
       裁切框有一点点上下漂移。实现：rAF 节流的滚动监听，按
       「画板中心 vs 视口中心」的偏离量给 img 一个 translateY；
       CSS 里 img 预放大了 15%（scale 1.15），滑动不会露出白边。
       手机（≤860px）关闭，省电也避免和触控滚动打架。 */
    function initParallax(hall) {
        if (hall.__parallax) return;
        hall.__parallax = true;
        var items = Array.prototype.map.call(hall.querySelectorAll(".hall-img"), function (img) {
            return { img: img, panel: img.closest(".hall-panel") };
        });
        var RANGE = 46;         /* 总滑动幅度(px)：微微的，不抢戏 */
        var ticking = false;

        function update() {
            ticking = false;
            var vh = window.innerHeight || 1;
            if (window.innerWidth <= 860) {
                items.forEach(function (it) { it.img.style.transform = ""; });
                return;
            }
            var mid = window.pageYOffset + vh / 2;
            items.forEach(function (it) {
                var r = it.panel.getBoundingClientRect();
                if (r.bottom < -120 || r.top > vh + 120) return;   /* 视口外不算 */
                var center = r.top + window.pageYOffset + r.height / 2;
                var p = (mid - center) / ((vh + r.height) / 2);    /* -1 ~ 1 */
                if (p < -1) p = -1; else if (p > 1) p = 1;
                it.img.style.transform =
                    "translateY(" + (-p * RANGE).toFixed(1) + "px) scale(1.15)";
            });
        }
        function onScroll() {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        update();
    }

    /* ---------- 挂载：门厅插最前 + 进入主页模式（幂等） ---------- */
    function mountHall() {
        var portal = document.querySelector(".portal");
        if (!portal) return;
        var hall = portal.querySelector(":scope > .chapter-hall");
        if (!hall) {
            hall = buildHall();
            portal.insertBefore(hall, portal.firstChild);
        }
        initParallax(hall);
        buildChips(portal);
        /* 搜索框每次重画都是新元素，补一个「搜索后再叠加章节筛选」的钩子 */
        var input = document.getElementById("portalSearch");
        if (input && !input.__hallPatch) {
            input.__hallPatch = true;
            input.addEventListener("input", applyChapterFilter);
        }
        /* 每次回到主页都从「全部 + 只看门厅」开始 */
        activeChapter = null;
        portal.classList.add("hall-mode");
    }

    /* ---------- 包一层 loadPortal：目录每次画完就重新布置 ---------- */
    function arm() {
        if (typeof window.loadPortal !== "function") {
            setTimeout(arm, 120);   /* 主程序还没就绪，稍等再试 */
            return;
        }
        if (window.__hallArmed) return;
        window.__hallArmed = true;
        var orig = window.loadPortal;
        window.loadPortal = async function () {
            var r = await orig.apply(this, arguments);
            try { mountHall(); } catch (e) { console.error("章节门厅挂载失败:", e); }
            return r;
        };
    }

    arm();
})();
