/* ============================================================
   03、设置 · 1.站点主程序.js
   ------------------------------------------------------------
   这是什么：主页（支援未来文档站）的功能代码，和开屏动画无关。
   它做的事：五件事 ——
     ① 首页「卡片门户」：把 29 个流程按业务分组摊成卡片，
        带搜索过滤（卡片上的「N 个步骤」= 该流程首页在 ## FAQ 之前的引入数）；
     ② 按 sidebarManifest 清单生成左侧导航菜单，标题取自下面的并行索引，
        不再逐篇串行请求，首屏更快；
     ③ 抓取 01、支援未来/ 里的 .md 文档，用 marked 原样渲染成正文 ——
        动作词（Open / Left Click / Ctrl + D …）只做蓝色高亮，不改写、不拆行；
        正文里的 <details class="sop-step"> 会变成可折叠的「步骤抽屉」，
        同一时间只展开一个（见下面的 bindSopSteps）；
     ④ 聚合页「单工序视图」：带 include 的页按 ## 标题切块，
        右侧「本页指引」只列工序名（准发下载 / 整理表格 / 台账编辑 / FAQ），
        点工序名切换视图，同一时间只显示一个 —— 见 splitIntoChunks / showChunk；
     ⑤ 右侧「本页指引」、菜单搜索（Ctrl + K）、手风琴菜单。
   加载性能：include 全部并行拉取 + 整页会话缓存（pageCache）+
        卡片/菜单悬停预取（prefetchPage）—— 进明细不再卡几秒。
   谁在用它：站点根目录 index.html 引入后调用 init()。
   要不要改：────────────────────────────────────────────
     · 新增 / 删除流程   → 只改下面的 sidebarManifest 清单
     · 新增要高亮的动作词 → 只改下面的 keywords 清单
     · 门户卡片的外观    → 改 03、设置/2.站点样式.css 的「卡片门户首页」段
     · 步骤抽屉的外观    → 改 03、设置/2.站点样式.css 的「SOP 步骤抽屉」段
     · 工序视图的外观    → 改 03、设置/2.站点样式.css 的「单工序视图」段
   ============================================================ */

// =========================================================
// 文件清单
// =========================================================
// 注意：门户卡片的「N 个步骤」= 首页里 ## FAQ 之前的 <!-- include: --> 条数，
// 所以长流程页把子流程拆成 include 时，卡片数字会同步变化。
const sidebarManifest = [
    // ===== 01.准入 =====
    { folder: "01.准入/01.01.准入", file: "01.01.00.准入" },
    { folder: "01.准入/01.02.MDG", file: "01.02.00.MDG" },

    // ===== 02.采购 =====
    { folder: "02.采购/02.01.订货", file: "02.01.00.订货" },
    { folder: "02.采购/02.02.宝钢期货订货（预）", file: "02.02.00.宝钢期货订货（预）" },
    { folder: "02.采购/02.03.宝钢期货订货", file: "02.03.00.宝钢期货订货" },
    { folder: "02.采购/02.04.华菱现货订货", file: "02.04.00.华菱现货订货" },
    { folder: "02.采购/02.05.同步", file: "02.05.00.同步" },

    // ===== 03.销售 =====
    { folder: "03.销售/03.01.让步单", file: "03.01.00.让步单" },
    { folder: "03.销售/03.02.插行", file: "03.02.00.插行" },
    { folder: "03.销售/03.03.结案", file: "03.03.00.结案" },
    { folder: "03.销售/03.04.自由款", file: "03.04.00.自由款" },
    { folder: "03.销售/03.05.电子提单", file: "03.05.00.电子提单" },
    { folder: "03.销售/03.06.入库", file: "03.06.00.入库" },
    { folder: "03.销售/03.07.转货权", file: "03.07.00.转货权" },
    { folder: "03.销售/03.08.质量异议", file: "03.08.00.质量异议" },
    { folder: "03.销售/03.09.销售开票", file: "03.09.00.销售开票" },
    { folder: "03.销售/03.10.采购发票", file: "03.10.00.采购发票" },

    // ===== 04.财务 =====
    { folder: "04.财务/04.01.财务需要采购合同", file: "04.01.00.财务需要采购合同" },
    { folder: "04.财务/04.02.月末资金归集", file: "04.02.00.月末资金归集" },
    { folder: "04.财务/04.03.月末财务余款", file: "04.03.00.月末财务余款" },
    { folder: "04.财务/04.04.年中年末对账函", file: "04.04.00.年中年末对账函" },
    { folder: "04.财务/04.05.退款申请", file: "04.05.00.退款申请" },
    { folder: "04.财务/04.06.待确认成本", file: "04.06.00.待确认成本" },

    // ===== 05.其他 =====
    { folder: "05.其他/05.01.OTL操作手册编写规范", file: "05.01.00.OTL操作手册编写规范" },
    { folder: "05.其他/05.02.用印申请", file: "05.02.00.用印申请" },
    { folder: "05.其他/05.03.员工月度考核表", file: "05.03.00.员工月度考核表" },
    { folder: "05.其他/05.04.未到卷查询", file: "05.04.00.未到卷查询" },
    { folder: "05.其他/05.05.新装C9", file: "05.05.00.新装C9" },
    { folder: "05.其他/05.07.宏程序", file: "05.07.00.宏程序" },
];

// =========================================================
// 关键词列表
// =========================================================
const keywords = ['Open', 'Write', 'Left Click', 'Right Click', 'Double Click',
    'Filter', 'Ctrl + C', 'Ctrl + V', 'Ctrl + D', 'Ctrl + F',
    'Ctrl + S', 'Ctrl + Alt + A', 'Ctrl + Alt + P', 'Ctrl + N',
    'Ctrl + ;', 'Enter', 'Esc', 'Alt + 2', 'Alt + 5', 'Close',
    'Shift + Left Click', 'Ctrl + Left Click', 'Ctrl + X', 'Ctrl + Z',
    'Ctrl + Shift + ↓',
    'Or', 'And'
];

let currentPageId = 'home';

/** 关键词高亮：单遍正则（长词优先），替代旧的逐词 25 遍扫描 */
function wrapKeywordsInHtml(html) {
    const alts = [...keywords].sort((a, b) => b.length - a.length)
        .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp('(?![^<]*>)(' + alts.join('|') + ')(?![^<]*>)', 'g');
    return html.replace(re, (m) => `<span class="action-keyword">${m}</span>`);
}

async function getTitleFromMd(folder, pageId) {
    try {
        const filePath = `01、支援未来/${folder}/${pageId}.md`;
        const resp = await fetch(filePath);
        if (!resp.ok) return pageId;
        const mdText = await resp.text();
        const match = mdText.match(/^#\s+(.+)$/m);
        return match ? match[1] : pageId;
    } catch (e) {
        return pageId;
    }
}

function generateTOCFromContent() {
    const tocList = document.getElementById('tocList');
    const tocWrapper = document.getElementById('tocWrapper');
    if (!tocList) return;

    tocList.innerHTML = '';
    const contentArea = document.querySelector('.content-area .page-content');
    if (!contentArea) {
        tocWrapper.classList.add('empty');
        return;
    }

    const headings = contentArea.querySelectorAll('h2, h3');
    if (headings.length === 0) {
        tocWrapper.classList.add('empty');
        return;
    }

    tocWrapper.classList.remove('empty');

    let faqContainer = null;

    headings.forEach((heading) => {
        const tag = heading.tagName.toLowerCase();
        const text = heading.textContent;
        const id = heading.id || 'toc-' + Math.random().toString(36).substr(2, 6);
        if (!heading.id) heading.id = id;

        if (tag === 'h2') {
            if (text === 'FAQ' || text.includes('FAQ')) {
                faqContainer = document.createElement('li');
                const parentDiv = document.createElement('div');
                parentDiv.className = 'toc-parent';
                parentDiv.onclick = function(e) {
                    e.stopPropagation();
                    const children = this.nextElementSibling;
                    if (children) {
                        const arrow = this.querySelector('.toc-arrow');
                        if (arrow) {
                            const isOpen = children.classList.contains('open');
                            arrow.textContent = isOpen ? '▶' : '▼';
                        }
                        children.classList.toggle('open');
                    }
                };

                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'toc-arrow';
                arrowSpan.textContent = '▶';

                const textSpan = document.createElement('span');
                textSpan.className = 'toc-label';
                textSpan.textContent = text;

                parentDiv.appendChild(arrowSpan);
                parentDiv.appendChild(textSpan);

                const childUl = document.createElement('ul');
                childUl.className = 'toc-children';

                faqContainer.appendChild(parentDiv);
                faqContainer.appendChild(childUl);
                tocList.appendChild(faqContainer);
                return;
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + id;
            a.textContent = text;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const navHeight = 60;
                    const rect = targetEl.getBoundingClientRect();
                    const scrollTop = window.pageYOffset + rect.top - navHeight;
                    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
            });
            li.appendChild(a);
            tocList.appendChild(li);
            faqContainer = null;
        } else if (tag === 'h3' && faqContainer) {
            const a = document.createElement('a');
            a.href = '#' + id;
            a.textContent = text;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    const navHeight = 60;
                    const rect = targetEl.getBoundingClientRect();
                    const scrollTop = window.pageYOffset + rect.top - navHeight;
                    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
                }
            });
            const childLi = document.createElement('li');
            childLi.appendChild(a);
            const childUl = faqContainer.querySelector('.toc-children');
            if (childUl) childUl.appendChild(childLi);
        }
    });
}

// =========================================================
// 手风琴菜单
// =========================================================
function toggleMenu(e) {
    const el = e.currentTarget;
    if (!el) return;

    const arrow = el.querySelector('.arrow');
    const subItems = el.nextElementSibling;
    if (!subItems || !subItems.classList.contains('sub-items')) return;

    const isCurrentlyOpen = subItems.classList.contains('open');

    const sidebar = el.closest('.sidebar');
    if (sidebar) {
        const allSubItems = sidebar.querySelectorAll('.sub-items');
        allSubItems.forEach(item => {
            if (item !== subItems && item.classList.contains('open')) {
                item.classList.remove('open');
                const parentTitle = item.previousElementSibling;
                if (parentTitle && parentTitle.classList.contains('group-title')) {
                    const parentArrow = parentTitle.querySelector('.arrow');
                    if (parentArrow) parentArrow.classList.remove('open');
                }
            }
        });
    }

    if (isCurrentlyOpen) {
        subItems.classList.remove('open');
        if (arrow) arrow.classList.remove('open');
    } else {
        subItems.classList.add('open');
        if (arrow) arrow.classList.add('open');
    }

    e.stopPropagation();
}

// =========================================================
// 搜索过滤
// =========================================================
function setupSearch() {
    const searchInput = document.getElementById('menuSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const allMenuItems = document.querySelectorAll('.sidebar .sub-items a');

        allMenuItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const parentGroup = item.closest('.menu-group');
            if (query === '') {
                item.style.display = '';
                if (parentGroup) {
                    const subItems = parentGroup.querySelector('.sub-items');
                    if (subItems) subItems.style.maxHeight = '';
                }
                return;
            }
            const match = text.includes(query);
            item.style.display = match ? '' : 'none';
            if (parentGroup && match) {
                const subItems = parentGroup.querySelector('.sub-items');
                if (subItems) subItems.style.maxHeight = '1200px';
                const groupTitle = parentGroup.querySelector('.group-title');
                if (groupTitle) {
                    const arrow = groupTitle.querySelector('.arrow');
                    if (arrow) arrow.classList.add('open');
                }
            }
        });
    });
}

// =========================================================
// 索引：并行预取 29 篇流程首页（门户卡片与左侧导航共用）
// ---------------------------------------------------------
// 一次把 29 篇取回来，算好「标题 / 步骤数」，结果按会话缓存，
// 翻页不再重复请求。取不到的文件不报错，只在卡片上标「待补充」。
// 步骤数 = 首页里 ## FAQ 之前的 <!-- include: --> 条数。
// =========================================================
const DOC_ROOT = '01、支援未来';
const INDEX_CACHE_KEY = 'support-future-index-v1';

let _indexPromise = null;

function buildIndex() {
    if (!_indexPromise) _indexPromise = _buildIndexOnce();
    return _indexPromise;
}

async function _buildIndexOnce() {
    try {
        const cached = sessionStorage.getItem(INDEX_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) { /* 隐私模式下取不到缓存就忽略 */ }

    const items = await Promise.all(sidebarManifest.map(async (item) => {
        const text = await fetchText(`${DOC_ROOT}/${item.folder}/${item.file}.md`);
        const incRe = /<!--\s*include:\s*([^\s]+\.md)\s*-->/g;
        const faqAt = text ? text.indexOf('## FAQ') : -1;
        const head = text ? (faqAt >= 0 ? text.slice(0, faqAt) : text) : '';
        const steps = text ? (head.match(incRe) || []).length : 0;
        const all = text ? (text.match(incRe) || []).length : 0;
        return {
            folder: item.folder,
            file: item.file,
            group: item.folder.split('/')[0],
            title: firstHeading(text) || item.file.replace(/^\d+\.\d+\.00\./, ''),
            steps: steps,
            missing: !text || all === 0,
        };
    }));

    const groups = {};
    items.forEach((it) => {
        if (!groups[it.group]) groups[it.group] = [];
        groups[it.group].push(it);
    });

    const index = { items: items, groups: groups, groupNames: Object.keys(groups).sort() };
    try { sessionStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index)); } catch (e) { }
    return index;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** 取回一个文件；失败返回 null，不抛异常。网络抖动时自动重试一次 */
async function fetchText(path, retried) {
    try {
        const resp = await fetch(path);
        if (!resp.ok) return null;      // 404 之类是确定的，不重试
        return await resp.text();
    } catch (e) {
        if (!retried) {
            await new Promise((r) => setTimeout(r, 400));
            return fetchText(path, true);
        }
        return null;
    }
}

/** 取文档第一行 # 标题；没有就返回空串 */
function firstHeading(mdText) {
    const m = /^#\s+(.+)$/m.exec(mdText || '');
    return m ? m[1].trim() : '';
}

// =========================================================
// 单工序视图（doc-chunk）
// ---------------------------------------------------------
// 聚合页（如 03.02.00.插行）的骨架是「## 工序名 + <!-- include: ... -->」。
// 在 include 展开【之前】按 ## 标题切块（这样子文档自己的 ## 不会被误切），
// 每块 = 一个工序视图。右侧「本页指引」只列工序名，点击切换视图，
// 同一时间只显示一个 —— 看完准发下载不会再滚出整理表格。
// 没有 include 的普通页走老逻辑：整页显示 + h2/h3 目录。
// =========================================================

const pageCache = new Map();        // key: folder/pageId -> { title, chunks:[{title, html}] }
const prefetchInFlight = new Set();

/** 按 ## 标题把聚合页 md 切成块；每块 title = ## 后的文字，body = 标题行之后的内容 */
function splitIntoChunks(mdBody) {
    const parts = mdBody.split(/^##\s+/m);
    const chunks = [];
    const pre = (parts[0] || '').trim();
    if (pre) chunks.push({ title: '概述', md: pre });
    for (let i = 1; i < parts.length; i++) {
        const nl = parts[i].indexOf('\n');
        const t = (nl >= 0 ? parts[i].slice(0, nl) : parts[i]).trim();
        const body = nl >= 0 ? parts[i].slice(nl + 1) : '';
        chunks.push({ title: t, md: body });
    }
    return chunks;
}

/**
 * 构建一篇页面（含 include 并行拉取 + marked 渲染），结果整页缓存。
 * 有 include 的页 → 多块（单工序视图）；没有 → 单块走老目录。
 */
async function buildPage(fullFolder, pageId) {
    const key = fullFolder + '/' + pageId;
    if (pageCache.has(key)) return pageCache.get(key);

    const filePath = `${DOC_ROOT}/${fullFolder}/${pageId}.md`;
    const mdText = await fetchText(filePath);
    if (!mdText) return null;

    const pageTitle = firstHeading(mdText) || pageId;
    const mdBody = mdText.replace(/^#\s+.+\n/, '');
    const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);

    let chunks;
    const incProbe = /<!--\s*include:\s*([^\s]+\.md)\s*-->/;
    if (incProbe.test(mdBody)) {
        chunks = splitIntoChunks(mdBody);
        // 收集全部 include，一次性并行拉取（旧的串行逐个 await 是进明细卡顿的主因）
        const incRe = /<!--\s*include:\s*([^\s]+\.md)\s*-->/g;
        const jobs = [];
        chunks.forEach((c, ci) => {
            incRe.lastIndex = 0;
            let m;
            while ((m = incRe.exec(c.md)) !== null) {
                jobs.push({ ci, token: m[0], file: m[1] });
            }
        });
        const texts = await Promise.all(jobs.map(j => fetchText(basePath + j.file)));
        jobs.forEach((j, k) => {
            const t = texts[k];
            chunks[j.ci].md = chunks[j.ci].md.replace(j.token, t != null ? t : `*（无法加载：${j.file}）*`);
        });
    } else {
        chunks = [{ title: pageTitle, md: mdBody }];
    }

    const page = {
        title: pageTitle,
        chunks: chunks.map(c => ({ title: c.title, html: wrapKeywordsInHtml(marked.parse(c.md)) })),
        hasIncludes: chunks.length > 1,
    };
    pageCache.set(key, page);
    return page;
}

/** 鼠标悬停预取：卡片/菜单 hover 时就在后台拉页面，点击时基本秒开 */
function prefetchPage(folder, pageId) {
    if (!pageId || pageId === 'home') return;
    const key = folder + '/' + pageId;
    if (pageCache.has(key) || prefetchInFlight.has(key)) return;
    prefetchInFlight.add(key);
    buildPage(folder, pageId).catch(() => {}).finally(() => prefetchInFlight.delete(key));
}

/** 把构建好的页面写进内容区 */
function renderPage(page, fullFolder, pageId) {
    const loader = document.getElementById('contentLoader');
    const filePath = `${DOC_ROOT}/${fullFolder}/${pageId}.md`;
    const folderDisplay = fullFolder.split('/')
        .map(p => p.replace(/^\d+\./, '').replace(/^\d+\s*/, '')).join(' > ');
    const chunkHtml = page.chunks.map((c, i) =>
        `<section class="doc-chunk${i === 0 ? ' active' : ''}" data-chunk="${i}">${c.html}</section>`
    ).join('');

    loader.innerHTML = `
        <div class="page-block active" id="page-${pageId}">
            <div class="breadcrumb">
                <a href="javascript:void(0)" onclick="switchToHome()">支援未来</a>
                > ${folderDisplay} > ${page.title}
            </div>
            <div class="page-header">
                <h1>${page.title}</h1>
                <a class="edit-btn" href="https://github.com/Monarchish/Monarchish.github.io/edit/main/${filePath}" target="_blank">编辑此页</a>
            </div>
            <div class="page-content markdown-body">
                ${chunkHtml}
            </div>
            <div class="footer-meta">最近更新：2026-09-23</div>
        </div>
    `;

    document.getElementById('contentArea').scrollTop = 0;
    window.scrollTo({ top: 0 });

    if (page.chunks.length > 1) {
        buildChunkTOC(page.chunks);
    } else {
        generateTOCFromContent();
    }
    bindSopSteps();
}

/** 单工序视图的「本页指引」：只列工序名 */
function buildChunkTOC(chunks) {
    const tocList = document.getElementById('tocList');
    const tocWrapper = document.getElementById('tocWrapper');
    if (!tocList) return;
    tocList.innerHTML = '';
    if (!chunks.length) { tocWrapper.classList.add('empty'); return; }
    tocWrapper.classList.remove('empty');

    chunks.forEach((c, i) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.textContent = c.title;
        a.dataset.chunk = i;
        if (i === 0) a.classList.add('active-toc');
        a.addEventListener('click', function (e) {
            e.preventDefault();
            showChunk(i);
        });
        li.appendChild(a);
        tocList.appendChild(li);
    });
}

/** 切换到第 i 个工序视图：只显示它，目录高亮它，回到页首 */
function showChunk(i) {
    document.querySelectorAll('.page-content .doc-chunk').forEach((el, k) => {
        el.classList.toggle('active', k === i);
    });
    document.querySelectorAll('#tocList a[data-chunk]').forEach(a => {
        a.classList.toggle('active-toc', Number(a.dataset.chunk) === i);
    });
    document.getElementById('contentArea').scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================================
// 卡片门户首页
// ---------------------------------------------------------
// 首页不进正文渲染，直接把索引摊成卡片。卡片上的字全部走
// escapeHtml，文档里有什么符号都不会破坏页面结构。
// =========================================================
async function loadPortal() {
    const loader = document.getElementById('contentLoader');
    const index = await buildIndex();

    const groupHtml = index.groupNames.map((g) => {
        const items = index.groups[g];
        const no = g.split('.')[0];
        const name = g.replace(/^\d+\./, '');
        const cards = items.map((it) => {
            const meta = [];
            if (it.steps) meta.push(`${it.steps} 个步骤`);
            if (it.missing) meta.push('待补充');
            const tag = it.missing ? '<span class="portal-card-tag">待补充</span>' : '';
            return (
                `<a class="portal-card" data-page="${escapeHtml(it.file)}" data-folder="${escapeHtml(it.folder)}" ` +
                `data-search="${escapeHtml((name + it.title + it.file).toLowerCase())}">` +
                `<span class="portal-card-title">${escapeHtml(it.title)}</span>` +
                `<span class="portal-card-meta">${escapeHtml(meta.join(' · '))}</span>` +
                tag +
                `</a>`
            );
        }).join('');
        return (
            `<section class="portal-group" data-group="${escapeHtml(g)}">` +
            `<div class="portal-group-head">` +
            `<span class="portal-group-no">${escapeHtml(no)}</span>` +
            `<h2 class="portal-group-name">${escapeHtml(name)}</h2>` +
            `<span class="portal-group-meta">${items.length} 个流程</span>` +
            `<span class="portal-group-line"></span>` +
            `</div>` +
            `<div class="portal-cards">${cards}</div>` +
            `</section>`
        );
    }).join('');

    const totalSteps = index.items.reduce((a, b) => a + b.steps, 0);

    loader.innerHTML =
        `<div class="portal">` +
        `<header class="portal-hero">` +
        `<h1 class="portal-hero-title">操作手册</h1>` +
        `<p class="portal-hero-meta">${index.items.length} 个流程 · ${totalSteps} 个步骤</p>` +
        `<div class="portal-search">` +
        `<input type="text" id="portalSearch" placeholder="搜索流程名称，例如「开票」「MDG」「转货权」" autocomplete="off" />` +
        `<span class="portal-search-count" id="portalSearchCount"></span>` +
        `</div>` +
        `</header>` +
        groupHtml +
        `<div class="portal-empty" id="portalEmpty">没有匹配的流程。换个词试试，或者清空搜索框。</div>` +
        `</div>`;

    bindPortal();
    window.scrollTo({ top: 0 });
}

function bindPortal() {
    const input = document.getElementById('portalSearch');
    const empty = document.getElementById('portalEmpty');
    const count = document.getElementById('portalSearchCount');
    if (!input) return;

    const cards = Array.from(document.querySelectorAll('.portal-card'));
    const groups = Array.from(document.querySelectorAll('.portal-group'));

    const apply = () => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        cards.forEach((c) => {
            const hit = !q || c.dataset.search.indexOf(q) >= 0;
            c.classList.toggle('is-hidden', !hit);
            if (hit) shown += 1;
        });
        groups.forEach((g) => {
            const any = Array.from(g.querySelectorAll('.portal-card'))
                .some((c) => !c.classList.contains('is-hidden'));
            g.classList.toggle('is-hidden', !any);
        });
        empty.classList.toggle('is-visible', shown === 0);
        count.textContent = q ? `${shown} / ${cards.length}` : '';
    };

    input.addEventListener('input', apply);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { input.value = ''; apply(); input.blur(); }
    });

    cards.forEach((c) => {
        c.addEventListener('click', () => {
            openPage(c.dataset.folder, c.dataset.page);
        });
        /* 悬停即预取：手指移过去到点下去的时间差，足够把页面拉好 */
        c.addEventListener('mouseenter', () => {
            prefetchPage(c.dataset.folder, c.dataset.page);
        });
    });
}

/** 打开某篇文档：把左侧导航对应分组展开，再进正文（导航与门户卡片共用） */
function openPage(folder, pageId) {
    if (!pageId) return;
    currentPageId = pageId;
    highlightSidebarItem(pageId);

    const side = document.querySelector(`.sidebar .sub-items a[data-page="${CSS.escape(pageId)}"]`);
    if (side) {
        const group = side.closest('.menu-group');
        const subs = group && group.querySelector('.sub-items');
        const arrow = group && group.querySelector('.group-title .arrow');
        if (subs && !subs.classList.contains('open')) {
            subs.classList.add('open');
            if (arrow) arrow.classList.add('open');
        }
    }

    loadContent(folder, pageId);
}

// =========================================================
// 侧边栏加载（含搜索框）
// =========================================================
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');

    let html = `
        <div class="search-wrapper">
            <input type="text" id="menuSearch" placeholder="搜索菜单..." />
            <div class="search-shortcut"></div>
        </div>
        <div class="sidebar-title">导航</div>
    `;

    const groups = {};
    for (const item of sidebarManifest) {
        const firstLevel = item.folder.split('/')[0];
        if (!groups[firstLevel]) groups[firstLevel] = [];
        groups[firstLevel].push(item);
    }

    /* 标题优先用并行索引（一次请求拿全部）；索引里没有的再单独取 */
    let titleMap = new Map();
    try {
        const index = await buildIndex();
        titleMap = new Map(index.items.map((it) => [it.file, it.title]));
    } catch (e) { /* 取不到就整条走下面 getTitleFromMd 兜底 */ }

    const sortedFirstLevel = Object.keys(groups).sort();

    for (const firstLevel of sortedFirstLevel) {
        const displayName = firstLevel.replace(/^\d+\./, '');
        html += `<div class="menu-group">`;
        html += `<div class="group-title" onclick="toggleMenu(this)">${displayName} <span class="arrow">▶</span></div>`;
        html += `<div class="sub-items">`;

        const items = groups[firstLevel];
        for (const item of items) {
            const title = titleMap.get(item.file) || await getTitleFromMd(item.folder, item.file);
            html += `<a data-page="${item.file}">${title}</a>`;
        }

        html += `</div></div>`;
    }

    sidebar.innerHTML = html;
    bindSidebarEvents();
    highlightSidebarItem(currentPageId);

    setupSearch();

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            /* 门户首页没有左侧菜单，Ctrl + K 要给到门户的搜索框 */
            const onHome = document.querySelector('.app').classList.contains('view-home');
            const searchInput = onHome
                ? document.getElementById('portalSearch')
                : document.getElementById('menuSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('menuSearch');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.blur();
            }
        }
    });
}

// =========================================================
// 侧边栏事件绑定
// =========================================================
function bindSidebarEvents() {
    document.querySelectorAll('.sidebar .menu-group .group-title').forEach(el => {
        el.removeEventListener('click', toggleMenu);
        el.addEventListener('click', toggleMenu);
    });
    document.querySelectorAll('.sidebar .sub-items a').forEach(link => {
        link.removeEventListener('click', handleMenuItemClick);
        link.addEventListener('click', handleMenuItemClick);
        /* 左侧菜单悬停也预取 */
        link.addEventListener('mouseenter', () => {
            const item = sidebarManifest.find(m => m.file === link.dataset.page);
            if (item) prefetchPage(item.folder, item.file);
        });
    });
}

function handleMenuItemClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const pageId = link.dataset.page;
    if (!pageId) return;

    currentPageId = pageId;
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');

    let fullFolder = '';
    for (const item of sidebarManifest) {
        if (item.file === pageId) {
            fullFolder = item.folder;
            break;
        }
    }

    loadContent(fullFolder, pageId);
}

function highlightSidebarItem(pageId) {
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === pageId);
    });
}

// =========================================================
// 内容加载（含进度条）
// =========================================================
async function loadContent(fullFolder, pageId) {
    const loader = document.getElementById('contentLoader');
    const loadingBar = document.getElementById('loading-bar');
    const app = document.querySelector('.app');

    /* 首页 = 卡片门户：左右两栏让位给卡片墙 */
    if (pageId === 'home') {
        currentPageId = 'home';
        app.classList.add('view-home');
        document.getElementById('tocList').innerHTML = '';
        loadingBar.classList.add('active');
        loadingBar.style.width = '40%';
        await loadPortal();
        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.width = '0%';
            loadingBar.classList.remove('active');
        }, 300);
        return;
    }
    app.classList.remove('view-home');

    loadingBar.classList.add('active');
    loadingBar.style.width = '40%';

    loader.classList.add('is-loading');   // 旧内容变淡，明确「在换了」

    let page = null;
    try {
        page = await buildPage(fullFolder, pageId);
    } catch (e) {
        console.error('内容加载失败:', e);
    } finally {
        loader.classList.remove('is-loading');
    }

    if (!page) {
        loader.innerHTML = `<p>页面加载失败，请刷新重试。</p>`;
        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.width = '0%';
            loadingBar.classList.remove('active');
        }, 300);
        return;
    }

    loadingBar.style.width = '80%';
    renderPage(page, fullFolder, pageId);

    loadingBar.style.width = '100%';
    setTimeout(() => {
        loadingBar.style.width = '0%';
        loadingBar.classList.remove('active');
    }, 300);
}

function switchToHome() {
    currentPageId = 'home';
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => a.classList.remove('active'));
    loadContent('', 'home');
}

// =========================================================
// SOP 步骤抽屉：同一时间只展开一个
// ---------------------------------------------------------
// 文档里用 <details class="sop-step"> 包住每个步骤。默认全部折叠，
// 只看到「步骤 N｜标题」；点开某一个时，其余自动收起，避免长文档
// 越堆越长。样式在 03、设置/2.站点样式.css 的 SOP 步骤抽屉段。
// =========================================================
function bindSopSteps() {
    const steps = document.querySelectorAll('.page-content details.sop-step');
    if (!steps.length) return;

    steps.forEach((el) => {
        el.addEventListener('toggle', () => {
            if (!el.open) return;
            steps.forEach((other) => {
                if (other !== el && other.open) other.open = false;
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.top-nav .logo');
    if (logo) {
        logo.addEventListener('click', function() {
            switchToHome();
        });
    }
});

async function init() {
    await loadSidebar();
    await loadContent('', 'home');
}

window.init = init;
