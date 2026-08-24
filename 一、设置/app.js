// =========================================================
// 文件清单
// =========================================================
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
    'Ctrl + ;', 'Enter', 'Esc', 'Alt + 2', 'Alt + 5',
    'Or', 'And'
];

let currentPageId = 'home';

function wrapKeywordsInHtml(html) {
    let result = html;
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    for (const kw of sorted) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(?![^<]*>)' + escaped + '(?![^<]*>)', 'g');
        result = result.replace(regex, `<span class="action-keyword">${kw}</span>`);
    }
    return result;
}

async function getTitleFromMd(folder, pageId) {
    try {
        const filePath = `二、支援未来/${folder}/${pageId}.md`;
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
// 手风琴菜单：同一时间只展开一个
// =========================================================
function toggleMenu(e) {
    const el = e.currentTarget;
    if (!el) return;

    const arrow = el.querySelector('.arrow');
    const subItems = el.nextElementSibling;
    if (!subItems || !subItems.classList.contains('sub-items')) return;

    const isCurrentlyOpen = subItems.classList.contains('open');

    // 关闭同一层级内的所有其他菜单
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
// 搜索过滤功能
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
// 侧边栏加载（带搜索框）
// =========================================================
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');

    // 搜索框
    let html = `
        <div class="search-wrapper">
            <input type="text" id="menuSearch" placeholder="搜索菜单..." />
            <div class="search-shortcut">Ctrl + K</div>
        </div>
        <div class="sidebar-title">导航</div>
    `;

    const groups = {};
    for (const item of sidebarManifest) {
        const firstLevel = item.folder.split('/')[0];
        if (!groups[firstLevel]) groups[firstLevel] = [];
        groups[firstLevel].push(item);
    }

    const sortedFirstLevel = Object.keys(groups).sort();

    for (const firstLevel of sortedFirstLevel) {
        const displayName = firstLevel.replace(/^\d+\./, '');
        html += `<div class="menu-group">`;
        html += `<div class="group-title" onclick="toggleMenu(this)">${displayName} <span class="arrow">▶</span></div>`;
        html += `<div class="sub-items">`;

        const items = groups[firstLevel];
        for (const item of items) {
            const title = await getTitleFromMd(item.folder, item.file);
            html += `<a data-page="${item.file}">${title}</a>`;
        }

        html += `</div></div>`;
    }

    sidebar.innerHTML = html;
    bindSidebarEvents();
    highlightSidebarItem(currentPageId);

    // 启用搜索
    setupSearch();

    // Ctrl+K 聚焦搜索框
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('menuSearch');
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

    loadingBar.classList.add('active');
    loadingBar.style.width = '20%';

    let filePath;
    if (pageId === 'home') {
        filePath = '二、支援未来/home.md';
    } else {
        filePath = `二、支援未来/${fullFolder}/${pageId}.md`;
    }

    try {
        const resp = await fetch(filePath);
        if (!resp.ok) {
            loader.innerHTML = `<p>页面加载失败，请刷新重试。</p>`;
            loadingBar.style.width = '100%';
            setTimeout(() => {
                loadingBar.style.width = '0%';
                loadingBar.classList.remove('active');
            }, 300);
            return;
        }

        loadingBar.style.width = '50%';

        let mdText = await resp.text();

        const includeRegex = /<!--\s*include:\s*([^\s]+\.md)\s*-->/g;
        let match;
        while ((match = includeRegex.exec(mdText)) !== null) {
            const includeFile = match[1];
            const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
            const includePath = basePath + includeFile;
            try {
                const includeResp = await fetch(includePath);
                if (includeResp.ok) {
                    const includeContent = await includeResp.text();
                    mdText = mdText.replace(match[0], includeContent);
                } else {
                    mdText = mdText.replace(match[0], `*（无法加载：${includeFile}）*`);
                }
            } catch (e) {
                mdText = mdText.replace(match[0], `*（加载失败：${includeFile}）*`);
            }
        }

        loadingBar.style.width = '75%';

        const mdTextWithoutTitle = mdText.replace(/^#\s+.+\n/, '');
        let htmlContent = marked.parse(mdTextWithoutTitle);
        htmlContent = wrapKeywordsInHtml(htmlContent);

        const titleMatch = mdText.match(/^#\s+(.+)$/m);
        const pageTitle = titleMatch ? titleMatch[1] : '页面';

        let breadcrumb = '';
        if (pageId === 'home') {
            breadcrumb = ' > 首页';
        } else {
            const parts = fullFolder.split('/');
            const folderDisplay = parts.map(p => p.replace(/^\d+\./, '')).join(' > ');
            breadcrumb = ` > ${folderDisplay} > ${pageTitle}`;
        }

        loader.innerHTML = `
            <div class="page-block active" id="page-${pageId}">
                <div class="breadcrumb">
                    <a href="javascript:void(0)" onclick="switchToHome()">支援未来</a>
                    ${breadcrumb}
                </div>
                <div class="page-header">
                    <h1>${pageTitle}</h1>
                    <a class="edit-btn" href="https://github.com/Monarchish/Monarchish.github.io/edit/main/${filePath}" target="_blank">编辑此页</a>
                </div>
                <div class="page-content markdown-body">
                    ${htmlContent}
                </div>
                <div class="footer-meta">最近更新：2026-08-24</div>
            </div>
        `;

        document.getElementById('contentArea').scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.width = '0%';
            loadingBar.classList.remove('active');
        }, 300);

        setTimeout(generateTOCFromContent, 100);

    } catch (e) {
        console.error('内容加载失败:', e);
        loader.innerHTML = `<p>内容加载失败，请刷新重试。</p>`;
        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.width = '0%';
            loadingBar.classList.remove('active');
        }, 300);
    }
}

function switchToHome() {
    currentPageId = 'home';
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => a.classList.remove('active'));
    loadContent('', 'home');
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

window.init = init;// =========================================================
// 文件清单
// =========================================================
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
    'Ctrl + ;', 'Enter', 'Esc', 'Alt + 2', 'Alt + 5',
    'Or', 'And'
];

let currentPageId = 'home';

function wrapKeywordsInHtml(html) {
    let result = html;
    const sorted = [...keywords].sort((a, b) => b.length - a.length);
    for (const kw of sorted) {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(?![^<]*>)' + escaped + '(?![^<]*>)', 'g');
        result = result.replace(regex, `<span class="action-keyword">${kw}</span>`);
    }
    return result;
}

async function getTitleFromMd(folder, pageId) {
    try {
        const filePath = `二、支援未来/${folder}/${pageId}.md`;
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
// 手风琴菜单：同一时间只展开一个
// =========================================================
function toggleMenu(e) {
    const el = e.currentTarget;
    if (!el) return;

    const arrow = el.querySelector('.arrow');
    const subItems = el.nextElementSibling;
    if (!subItems || !subItems.classList.contains('sub-items')) return;

    const isCurrentlyOpen = subItems.classList.contains('open');

    // 关闭同一层级内的所有其他菜单
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
// 搜索过滤功能
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
// 侧边栏加载（带搜索框）
// =========================================================
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');

    // 搜索框
    let html = `
        <div class="search-wrapper">
            <input type="text" id="menuSearch" placeholder="搜索菜单..." />
            <div class="search-shortcut">Ctrl + K</div>
        </div>
        <div class="sidebar-title">导航</div>
    `;

    const groups = {};
    for (const item of sidebarManifest) {
        const firstLevel = item.folder.split('/')[0];
        if (!groups[firstLevel]) groups[firstLevel] = [];
        groups[firstLevel].push(item);
    }

    const sortedFirstLevel = Object.keys(groups).sort();

    for (const firstLevel of sortedFirstLevel) {
        const displayName = firstLevel.replace(/^\d+\./, '');
        html += `<div class="menu-group">`;
        html += `<div class="group-title" onclick="toggleMenu(this)">${displayName} <span class="arrow">▶</span></div>`;
        html += `<div class="sub-items">`;

        const items = groups[firstLevel];
        for (const item of items) {
            const title = await getTitleFromMd(item.folder, item.file);
            html += `<a data-page="${item.file}">${title}</a>`;
        }

        html += `</div></div>`;
    }

    sidebar.innerHTML = html;
    bindSidebarEvents();
    highlightSidebarItem(currentPageId);

    // 启用搜索
    setupSearch();

    // Ctrl+K 聚焦搜索框
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('menuSearch');
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

    loadingBar.classList.add('active');
    loadingBar.style.width = '20%';

    let filePath;
    if (pageId === 'home') {
        filePath = '二、支援未来/home.md';
    } else {
        filePath = `二、支援未来/${fullFolder}/${pageId}.md`;
    }

    try {
        const resp = await fetch(filePath);
        if (!resp.ok) {
            loader.innerHTML = `<p>页面加载失败，请刷新重试。</p>`;
            loadingBar.style.width = '100%';
            setTimeout(() => {
                loadingBar.style.width = '0%';
                loadingBar.classList.remove('active');
            }, 300);
            return;
        }

        loadingBar.style.width = '50%';

        let mdText = await resp.text();

        const includeRegex = /<!--\s*include:\s*([^\s]+\.md)\s*-->/g;
        let match;
        while ((match = includeRegex.exec(mdText)) !== null) {
            const includeFile = match[1];
            const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
            const includePath = basePath + includeFile;
            try {
                const includeResp = await fetch(includePath);
                if (includeResp.ok) {
                    const includeContent = await includeResp.text();
                    mdText = mdText.replace(match[0], includeContent);
                } else {
                    mdText = mdText.replace(match[0], `*（无法加载：${includeFile}）*`);
                }
            } catch (e) {
                mdText = mdText.replace(match[0], `*（加载失败：${includeFile}）*`);
            }
        }

        loadingBar.style.width = '75%';

        const mdTextWithoutTitle = mdText.replace(/^#\s+.+\n/, '');
        let htmlContent = marked.parse(mdTextWithoutTitle);
        htmlContent = wrapKeywordsInHtml(htmlContent);

        const titleMatch = mdText.match(/^#\s+(.+)$/m);
        const pageTitle = titleMatch ? titleMatch[1] : '页面';

        let breadcrumb = '';
        if (pageId === 'home') {
            breadcrumb = ' > 首页';
        } else {
            const parts = fullFolder.split('/');
            const folderDisplay = parts.map(p => p.replace(/^\d+\./, '')).join(' > ');
            breadcrumb = ` > ${folderDisplay} > ${pageTitle}`;
        }

        loader.innerHTML = `
            <div class="page-block active" id="page-${pageId}">
                <div class="breadcrumb">
                    <a href="javascript:void(0)" onclick="switchToHome()">支援未来</a>
                    ${breadcrumb}
                </div>
                <div class="page-header">
                    <h1>${pageTitle}</h1>
                    <a class="edit-btn" href="https://github.com/Monarchish/Monarchish.github.io/edit/main/${filePath}" target="_blank">编辑此页</a>
                </div>
                <div class="page-content markdown-body">
                    ${htmlContent}
                </div>
                <div class="footer-meta">最近更新：2026-08-24</div>
            </div>
        `;

        document.getElementById('contentArea').scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.width = '0%';
            loadingBar.classList.remove('active');
        }, 300);

        setTimeout(generateTOCFromContent, 100);

    } catch (e) {
        console.error('内容加载失败:', e);
        loader.innerHTML = `<p>内容加载失败，请刷新重试。</p>`;
        loadingBar.style.width = '100%';
        setTimeout(() => {
            loadingBar.style.width = '0%';
            loadingBar.classList.remove('active');
        }, 300);
    }
}

function switchToHome() {
    currentPageId = 'home';
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => a.classList.remove('active'));
    loadContent('', 'home');
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
