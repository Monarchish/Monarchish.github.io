// =========================================================
// 文件清单（硬编码）
// 格式：{ folder: "文件夹名", file: "文件名不含扩展名" }
// =========================================================
const sidebarManifest = [
    // 1、准入
    { folder: "1、准入", file: "1.1.准入总览" },
    { folder: "1、准入", file: "1.2.MDG总览" },
    // 2、采购
    { folder: "2、采购", file: "2.1.订货总览" },
    { folder: "2、采购", file: "2.2.宝钢期货（预）订货总览" },
    { folder: "2、采购", file: "2.3.宝钢期货订货总览" },
    { folder: "2、采购", file: "2.4.华菱现货订货总览" },
    { folder: "2、采购", file: "2.5.同步总览" },
    // 3、销售
    { folder: "3、销售", file: "3.1.让步单总览" },
    { folder: "3、销售", file: "3.2.插行总览" },
    { folder: "3、销售", file: "3.3.结案总览" },
    { folder: "3、销售", file: "3.4.自由款总览" },
    { folder: "3、销售", file: "3.5.电子提单总览" },
    { folder: "3、销售", file: "3.6.入库总览" },
    { folder: "3、销售", file: "3.7.转货权总览" },
    { folder: "3、销售", file: "3.8.质量异议总览" },
    { folder: "3、销售", file: "3.9.销售开票总览" },
    { folder: "3、销售", file: "3.10.采购发票总览" },
    // 4、财务
    { folder: "4、财务", file: "4.1.财务总览" },
    // 5、其他
    { folder: "5、其他", file: "5.1.其他总览" },
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

// =========================================================
// 工具函数：包裹关键词
// =========================================================
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

// =========================================================
// 从 .md 文件提取 # 标题
// =========================================================
async function getTitleFromMd(folder, pageId) {
    try {
        const filePath = `一、支援未来/${folder}/${pageId}.md`;
        const resp = await fetch(filePath);
        if (!resp.ok) return pageId;
        const mdText = await resp.text();
        const match = mdText.match(/^#\s+(.+)$/m);
        return match ? match[1] : pageId;
    } catch (e) {
        return pageId;
    }
}

// =========================================================
// 从页面内容自动生成 TOC
// =========================================================
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
                    const navHeight = 56;
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
                    const navHeight = 56;
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
// 侧边栏加载（自动生成）
// =========================================================
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');
    let html = '<div class="sidebar-title">📂 导航</div>';

    const groups = {};
    for (const item of sidebarManifest) {
        if (!groups[item.folder]) groups[item.folder] = [];
        groups[item.folder].push(item);
    }

    for (const [folder, items] of Object.entries(groups)) {
        const displayName = folder.replace(/^\d+、/, '');
        html += `<div class="menu-group">`;
        html += `<div class="group-title" onclick="toggleMenu(this)">${displayName} <span class="arrow">▶</span></div>`;
        html += `<div class="sub-items">`;

        for (const item of items) {
            const title = await getTitleFromMd(folder, item.file);
            html += `<a data-page="${item.file}">${title}</a>`;
        }

        html += `</div></div>`;
    }

    sidebar.innerHTML = html;
    bindSidebarEvents();
    highlightSidebarItem(currentPageId);
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

function toggleMenu(e) {
    const el = e.currentTarget;
    if (!el) return;
    const arrow = el.querySelector('.arrow');
    const subItems = el.nextElementSibling;
    if (subItems && subItems.classList.contains('sub-items')) {
        subItems.classList.toggle('open');
        if (arrow) arrow.classList.toggle('open');
    }
    e.stopPropagation();
}

function handleMenuItemClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const pageId = link.dataset.page;
    if (!pageId) return;

    currentPageId = pageId;
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');

    let tab = 'home';
    if (pageId.startsWith('1.')) tab = '准入';
    else if (pageId.startsWith('2.')) tab = '采购';
    else if (pageId.startsWith('3.')) tab = '销售';
    else if (pageId.startsWith('4.')) tab = '财务';
    else if (pageId.startsWith('5.')) tab = '其他';

    loadContent(tab, pageId);
}

function highlightSidebarItem(pageId) {
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => {
        a.classList.toggle('active', a.dataset.page === pageId);
    });
}

// =========================================================
// 内容加载
// =========================================================
async function loadContent(tab, pageId) {
    const loader = document.getElementById('contentLoader');

    let folder = '';
    if (pageId.startsWith('1.')) folder = '1、准入';
    else if (pageId.startsWith('2.')) folder = '2、采购';
    else if (pageId.startsWith('3.')) folder = '3、销售';
    else if (pageId.startsWith('4.')) folder = '4、财务';
    else if (pageId.startsWith('5.')) folder = '5、其他';
    else {
        pageId = 'home';
    }

    let filePath;
    if (pageId === 'home') {
        filePath = '一、支援未来/home.md';
    } else {
        filePath = `一、支援未来/${folder}/${pageId}.md`;
    }

    try {
        const resp = await fetch(filePath);
        if (!resp.ok) {
            loader.innerHTML = `<p>页面加载失败，请刷新重试。</p>`;
            return;
        }
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

        const mdTextWithoutTitle = mdText.replace(/^#\s+.+\n/, '');
        let htmlContent = marked.parse(mdTextWithoutTitle);
        htmlContent = wrapKeywordsInHtml(htmlContent);

        const titleMatch = mdText.match(/^#\s+(.+)$/m);
        const pageTitle = titleMatch ? titleMatch[1] : '页面';

        loader.innerHTML = `
            <div class="page-block active" id="page-${pageId}">
                <div class="breadcrumb">
                    <a href="javascript:void(0)" onclick="switchToHome()">支援未来</a>
                    ${getBreadcrumb(folder, pageId, pageTitle)}
                </div>
                <div class="page-header">
                    <h1>${pageTitle}</h1>
                    <a class="edit-btn" href="https://github.com/Monarchish/Monarchish.github.io/edit/main/${filePath}" target="_blank">编辑此页</a>
                </div>
                <div class="page-content markdown-body">
                    ${htmlContent}
                </div>
                <div class="footer-meta">最近更新：2026-08-21</div>
            </div>
        `;

        document.getElementById('contentArea').scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(generateTOCFromContent, 100);

    } catch (e) {
        console.error('内容加载失败:', e);
        loader.innerHTML = `<p>内容加载失败，请刷新重试。</p>`;
    }
}

function getBreadcrumb(folder, pageId, pageTitle) {
    if (pageId === 'home') return ' > 首页';
    const folderDisplay = folder.replace(/^\d+、/, '');
    return ` > ${folderDisplay} > ${pageTitle}`;
}

function switchToHome() {
    currentPageId = 'home';
    document.querySelectorAll('.sidebar .sub-items a').forEach(a => a.classList.remove('active'));
    loadContent('home', 'home');
}

// =========================================================
// 点击顶部 logo 返回首页
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    const logo = document.querySelector('.top-nav .logo');
    if (logo) {
        logo.addEventListener('click', function() {
            switchToHome();
        });
    }
});

// =========================================================
// 初始化
// =========================================================
async function init() {
    await loadSidebar();
    await loadContent('home', 'home');
}

// 暴露 init 给 HTML 调用
window.init = init;
