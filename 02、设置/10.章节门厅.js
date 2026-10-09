/* ============================================================
   02、设置 · 10.章节门厅.js   （v4 · 抽屉版）
   ------------------------------------------------------------
   这是什么：主页的「章节门厅」——五个章节画板
   （准入 / 采购 / 销售 / 财务 / 其他），每章占满一整屏。

   v4 交互（按老板要求重做）：
     · 点某章的「进入目录」→ 不再跳到页面底部的汇总目录，
       而是**在这一章画板的下方原地向下抽屉式展开**，
       只列出这一章自己的流程（其他四章不掺进来）。
     · 手风琴式：同一时间只展开一章，展开新的自动收起旧的。
     · 点抽屉里的某个流程 → 直接进入该流程正文（走主程序
       的 openPage，侧栏、门锁、URL ?page= 全都不受影响）。
     · 底部那份「操作手册目录 + 搜索框 + 分类胶囊」整块退役：
       DOM 还在（深链 ?page=xxx 和侧栏还靠它），但界面上
       永远不显示——hall-mode 一旦挂上就不再摘掉。

   它怎么工作：
     · 不改 01.站点主程序.js 的任何一行 —— loadPortal 包一层：
       目录画完后挂门厅；抽屉数据**打开时才**从对应
       .portal-group 的卡片里现取（此时步骤数已精修完成）。
     · 展开动画用 grid-template-rows 0fr→1fr：高度自适应、
       任何流程数量都顺滑，不依赖 JS 算像素。
     · 滚动前先结束门面阶段（stopSmooth）：站点有「滚过门面
       55% 就销毁平滑滚动」的逻辑，程序化跳转必须先走这一步。
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

    /* ---------- 五张配图：同一张背景图，各裁不同部位 ---------- */
    var HALL_IMG = "02、设置/素材/01.门面主图A.jpg";
    var CROPS = ["22% 30%", "55% 18%", "82% 45%", "35% 72%", "62% 88%"];

    /* ---------- 找分组锚点：按名字模糊匹配目录里的 data-group ---------- */
    function findGroup(zh) {
        var groups = document.querySelectorAll(".portal-group[data-group]");
        for (var i = 0; i < groups.length; i++) {
            if ((groups[i].getAttribute("data-group") || "").indexOf(zh) !== -1) return groups[i];
        }
        return null;
    }

    /* ---------- 同网页内平滑跳转 ----------
       关键坑（实测发现）：站点有「滚过门面 55% 就 stopSmooth()
       销毁 Lenis」的逻辑。跨门面的程序化跳转，先主动结束门面
       阶段再滚，否则会卡死在门面半路。 */
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

    /* ============================================================
       抽屉：数据 + 渲染
       ============================================================ */

    /* 从隐藏的目录分组里现取该章的流程卡片，拼成抽屉行。
       打开时才取：此时主程序多半已完成精修（真实标题 + 步骤数）。 */
    function buildRows(zh) {
        var g = findGroup(zh);
        var rows = [];
        if (!g) return rows;
        var cards = g.querySelectorAll(".portal-card");
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var titleEl = card.querySelector(".portal-card-title");
            var metaEl = card.querySelector(".portal-card-meta");
            rows.push({
                folder: card.getAttribute("data-folder") || "",
                page: card.getAttribute("data-page") || "",
                title: titleEl ? titleEl.textContent : card.getAttribute("data-page"),
                meta: metaEl ? metaEl.textContent : "",
                missing: !!card.querySelector(".portal-card-tag")
            });
        }
        return rows;
    }

    function pad2(n) { return (n < 10 ? "0" : "") + n; }

    /* 首次展开时把行画进抽屉（之后不再重画，保持展开动画状态）
       v5：头部升级为「描边章节号水印 + Chapter 编号 + 流程数」，
       行升级为「编号 / 大标题 / 步骤数 / 圆环箭头」四栏 */
    function fillDrawer(drawer, c) {
        if (drawer.__filled) return;
        drawer.__filled = true;
        var rows = buildRows(c.zh);

        var inner = document.createElement("div");
        inner.className = "hall-drawer-inner";

        /* 巨型描边章节号水印（纯装饰） */
        var ghost = document.createElement("span");
        ghost.className = "hall-drawer-ghost";
        ghost.setAttribute("aria-hidden", "true");
        ghost.textContent = c.no;
        inner.appendChild(ghost);

        var head = document.createElement("div");
        head.className = "hall-drawer-head";
        head.innerHTML =
            '<span class="hall-drawer-kicker">Chapter ' + c.no + " · " + c.en + "</span>" +
            '<span class="hall-drawer-count"><b>' + rows.length + "</b> 个流程<i>· 点行展开正文</i></span>";
        inner.appendChild(head);

        var list = document.createElement("div");
        list.className = "hall-drawer-list";

        if (!rows.length) {
            var none = document.createElement("p");
            none.className = "hall-drawer-empty";
            none.textContent = "这一章的流程还在整理中。";
            list.appendChild(none);
        }

        rows.forEach(function (r, i) {
            var a = document.createElement("a");
            a.className = "hall-row" + (r.missing ? " is-missing" : "");
            a.href = "javascript:void(0)";
            a.style.setProperty("--i", i);
            a.setAttribute("data-idx", i);
            a.innerHTML =
                '<span class="hall-row-no">' + pad2(i + 1) + "</span>" +
                '<span class="hall-row-body">' +
                '<span class="hall-row-title">' + r.title + "</span>" +
                "</span>" +
                '<span class="hall-row-meta">' + (r.missing ? "待补充" : r.meta) + "</span>" +
                '<span class="hall-row-arrow"><i>→</i></span>';
            /* v6：点击行 = SOP 正文就地展开（行级手风琴），不再跳页 */
            a.addEventListener("click", function () { toggleRowDetail(a, r); });
            /* 悬停预取：正文在后台备好，点开基本秒出 */
            a.addEventListener("mouseenter", function () {
                if (!r.missing && typeof window.prefetchPage === "function") {
                    window.prefetchPage(r.folder, r.page);
                }
            });
            list.appendChild(a);
        });

        inner.appendChild(list);
        drawer.appendChild(inner);

        /* 行的错峰入场：下一帧再加 is-in，让 transition 生效 */
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                drawer.classList.add("is-in");
            });
        });
    }

    /* ============================================================
       v6 · 行级抽屉：SOP 正文就地展开
       ------------------------------------------------------------
       点行 → 在该行正下方展开这篇 SOP 的完整正文（聚合页则
       全部工序按顺序铺开），再点收起；同一时间只展开一行。
       正文复用主程序的 buildPage（include 并行拉取 + marked +
       pageCache 缓存）与 paintLevelCells 要点表上色，观感与
       正文页完全一致；悬停行时 prefetchPage 已在后台备好。
       内容门锁照常生效：没解锁先弹锁，解锁后接着展开。
       ============================================================ */

    /* 展开区里的步骤抽屉（details.sop-step）：一次只开一步，只绑本区 */
    function bindStepAccordions(scope) {
        var steps = scope.querySelectorAll("details.sop-step");
        steps.forEach(function (el) {
            el.addEventListener("toggle", function () {
                if (!el.open) return;
                steps.forEach(function (o) {
                    if (o !== el && o.open) o.open = false;
                });
            });
        });
    }

    function closeRowDetail(row) {
        row.classList.remove("is-open");
        row.setAttribute("aria-expanded", "false");
        var wrap = row.nextElementSibling;
        if (wrap && wrap.classList.contains("hall-detail-wrap")) {
            wrap.classList.remove("is-open");
        }
    }

    function closeAllRowDetails(except) {
        document.querySelectorAll(".hall-row.is-open").forEach(function (row) {
            if (row !== except) closeRowDetail(row);
        });
    }

    function toggleRowDetail(row, r) {
        if (r.missing) return;                       /* 待补充行保持安静 */

        var isOpen = row.classList.contains("is-open");
        closeAllRowDetails(row);                     /* 手风琴：先收别的行 */
        if (isOpen) { closeRowDetail(row); return; }

        var wrap = row.nextElementSibling;
        if (!(wrap && wrap.classList.contains("hall-detail-wrap"))) {
            wrap = document.createElement("div");
            wrap.className = "hall-detail-wrap";
            wrap.innerHTML = '<div class="hall-detail"><p class="hall-detail-loading">正在展开内容…</p></div>';
            if (row.nextElementSibling) {
                row.parentElement.insertBefore(wrap, row.nextElementSibling);
            } else {
                row.parentElement.appendChild(wrap);
            }
        }

        row.classList.add("is-open");
        row.setAttribute("aria-expanded", "true");
        var detail = wrap.querySelector(".hall-detail");

        var render = function () {
            var build = null;
            try { build = window.buildPage; } catch (e) { }
            if (typeof build !== "function") {
                detail.innerHTML = '<p class="hall-detail-missing">内容组件未就绪，请刷新重试。</p>';
                return;
            }
            build(r.folder, r.page).then(function (page) {
                if (row.classList.contains("is-open") === false && wrap.classList.contains("is-open") === false) {
                    /* 用户在等待期间又点了一下收起了 —— 只更新缓存，不再展开 */
                    return;
                }
                if (!page) {
                    detail.innerHTML = '<p class="hall-detail-missing">这份 SOP 的内容还在整理中。</p>';
                } else {
                    detail.innerHTML = "";
                    if (page.chunks.length > 1) {
                        /* 聚合页：左侧「本页指引」栏，点哪个分支显示哪个（v8） */
                        var layout = document.createElement("div");
                        layout.className = "hall-detail-layout";

                        var body = document.createElement("div");
                        body.className = "page-content markdown-body hall-detail-body";

                        var toc = document.createElement("aside");
                        toc.className = "hall-detail-toc";
                        toc.innerHTML = '<p class="hall-toc-title">本页指引</p>';
                        var ul = document.createElement("ul");
                        ul.className = "hall-toc-list";

                        var links = [];
                        page.chunks.forEach(function (c, i) {
                            var sec = document.createElement("section");
                            sec.className = "doc-chunk" + (i === 0 ? " active" : "");
                            if (c.title && c.title !== "概述") {
                                var h = document.createElement("h2");
                                h.textContent = c.title;
                                sec.appendChild(h);
                            }
                            sec.insertAdjacentHTML("beforeend", c.html);
                            body.appendChild(sec);

                            var li = document.createElement("li");
                            var tlink = document.createElement("a");
                            tlink.href = "javascript:void(0)";
                            tlink.textContent = c.title;
                            if (i === 0) tlink.className = "is-active";
                            tlink.addEventListener("click", function () {
                                body.querySelectorAll(".doc-chunk").forEach(function (el, k) {
                                    el.classList.toggle("active", k === i);
                                });
                                links.forEach(function (l, k) { l.classList.toggle("is-active", k === i); });
                            });
                            links.push(tlink);
                            li.appendChild(tlink);
                            ul.appendChild(li);
                        });

                        toc.appendChild(ul);
                        layout.appendChild(body);
                        layout.appendChild(toc);
                        detail.appendChild(layout);
                    } else {
                        var single = document.createElement("div");
                        single.className = "page-content markdown-body hall-detail-body";
                        var sec = document.createElement("section");
                        sec.className = "doc-chunk active";
                        sec.innerHTML = page.chunks[0].html;
                        single.appendChild(sec);
                        detail.appendChild(single);
                    }
                    if (typeof window.paintLevelCells === "function") window.paintLevelCells(detail);
                    bindStepAccordions(detail);
                }
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        wrap.classList.add("is-open");
                        /* 展开后停在点开的这行：正文比屏幕高时把行顶带到
                           视口上部，从第一屏往下读——不再滚到正文最底端 */
                        setTimeout(function () {
                            var rect = wrap.getBoundingClientRect();
                            var vh = window.innerHeight || 1;
                            if (rect.bottom > vh) {
                                var rowTop = window.pageYOffset + row.getBoundingClientRect().top;
                                smoothTo(rowTop - 84);
                            }
                        }, 520);
                    });
                });
            }).catch(function () {
                detail.innerHTML = '<p class="hall-detail-missing">内容加载失败，请稍后再试。</p>';
            });
        };

        /* 内容门锁：与 loadContent 同一处闸门逻辑 */
        if (window.SiteGate && typeof window.SiteGate.isUnlocked === "function" && !window.SiteGate.isUnlocked()) {
            window.SiteGate.request(render);
            return;
        }
        render();
    }

    /* ---------- 手风琴：只允许一章展开 ---------- */
    function closePanel(panel) {
        panel.classList.remove("is-open");
        var btn = panel.querySelector(".hall-btn");
        if (btn) {
            btn.setAttribute("aria-expanded", "false");
            var label = btn.querySelector(".hall-btn-label");
            if (label) label.textContent = "进入目录";
        }
    }

    function togglePanel(panel, c) {
        var opening = !panel.classList.contains("is-open");

        /* 先收起其他已展开的章（手风琴） */
        var hall = panel.closest(".chapter-hall");
        if (hall) {
            hall.querySelectorAll(".hall-panel.is-open").forEach(function (p) {
                if (p !== panel) closePanel(p);
            });
        }

        var drawer = panel.querySelector(".hall-drawer");
        var btn = panel.querySelector(".hall-btn");
        if (opening) {
            if (drawer) fillDrawer(drawer, c);
            panel.classList.add("is-open");
            if (btn) {
                btn.setAttribute("aria-expanded", "true");
                var label = btn.querySelector(".hall-btn-label");
                if (label) label.textContent = "收起目录";
            }
            /* 展开后停在目录顶部：抽屉比屏幕高时，把抽屉头部对齐到
               视口上部，从「Chapter 标题 + 第一行流程」往下看——
               不再默认停在抽屉最底端；比屏幕矮时维持原逻辑，
               把下缘轻轻带进视口即可 */
            setTimeout(function () {
                var d = drawer.getBoundingClientRect();
                var vh = window.innerHeight || 1;
                if (d.bottom - d.top > vh) {
                    smoothTo(window.pageYOffset + d.top - 24);
                } else if (d.bottom > vh) {
                    smoothTo(window.pageYOffset + d.bottom - vh + 32);
                }
            }, 780);
        } else {
            closePanel(panel);
        }
    }

    /* ============================================================
       画门厅（五个全屏章节画板 + 各自的抽屉位）
       ============================================================ */
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
            btn.setAttribute("aria-expanded", "false");
            btn.innerHTML =
                '<span class="hall-btn-label">进入目录</span>' +
                '<span class="hall-arrow">→</span>';
            btn.addEventListener("click", function () { togglePanel(panel, c); });
            copy.appendChild(btn);
            panel.appendChild(copy);

            var fig = document.createElement("figure");
            fig.className = "hall-figure";
            var img = document.createElement("img");
            img.className = "hall-img";
            img.loading = "lazy";
            img.alt = c.zh + "章节配图";
            img.src = HALL_IMG;
            img.style.objectPosition = CROPS[idx % CROPS.length];
            fig.appendChild(img);
            var cap = document.createElement("figcaption");
            cap.textContent = c.en;
            fig.appendChild(cap);
            panel.appendChild(fig);

            /* 抽屉位：横跨两列，压在图片与文字下方；展开时把
               后面的章节画板自然往下推 */
            var wrap = document.createElement("div");
            wrap.className = "hall-drawer-wrap";
            var drawer = document.createElement("div");
            drawer.className = "hall-drawer";
            wrap.appendChild(drawer);
            panel.appendChild(wrap);

            hall.appendChild(panel);
        });

        return hall;
    }

    /* ---------- 图片视差：滚动时图片在裁切框里微微滑动 ---------- */
    function initParallax(hall) {
        if (hall.__parallax) return;
        hall.__parallax = true;
        var items = Array.prototype.map.call(hall.querySelectorAll(".hall-img"), function (img) {
            return { img: img, panel: img.closest(".hall-panel") };
        });
        var RANGE = 46;
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
                if (r.bottom < -120 || r.top > vh + 120) return;
                var center = r.top + window.pageYOffset + r.height / 2;
                var p = (mid - center) / ((vh + r.height) / 2);
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
        /* hall-mode 挂上就不再摘：底部汇总目录（标题/搜索/胶囊/五个区）
           从此只作为数据源与深链容器存在，界面上不再出现 */
        portal.classList.add("hall-mode");
    }

    /* ---------- 包一层 loadPortal：目录每次画完就重新布置 ---------- */
    function arm() {
        if (typeof window.loadPortal !== "function") {
            setTimeout(arm, 120);
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
