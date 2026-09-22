/* ============================================================
   03、设置 · 1.站点主程序.js
   ------------------------------------------------------------
   这是什么：主页（支援未来文档站）的功能代码，和开屏动画无关。
   它做的事：四件事 ——
     ① 生成索引式首页：29 个流程按业务分组的编号索引表，
        带搜索过滤（只读取文档本身，没有额外文案要维护）；
     ② 把 SOP 正文的"动作行"（Open / Write / Left Click / Ctrl + D …）
        解析成带编号的条款，取值、分支、说明各自成块；
     ③ 右侧「本页指引」目录、左侧导航、菜单搜索（Ctrl + K）；
     ④ 每页底部的「附　键盘动作速查」（非标准步骤，只作加速提示）。
   谁在用它：站点根目录 index.html 引入后调用 init()。
   要不要改：────────────────────────────────────────────
     · 新增 / 删除流程   → 只改下面的 sidebarManifest 清单
     · 新增指令词        → 只改下面的 INSTRUCTION_VOCAB 表
   动作行语法以 01、支援未来/05.其他/05.01.OTL操作手册编写规范/05.01.02.纲要.md
   为准：指令词 + "双引号对象" 用 - 连接层级；【方括号】是待填变量；
   （圆括号）是这一步的取值 / 选项 / 说明；Or 连接固定选项。
   解析不了的行一律按普通 Markdown 显示，不会因为写错格式而崩。
   ============================================================ */

/* ============================================================
   一、指令词表
   ------------------------------------------------------------
   左侧 verb 是文档里写的英文指令（必须与文档完全一致，
   含空格），右侧 label 是给同事看的中文动作名。
   key: true 表示这是"键盘动作"，会在页面底部汇总成速查表。
   加新指令：照格式加一行即可，注意 Ctrl + Alt + A 这种
   长组合要排在 Ctrl + A 前面（下面的排序会自动处理）。
   ============================================================ */
const INSTRUCTION_VOCAB = [
    { verb: 'Open',           label: '打开',      kind: 'open'   },
    { verb: 'Write',          label: '输入',      kind: 'write'  },
    { verb: 'Left Click',     label: '单击',      kind: 'click'  },
    { verb: 'Right Click',    label: '右键',      kind: 'click'  },
    { verb: 'Double Click',   label: '双击',      kind: 'click'  },
    { verb: 'Filter',         label: '筛选',      kind: 'filter' },
    { verb: 'Ctrl + Alt + A', label: '截图',      kind: 'key', key: true },
    { verb: 'Ctrl + Alt + P', label: '打印',      kind: 'key', key: true },
    { verb: 'Ctrl + C',       label: '复制',      kind: 'key', key: true },
    { verb: 'Ctrl + V',       label: '粘贴',      kind: 'key', key: true },
    { verb: 'Ctrl + X',       label: '剪切',      kind: 'key', key: true },
    { verb: 'Ctrl + D',       label: '向下填充',  kind: 'key', key: true },
    { verb: 'Ctrl + F',       label: '查找',      kind: 'key', key: true },
    { verb: 'Ctrl + S',       label: '保存',      kind: 'key', key: true },
    { verb: 'Ctrl + N',       label: '新建',      kind: 'key', key: true },
    { verb: 'Ctrl + ;',       label: '插入日期',  kind: 'key', key: true },
    { verb: 'Enter',          label: '回车确认',  kind: 'key', key: true },
    { verb: 'Esc',            label: '退出当前状态', kind: 'key', key: true },
];

/* 文档里出现的其它按键组合（Alt + 2 之类）走这条兜底规则 */
const GENERIC_KEY_RE = /^((?:Ctrl|Alt|Shift)(?:\s*\+\s*[^\s"+，。]+)+)/;
const VOCAB_SORTED = [...INSTRUCTION_VOCAB].sort((a, b) => b.verb.length - a.verb.length);

/* ============================================================
   二、文件清单
   ------------------------------------------------------------
   每个流程只登记它的「首页」（xx.xx.00.xx.md），子步骤由
   首页里的 <!-- include: --> 自动聚合，不用在这里列。
   索引表里的「待补充」标记 = 首页里一个 include 都没有。
   想给索引表加更新日期，照这样写：{ ..., updated: "2026-08-24" }
   ============================================================ */
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

const DOC_ROOT = '01、支援未来';
const INDEX_CACHE_KEY = 'support-future-index-v1';

/* ============================================================
   三、运行时状态
   ============================================================ */
const state = {
    index: null,          // 见 buildIndex()
    currentPageId: 'home',
    currentFolder: '',
};

/* ============================================================
   四、小工具
   ============================================================ */
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** 只标出 【待填变量】，别的符号一个都不碰（用于已经渲染成 HTML 的段落） */
function highlightVars(text) {
    return text.replace(/【([^】]+)】/g, '<span class="sop-var">【$1】</span>');
}

/**
 * 把 【待填变量】 和 Ctrl + X 这类按键标出来。
 * ⚠ 只能喂"已经转义过的纯文本"，不要喂含 HTML 标签的内容，
 *   否则正则会把 `cd<span>` 里的字样当成按键去套 kbd 标签。
 */
function highlightInline(escapedText) {
    return highlightVars(escapedText).replace(
        /(?:Ctrl|Alt|Shift)(?:\s*\+\s*[^\s<&"+，。]+)+/g,
        '<kbd class="sop-kbd">$&</kbd>'
    );
}

/** 取回一个文件；失败返回 null，不抛异常 */
async function fetchText(path) {
    try {
        const resp = await fetch(path);
        if (!resp.ok) return null;
        return await resp.text();
    } catch (e) {
        return null;
    }
}

/** 去掉标题行（页面标题另有地方显示），只用于辅助文本 */
function firstHeading(mdText) {
    const m = /^#\s+(.+)$/m.exec(mdText || '');
    return m ? m[1].trim() : '';
}

/* ============================================================
   五、索引：并行预取 29 篇流程首页
   ------------------------------------------------------------
   一次拿到「标题 / 步骤数 / 问答数」，门户卡片和左侧导航共用。
   结果按会话缓存在 sessionStorage，翻页不再重复请求。
   步骤数 = 首页里 ## FAQ 之前的 include 个数。
   ============================================================ */
async function buildIndex() {
    if (state.index) return state.index;
    if (!_indexPromise) _indexPromise = _buildIndexOnce();
    state.index = await _indexPromise;
    return state.index;
}

let _indexPromise = null;

async function _buildIndexOnce() {
    try {
        const cached = sessionStorage.getItem(INDEX_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) { /* sessionStorage 不可用就忽略 */ }

    const items = await Promise.all(sidebarManifest.map(async (item) => {
        const path = `${DOC_ROOT}/${item.folder}/${item.file}.md`;
        const text = await fetchText(path);
        const incRe = /<!--\s*include:\s*([^\s]+\.md)\s*-->/g;
        const faqAt = text ? text.indexOf('## FAQ') : -1;
        const head = text ? (faqAt >= 0 ? text.slice(0, faqAt) : text) : '';
        const steps = text ? (head.match(incRe) || []).length : 0;
        const all = text ? (text.match(incRe) || []).length : 0;
        return {
            folder: item.folder,
            file: item.file,
            path,
            group: item.folder.split('/')[0],
            title: firstHeading(text) || item.file.replace(/^\d+\.\d+\.00\./, ''),
            steps,
            faqs: all - steps,
            updated: item.updated || '',
            missing: !text || all === 0,
        };
    }));

    const groups = {};
    items.forEach((it) => {
        if (!groups[it.group]) groups[it.group] = [];
        groups[it.group].push(it);
    });

    const index = {
        items,
        groups,
        groupNames: Object.keys(groups).sort(),
        totalSteps: items.reduce((a, b) => a + b.steps, 0),
        totalFaqs: items.reduce((a, b) => a + b.faqs, 0),
    };

    try { sessionStorage.setItem(INDEX_CACHE_KEY, JSON.stringify(index)); } catch (e) { }
    return index;
}

/* ============================================================
   六、动作行解析
   ------------------------------------------------------------
   把 SOP 正文切成块。认不出来的行一律按普通 Markdown 处理，
   所以文档格式写错也不会白屏，最多是"没被美化"。
   ============================================================ */

/** 判断一行开头是不是指令词；是则返回 { verb, label, kind, key } 与剩余部分 */
function matchInstruction(line) {
    for (const ins of VOCAB_SORTED) {
        if (!line.startsWith(ins.verb)) continue;
        const rest = line.slice(ins.verb.length);
        /* 指令词后面必须紧跟空白、引号、括号或顿逗号，避免 Open 命中 Opens */
        if (rest === '' || /^[\s"'（(，、]/.test(rest)) {
            return { ins, rest: rest.trim() };
        }
    }
    const m = GENERIC_KEY_RE.exec(line);
    if (m) {
        const rest = line.slice(m[1].length);
        if (rest === '' || /^[\s"'（(，、]/.test(rest)) {
            return {
                ins: { verb: m[1], label: '按键', kind: 'key', key: true },
                rest: rest.trim(),
            };
        }
    }
    return null;
}

/** 从剩余部分里取出所有 "双引号对象"，以及引号之外的残留文字 */
function parseObjects(rest) {
    const objs = [];
    const re = /"([^"]*)"/g;
    let m;
    let last = 0;
    let tail = '';
    while ((m = re.exec(rest)) !== null) {
        if (m.index > last) tail += rest.slice(last, m.index);
        objs.push(m[1]);
        last = re.lastIndex;
    }
    if (last < rest.length) tail += rest.slice(last);
    /* 短横是层级连接符，逗号/顿号是并列分隔符，都只是分隔作用 */
    tail = tail.replace(/[\s\-—，、,]+/g, ' ').trim();
    return { objs, tail };
}

/** 解析 （xxx） 这一行：待填变量 / 固定选项 / 普通说明 */
function parseParamLine(text) {
    const inner = text.replace(/^[（(]/, '').replace(/[）)]\s*$/, '').trim();
    if (!inner) return null;
    if (/【[^】]+】/.test(inner)) return { kind: 'input', text: inner };
    if (/\sOr\s/i.test(inner)) {
        return {
            kind: 'choice',
            text: inner,
            options: inner.split(/\s+Or\s+/i).map((s) => s.trim()).filter(Boolean),
        };
    }
    return { kind: 'note', text: inner };
}

/** 代码行的特征（宏程序那几页会整段命中） */
const CODE_LINE_RE = /^\s{2,}|^(Sub|End Sub|Dim|Set|If|Else|End If|ElseIf|End With|For |Next |With |Exit |ReDim|On Error|MsgBox|Select |Case |Application\.|\.[A-Za-z])/;

/** 是不是代码块：连续 4 行以上，且七成以上像代码 */
function looksLikeCode(lines) {
    if (lines.length < 4) return false;
    const hit = lines.filter((l) => CODE_LINE_RE.test(l)).length;
    return hit / lines.length >= 0.7;
}

/** 宽松一点的代码判据，用于"整页是不是代码文档"这种整体判断 */
const LOOSE_CODE_RE = /\s=\s|^\s{2,}|^(Sub|End |Dim|Set|If|Else|For |Next |With |Exit |ReDim|On Error|MsgBox|Select |Case |Application\.|\.[A-Za-z])|^[A-Za-z_]\w*\.[A-Za-z_]|_\s*$|^"/;

/**
 * 整页是不是一段代码（如 05.07 那篇 VBA 宏程序）。
 * 实测：宏程序页命中率 98.6%，所有说明性文档都是 0%，区分度极高。
 * 命中就把整页合成一个代码框，而不是被空行切成十几个。
 */
function looksLikeCodeDocument(lines) {
    const ne = lines.filter((l) => l.trim());
    if (ne.length < 12) return false;
    const hit = ne.filter((l) => LOOSE_CODE_RE.test(l)).length;
    return hit / ne.length >= 0.6;
}

/**
 * 主解析器：Markdown 文本 → 块数组
 * 块类型：heading / step / note / checkpoint / switch / dict / text / code / markup
 */
function parseSopBlocks(mdText) {
    const lines = (mdText || '').split(/\r?\n/);
    const blocks = [];
    let plain = [];       // 攒普通行，最后交给 marked
    let stepNo = 0;

    const flushPlain = () => {
        if (!plain.length) return;
        const trimmed = plain;
        plain = [];
        blocks.push({ type: 'markup', lines: trimmed });
        return trimmed;
    };

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trim();

        if (!line) { if (plain.length) plain.push(''); continue; }

        /* ---- 标题 ---- */
        if (/^#{1,6}\s/.test(line)) {
            flushPlain();
            const level = line.match(/^#+/)[0].length;
            const text = line.replace(/^#+\s*/, '').trim();
            if (level === 1) continue;              // 一级标题由页头显示，正文里不重复
            if (level <= 3) stepNo = 0;             // 每个小节重新编号
            blocks.push({ type: 'heading', level: Math.min(level, 3), text });
            continue;
        }

        /* ---- include 没加载出来 ---- */
        if (/^[（(](无法加载|加载失败)/.test(line)) {
            flushPlain();
            blocks.push({ type: 'note', text: line.replace(/^[（(]|[）)]$/g, '') });
            continue;
        }

        /* ---- 切换软件/窗口 ---- */
        if (line === '---' || line === '***') {
            flushPlain();
            blocks.push({ type: 'switch' });
            continue;
        }

        /* ---- 检查点 / 决策点 ---- */
        if (line.startsWith('⚠')) {
            flushPlain();
            blocks.push({ type: 'checkpoint', text: line.replace(/^⚠\s*/, '') });
            continue;
        }

        /* ---- 指令词表条目：Open：打开某个软件 ---- */
        const dict = /^([A-Za-z][A-Za-z ]*(?:\s*\+\s*[^\s：:]+)*)\s*[：:]\s*(.+)$/.exec(line);
        if (dict) {
            const guess = matchInstruction(dict[1]);
            if (guess) {
                flushPlain();
                blocks.push({
                    type: 'dict',
                    verb: dict[1].trim(),
                    label: guess.ins.label,
                    desc: dict[2].trim(),
                });
                continue;
            }
        }

        /* ---- 取值 / 选项 / 说明行 ---- */
        if (/^[（(].*[）)]$/.test(line)) {
            const param = parseParamLine(line);
            if (param) {
                const prev = blocks[blocks.length - 1];
                const prevIsParam = prev && (prev.type === 'note' && prev.fromParam);
                /* 紧跟指令行、且只有一行圆括号 → 挂到那一步当参数 */
                if (prev && prev.type === 'step' && !prev.param && !prevIsParam && !plain.length) {
                    prev.param = param;
                } else {
                    flushPlain();
                    blocks.push({ type: 'note', text: param.text, fromParam: true, kind: param.kind });
                }
                continue;
            }
        }

        /* ---- 指令行 ---- */
        const cmd = matchInstruction(line);
        if (cmd) {
            flushPlain();
            stepNo += 1;
            const parsedObjects = parseObjects(cmd.rest);
            blocks.push({
                type: 'step',
                no: stepNo,
                verb: cmd.ins.verb,
                label: cmd.ins.label,
                kind: cmd.ins.kind,
                isKey: !!cmd.ins.key,
                objects: parsedObjects.objs,
                /* 引号外面还有字（如 Enter，↓，←（循环））就当成这一步的说明，不能丢 */
                param: parsedObjects.tail
                    ? { kind: 'note', text: parsedObjects.tail }
                    : null,
            });
            continue;
        }

        /* ---- 其余攒成普通段落 ---- */
        plain.push(raw);
    }
    flushPlain();

    /* 普通段落里，连续的代码行合并成代码块；整页是代码的文档直接全并成一块 */
    const wholePageIsCode = looksLikeCodeDocument(lines);
    const merged = [];
    blocks.forEach((b) => {
        if (b.type !== 'markup') { merged.push(b); return; }
        let buf = [];
        const flushBuf = () => {
            if (!buf.length) return;
            merged.push((wholePageIsCode || looksLikeCode(buf))
                ? { type: 'code', text: buf.join('\n') }
                : { type: 'markup', lines: buf.slice() });
            buf = [];
        };
        b.lines.forEach((l) => {
            if (l.trim()) buf.push(l);
            else flushBuf();
        });
        flushBuf();
    });

    /* 被空行切开的代码要合回一整块，否则一页上百个代码框 */
    const coalesced = [];
    merged.forEach((b) => {
        const prev = coalesced[coalesced.length - 1];
        if (b.type === 'code' && prev && prev.type === 'code') {
            prev.text += '\n' + b.text;
        } else {
            coalesced.push(b);
        }
    });

    /* 全局统计键盘动作，供底部速查表用 */
    const keyStats = new Map();
    coalesced.forEach((b) => {
        if (b.type !== 'step' || !b.isKey) return;
        const cur = keyStats.get(b.verb) || { verb: b.verb, label: b.label, count: 0 };
        cur.count += 1;
        keyStats.set(b.verb, cur);
    });

    return { blocks: coalesced, keyStats: [...keyStats.values()] };
}

/** 块数组 → HTML */
function renderSopBlocks(parsed) {
    const html = [];

    parsed.blocks.forEach((b) => {
        switch (b.type) {
            case 'heading': {
                const id = 'h-' + Math.random().toString(36).slice(2, 8);
                b.id = id;
                html.push(`<h${b.level} id="${id}">${escapeHtml(b.text)}</h${b.level}>`);
                break;
            }

            case 'step': {
                /* 只写动作名，不做彩色标签：手册里不需要用颜色区分"单击"和"输入" */
                const tag = `<span class="sop-act" data-kind="${b.kind}">${escapeHtml(b.label)}</span>`;
                const path = b.objects.length
                    ? `<span class="sop-path">${b.objects.map((o) => highlightInline(escapeHtml(o))).join('<i class="sop-sep">›</i>')}</span>`
                    : '';
                const kbd = b.isKey ? `<kbd class="sop-kbd">${escapeHtml(b.verb)}</kbd>` : '';
                /* 短参数挤在同一行右侧；长参数（公式、整句话）另起一行，免得把行撑坏 */
                let paramInline = '';
                let paramBlock = '';
                if (b.param) {
                    if (b.param.kind === 'note' && b.param.text.length > 30) {
                        paramBlock = `<div class="sop-step-sub">${renderParam(b.param)}</div>`;
                    } else {
                        paramInline = renderParam(b.param);
                    }
                }
                html.push(
                    `<div class="sop-step${b.isKey ? ' sop-step--key' : ''}">` +
                    `<div class="sop-step-main">` +
                    `<span class="sop-no">${String(b.no).padStart(2, '0')}</span>` +
                    tag + path +
                    `<span class="sop-right">${paramInline}${kbd}</span>` +
                    `</div>${paramBlock}</div>`
                );
                break;
            }

            case 'note':
                html.push(`<p class="sop-note sop-note--${b.kind || 'plain'}">${highlightInline(escapeHtml(b.text))}</p>`);
                break;

            case 'checkpoint':
                html.push(`<div class="sop-checkpoint"><span class="sop-checkpoint-mark">⚠</span>${highlightInline(escapeHtml(b.text))}</div>`);
                break;

            case 'switch':
                html.push('<div class="sop-switch"><span>切换软件 / 窗口</span></div>');
                break;

            case 'dict':
                html.push(
                    `<div class="sop-dict"><code class="sop-dict-verb">${escapeHtml(b.verb)}</code>` +
                    `<span class="sop-dict-label">${escapeHtml(b.label)}</span>` +
                    `<span class="sop-dict-desc">${highlightInline(escapeHtml(b.desc))}</span></div>`
                );
                break;

            case 'code':
                html.push(`<pre class="sop-code"><code>${escapeHtml(b.text)}</code></pre>`);
                break;

            default:
                html.push(`<div class="sop-prose">${highlightVars(marked.parse(b.lines.join('\n')))}</div>`);
        }
    });

    /* 底部：附 · 键盘动作速查（非标准步骤） */
    if (parsed.keyStats.length) {
        const rows = parsed.keyStats
            .sort((a, b) => b.count - a.count)
            .map((k) => `<li><kbd class="sop-kbd">${escapeHtml(k.verb)}</kbd><span>${escapeHtml(k.label)}</span><em>${k.count} 处</em></li>`)
            .join('');
        html.push(
            `<section class="sop-keys">` +
            `<div class="sop-keys-head">附　键盘动作速查</div>` +
            `<p class="sop-keys-note">下列按键可代替鼠标操作，属加速做法，不算步骤。不熟悉请忽略，照上面的顺序做即可。</p>` +
            `<ul class="sop-keys-list">${rows}</ul>` +
            `</section>`
        );
    }

    return html.join('\n');
}

function renderParam(p) {
    if (p.kind === 'input') {
        /* 下划线空格 = 按实际情况填。不写"待填"两个字，也不上底色 */
        const v = p.text.replace(/[【】]/g, '').trim();
        return `<span class="sop-blank" title="按实际情况填写">${escapeHtml(v)}</span>`;
    }
    if (p.kind === 'choice') {
        const opts = p.options.map((o) => escapeHtml(o)).join('　/　');
        return `<span class="sop-param sop-param--choice">选一项：${opts}</span>`;
    }
    const cls = p.text.length > 30 ? 'sop-param sop-param--long' : 'sop-param';
    return `<span class="${cls}">${highlightInline(escapeHtml(p.text))}</span>`;
}

/* ============================================================
   七、索引式首页
   ------------------------------------------------------------
   刻意做成"内部系统索引"而不是落地页：没有大标题、没有说明段落、
   没有卡片，只有一张按业务分组的编号索引表。
   ============================================================ */
async function loadPortal() {
    const loader = document.getElementById('contentLoader');
    const index = await buildIndex();

    const groupHtml = index.groupNames.map((g) => {
        const items = index.groups[g];
        const no = g.split('.')[0];
        const name = g.replace(/^\d+\./, '');
        const rows = items.map((it) => {
            const code = (it.folder.split('/')[1] || '').match(/^(\d+\.\d+)/);
            const num = code ? code[1] : '';
            const missing = it.missing ? '<span class="ix-todo">待补充</span>' : '';
            const faqs = it.faqs ? String(it.faqs) : '—';
            return (
                `<a class="ix-row" data-page="${escapeHtml(it.file)}" data-folder="${escapeHtml(it.folder)}" ` +
                `data-search="${escapeHtml((name + it.title + it.file + num).toLowerCase())}">` +
                `<span class="ix-no">${escapeHtml(num)}</span>` +
                `<span class="ix-name">${escapeHtml(it.title)}${missing}</span>` +
                `<span class="ix-num">${it.steps ? it.steps : '—'}</span>` +
                `<span class="ix-num">${faqs}</span>` +
                `</a>`
            );
        }).join('');
        return (
            `<section class="ix-group" data-group="${escapeHtml(g)}">` +
            `<div class="ix-group-row">` +
            `<span class="ix-group-no">${escapeHtml(no)}</span>` +
            `<span class="ix-group-name">${escapeHtml(name)}</span>` +
            `<span class="ix-group-count">${items.length} 个流程</span>` +
            `</div>` +
            rows +
            `</section>`
        );
    }).join('');

    loader.innerHTML =
        `<div class="ix">` +
        `<div class="ix-bar">` +
        `<div class="ix-bar-left">` +
        `<span class="ix-bar-title">操作手册</span>` +
        `<span class="ix-bar-meta">${index.items.length} 篇 · ${index.totalSteps} 步 · ${index.totalFaqs} 问答</span>` +
        `</div>` +
        `<div class="ix-search">` +
        `<input type="text" id="portalSearch" placeholder="搜索流程 / 编号" autocomplete="off" />` +
        `<span class="ix-search-count" id="portalSearchCount"></span>` +
        `</div>` +
        `</div>` +
        `<div class="ix-head">` +
        `<span class="ix-no">编号</span>` +
        `<span class="ix-name">流程</span>` +
        `<span class="ix-num">步骤</span>` +
        `<span class="ix-num">问答</span>` +
        `</div>` +
        groupHtml +
        `<div class="ix-empty" id="portalEmpty">没有匹配的流程。</div>` +
        `<div class="ix-foot">Ctrl + K 直接定位搜索框　·　共 ${index.items.length} 个流程　·　步骤只统计标准动作，键盘快捷键另见各页附注</div>` +
        `</div>`;

    bindPortal();
    document.querySelector('.app').classList.add('view-home');
    window.scrollTo({ top: 0 });
}

function bindPortal() {
    const input = document.getElementById('portalSearch');
    const empty = document.getElementById('portalEmpty');
    const count = document.getElementById('portalSearchCount');
    if (!input) return;

    const rows = [...document.querySelectorAll('.ix-row')];
    const groups = [...document.querySelectorAll('.ix-group')];

    const apply = () => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        rows.forEach((c) => {
            const hit = !q || c.dataset.search.includes(q);
            c.classList.toggle('is-hidden', !hit);
            if (hit) shown += 1;
        });
        groups.forEach((g) => {
            const any = [...g.querySelectorAll('.ix-row')].some((c) => !c.classList.contains('is-hidden'));
            g.classList.toggle('is-hidden', !any);
        });
        empty.classList.toggle('is-visible', shown === 0);
        count.textContent = q ? `${shown} / ${rows.length}` : '';
    };

    input.addEventListener('input', apply);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { input.value = ''; apply(); input.blur(); }
    });

    rows.forEach((c) => {
        c.addEventListener('click', () => {
            openPage(c.dataset.folder, c.dataset.page);
        });
    });
}

/* ============================================================
   八、左侧导航
   ============================================================ */
async function loadSidebar() {
    const sidebar = document.getElementById('sidebar');
    const index = await buildIndex();

    let html =
        `<div class="search-wrapper">` +
        `<input type="text" id="menuSearch" placeholder="搜索菜单…" autocomplete="off" />` +
        `</div>` +
        `<div class="sidebar-title">导航</div>` +
        `<a class="sidebar-home" data-home="1">全部流程</a>`;

    const groups = index.groups;
    const names = [...index.groupNames];

    for (const g of names) {
        const items = groups[g];
        const name = g.replace(/^\d+\./, '');
        const open = items.some((it) => it.file === state.currentPageId);
        html += `<div class="menu-group">`;
        html += `<div class="group-title" data-toggle="1">${escapeHtml(name)} <span class="arrow${open ? ' open' : ''}">▶</span></div>`;
        html += `<div class="sub-items${open ? ' open' : ''}">`;
        items.forEach((it) => {
            html += `<a data-page="${escapeHtml(it.file)}" data-folder="${escapeHtml(it.folder)}">${escapeHtml(it.title)}</a>`;
        });
        html += `</div></div>`;
    }

    sidebar.innerHTML = html;

    sidebar.querySelectorAll('.group-title').forEach((el) => {
        el.addEventListener('click', toggleMenu);
    });
    sidebar.querySelectorAll('.sub-items a').forEach((link) => {
        link.addEventListener('click', () => {
            openPage(link.dataset.folder, link.dataset.page);
        });
    });
    const homeLink = sidebar.querySelector('.sidebar-home');
    if (homeLink) homeLink.addEventListener('click', switchToHome);

    highlightSidebarItem(state.currentPageId);
    setupMenuSearch();
}

function toggleMenu(e) {
    const el = e.currentTarget;
    const arrow = el.querySelector('.arrow');
    const subItems = el.nextElementSibling;
    if (!subItems || !subItems.classList.contains('sub-items')) return;

    const isOpen = subItems.classList.contains('open');
    const sidebar = el.closest('.sidebar');
    if (sidebar) {
        sidebar.querySelectorAll('.sub-items.open').forEach((item) => {
            if (item !== subItems) {
                item.classList.remove('open');
                const p = item.previousElementSibling;
                const a = p && p.querySelector('.arrow');
                if (a) a.classList.remove('open');
            }
        });
    }
    subItems.classList.toggle('open', !isOpen);
    if (arrow) arrow.classList.toggle('open', !isOpen);
    e.stopPropagation();
}

function highlightSidebarItem(pageId) {
    document.querySelectorAll('.sidebar .sub-items a').forEach((a) => {
        a.classList.toggle('active', a.dataset.page === pageId);
    });
    const homeLink = document.querySelector('.sidebar-home');
    if (homeLink) homeLink.classList.toggle('active', pageId === 'home');
}

function setupMenuSearch() {
    const searchInput = document.getElementById('menuSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function () {
        const q = this.value.toLowerCase().trim();
        document.querySelectorAll('.sidebar .menu-group').forEach((group) => {
            let any = false;
            group.querySelectorAll('.sub-items a').forEach((item) => {
                const hit = !q || item.textContent.toLowerCase().includes(q);
                item.style.display = hit ? '' : 'none';
                if (hit) any = true;
            });
            const title = group.querySelector('.group-title');
            if (title) title.style.display = any ? '' : 'none';
            const subs = group.querySelector('.sub-items');
            if (subs && q) {
                subs.classList.toggle('open', any);
                const a = title && title.querySelector('.arrow');
                if (a) a.classList.toggle('open', any);
            }
        });
    });

    if (setupMenuSearch.bound) return;
    setupMenuSearch.bound = true;
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            /* 门户首页没有左侧菜单，Ctrl + K 要给到门户的搜索框 */
            const onHome = document.querySelector('.app').classList.contains('view-home');
            const el = onHome
                ? document.getElementById('portalSearch')
                : document.getElementById('menuSearch');
            if (el) { el.focus(); el.select(); }
        }
    });
}

/* ============================================================
   九、正文加载（含 include 聚合 → 动作行解析）
   ============================================================ */
async function resolveIncludes(text, basePath, depth) {
    depth = depth || 0;
    if (depth > 2) return text;
    const re = /<!--\s*include:\s*([^\s]+\.md)\s*-->/g;
    const names = [...text.matchAll(re)].map((m) => m[1]);
    if (!names.length) return text;

    const parts = await Promise.all(names.map(async (n) => {
        const t = await fetchText(basePath + n);
        if (t === null) return `（无法加载：${n}）`;
        return await resolveIncludes(t, basePath, depth + 1);
    }));

    let i = 0;
    return text.replace(re, () => parts[i++]);
}

function setLoading(on, width) {
    const bar = document.getElementById('loading-bar');
    if (!bar) return;
    if (on) {
        bar.classList.add('active');
        bar.style.width = width || '30%';
    } else {
        bar.style.width = '100%';
        setTimeout(() => { bar.style.width = '0%'; bar.classList.remove('active'); }, 300);
    }
}

async function loadContent(fullFolder, pageId) {
    const loader = document.getElementById('contentLoader');
    const app = document.querySelector('.app');

    /* 首页 = 卡片门户 */
    if (pageId === 'home' || !pageId) {
        state.currentPageId = 'home';
        state.currentFolder = '';
        app.classList.add('view-home');
        setLoading(true, '40%');
        await loadPortal();
        setLoading(false);
        highlightSidebarItem('home');
        document.getElementById('tocList').innerHTML = '';
        document.getElementById('tocWrapper').classList.add('empty');
        return;
    }

    state.currentPageId = pageId;
    state.currentFolder = fullFolder || '';
    app.classList.remove('view-home');
    setLoading(true, '20%');

    const filePath = `${DOC_ROOT}/${fullFolder}/${pageId}.md`;
    const raw = await fetchText(filePath);

    if (raw === null) {
        loader.innerHTML = '<p class="load-error">页面加载失败，请刷新重试。</p>';
        setLoading(false);
        return;
    }

    const mdText = await resolveIncludes(raw, `${DOC_ROOT}/${fullFolder}/`);
    setLoading(true, '75%');

    const parsed = parseSopBlocks(mdText);
    const bodyHtml = renderSopBlocks(parsed);
    const pageTitle = firstHeading(raw) || pageId;

    const parts = (fullFolder || '').split('/');
    const folderDisplay = parts
        .map((p) => p.replace(/^\d+\./, ''))
        .filter(Boolean)
        .join(' > ');
    const breadcrumb = pageId === 'home'
        ? ' > 首页'
        : ` > ${folderDisplay} > ${pageTitle}`;

    const stepCount = parsed.blocks.filter((b) => b.type === 'step').length;
    const blankCount = parsed.blocks.filter((b) => b.type === 'step' && b.param && b.param.kind === 'input').length;

    /* 常见问题条数 = FAQ 标题后面的三级标题数量 */
    let faqCount = 0;
    let inFaq = false;
    parsed.blocks.forEach((b) => {
        if (b.type !== 'heading') return;
        if (b.level === 2) inFaq = (b.text || '').trim().toUpperCase() === 'FAQ';
        else if (b.level === 3 && inFaq) faqCount += 1;
    });

    const headParts = (fullFolder || '').split('/');
    const codeMatch = (headParts[headParts.length - 1] || '').match(/^(\d+\.\d+)/);
    const docCode = codeMatch ? codeMatch[1] : '';
    const groupName = (headParts[0] || '').replace(/^\d+\./, '');

    loader.innerHTML =
        `<div class="page-block active" id="page-${escapeHtml(pageId)}">` +
        `<div class="breadcrumb">` +
        `<a data-home="1">支援未来</a>${escapeHtml(breadcrumb)}` +
        `</div>` +
        `<div class="doc-head">` +
        `<h1 class="doc-title">${escapeHtml(pageTitle)}</h1>` +
        `<table class="doc-meta">` +
        `<tr><th>流程编号</th><td>${escapeHtml(docCode)}</td>` +
        `<th>所属业务</th><td>${escapeHtml(groupName)}</td></tr>` +
        `<tr><th>标准动作</th><td>${stepCount} 项</td>` +
        `<th>常见问题</th><td>${faqCount} 条</td></tr>` +
        `</table>` +
        (blankCount ? `<p class="doc-legend">下划线处按实际情况填写，其余照做即可。</p>` : '') +
        `<a class="doc-edit" href="https://github.com/Monarchish/Monarchish.github.io/edit/main/${encodeURI(filePath)}" target="_blank" rel="noopener">在 GitHub 上编辑此页</a>` +
        `</div>` +
        `<div class="page-content markdown-body sop-doc">${bodyHtml}</div>` +
        `</div>`;

    const backHome = loader.querySelector('.breadcrumb a[data-home]');
    if (backHome) backHome.addEventListener('click', switchToHome);

    setLoading(false);
    window.scrollTo({ top: 0 });
    setTimeout(generateTOCFromContent, 60);
}

function openPage(folder, pageId) {
    if (!pageId) return;
    highlightSidebarItem(pageId);
    const side = document.querySelector(`.sidebar .sub-items a[data-page="${CSS.escape(pageId)}"]`);
    if (side) {
        const g = side.closest('.menu-group');
        const t = g && g.querySelector('.group-title');
        const s = g && g.querySelector('.sub-items');
        if (s && !s.classList.contains('open')) {
            s.classList.add('open');
            if (t) {
                const a = t.querySelector('.arrow');
                if (a) a.classList.add('open');
            }
        }
        side.scrollIntoView({ block: 'nearest' });
    }
    loadContent(folder, pageId);
}

function switchToHome() {
    loadContent('', 'home');
}

/* ============================================================
   十、右侧「本页指引」
   ============================================================ */
function generateTOCFromContent() {
    const tocList = document.getElementById('tocList');
    const tocWrapper = document.getElementById('tocWrapper');
    if (!tocList || !tocWrapper) return;

    tocList.innerHTML = '';
    const contentArea = document.querySelector('.content-area .page-content');
    if (!contentArea) { tocWrapper.classList.add('empty'); return; }

    const headings = contentArea.querySelectorAll('h2, h3');
    if (!headings.length) { tocWrapper.classList.add('empty'); return; }
    tocWrapper.classList.remove('empty');

    let faqContainer = null;

    headings.forEach((heading) => {
        const tag = heading.tagName.toLowerCase();
        const text = heading.textContent;
        const id = heading.id;
        if (!id) return;

        const jump = (e) => {
            e.preventDefault();
            const el = document.getElementById(id);
            if (!el) return;
            const top = window.pageYOffset + el.getBoundingClientRect().top - 72;
            window.scrollTo({ top, behavior: 'smooth' });
        };

        if (tag === 'h2') {
            if (text.includes('FAQ')) {
                faqContainer = document.createElement('li');
                const parent = document.createElement('div');
                parent.className = 'toc-parent';
                parent.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const children = this.nextElementSibling;
                    if (!children) return;
                    const arrow = this.querySelector('.toc-arrow');
                    const open = children.classList.contains('open');
                    if (arrow) arrow.textContent = open ? '▶' : '▼';
                    children.classList.toggle('open', !open);
                });
                const arrow = document.createElement('span');
                arrow.className = 'toc-arrow';
                arrow.textContent = '▶';
                const label = document.createElement('span');
                label.className = 'toc-label';
                label.textContent = text;
                parent.append(arrow, label);
                const ul = document.createElement('ul');
                ul.className = 'toc-children';
                faqContainer.append(parent, ul);
                tocList.appendChild(faqContainer);
                return;
            }
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + id;
            a.textContent = text;
            a.addEventListener('click', jump);
            li.appendChild(a);
            tocList.appendChild(li);
            faqContainer = null;
        } else if (tag === 'h3' && faqContainer) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + id;
            a.textContent = text;
            a.addEventListener('click', jump);
            li.appendChild(a);
            const ul = faqContainer.querySelector('.toc-children');
            if (ul) ul.appendChild(li);
        }
    });
}

/* ============================================================
   十一、启动
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
    const logo = document.querySelector('.top-nav .logo');
    if (logo) logo.addEventListener('click', switchToHome);
});

async function init() {
    await Promise.all([loadSidebar(), loadContent('', 'home')]);
    setupMenuSearch();
}

window.init = init;
window.switchToHome = switchToHome;
window.toggleMenu = toggleMenu;
