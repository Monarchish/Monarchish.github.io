/* ==========================================================================
   《思想钢印》SOP
   视图：flow(detail|list) / docs / terms / manifesto / audit  ×  run
   数据由 tools/otl2sop.py 从 OTL 大纲生成；原文没有的字段一律显示「待补」
   ========================================================================== */
(function () {
  "use strict";

  /* 流程头显示开关（2026-11-05 作者要求先隐藏）：代码/字段/元信息/常见问题 */
  const HEAD = { code: false, facts: false, meta: false, faq: false };

  /* 步骤区显示开关（2026-11-05 作者要求先隐藏）：说明/操作数/工具/产出/自检/异常/坑/原始记录/全部步骤/底部导航 */
  const STEP = { n: false, desc: false, ops: false, tools: false, outputs: false, checks: false, exceptions: false, pitfalls: false, raw: false, list: false, foot: false };

  const DB = window.SOP_DATA;
  const META = DB.meta;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* 目前只上「采购 / 销售」；其余域（准入、财务、其他）先不上站 */
  const HIDDEN_DOM = { OTH: true, ADM: true, FIN: true };
  const DOMAINS = DB.domains.filter((d) => !HIDDEN_DOM[d.id]);
  const FLOWS = DB.flows.filter((f) => !HIDDEN_DOM[f.domain]);
  const VIS_STEPS = FLOWS.reduce((a, f) => a + f.steps.length, 0);

  const KIND = { action: "", check: "检查点", branch: "分支点" };

  const KEY = "sop-steel-v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { store = {}; }
  store.checks = store.checks || {};
  store.target = store.target || {};
  /* 目录只保留一个展开的分组（跨区块同理）；openDom 为空串表示全部收起 */
  delete store.closed;
  store.stepClosed = store.stepClosed || {};

  const S = { view: "flow", flowId: FLOWS[0].id, step: 1, mode: "detail", q: "", run: false, runStep: 1 };

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

  const flowById = (id) => FLOWS.find((f) => f.id === id);
  const curFlow = () => flowById(S.flowId) || FLOWS[0];
  /* 跨区块只允许一个分组展开：没存过就跟着当前流程走 */
  const openDom = () => (store.openDom === undefined ? curFlow().domain : store.openDom);
  const curStep = () => curFlow().steps.find((s) => s.n === S.step) || curFlow().steps[0];
  const domainById = (id) => DB.domains.find((d) => d.id === id) || { name: id, en: "" };
  const num = (n) => String(n).padStart(2, "0");

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const ckey = (fid, n) => fid + ":" + n;
  const stepDone = (fid, s) => (store.checks[ckey(fid, s.n)] || []).filter(Boolean).length;
  const rawCount = (f) => f.steps.reduce((a, s) => a + ((s.raw && s.raw.length) || 0), 0);

  const flowStat = (f) => {
    let total = 0, done = 0;
    f.steps.forEach((s) => { total += s.checks.length; done += stepDone(f.id, s); });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const TODO = (t) => `<span class="todo">${esc(t || "原文未写 · 待补")}</span>`;

  /* ---------------------------------------------------------------- 左栏 */
  /* 排法照 OTL 目录面板：域 → 流程 → 步骤，三层缩进，当前流程才展开步骤 */
  function renderTree() {
    const tree = $("#tree");
    const keep = tree.scrollTop;
    const cur = curFlow();
    const q = (S.q || "").trim().toLowerCase();
    const hit = (f) => !q || f.title.toLowerCase().indexOf(q) > -1 || f.steps.some((s) => s.title.toLowerCase().indexOf(q) > -1);
    let html = "";

    DOMAINS.forEach((d) => {
      const flows = FLOWS.filter((f) => f.domain === d.id && hit(f));
      if (!flows.length) return;
      const open = q ? true : d.id === openDom();
      html += `<div class="tnode${open ? " open" : ""}">
        <button class="trow lv1" data-toggle-dom="${d.id}">
          <span class="car"></span><span class="nm">${esc(d.name)}</span>
        </button>
        <div class="tkids">`;

      flows.forEach((f) => {
        const isCur = f.id === cur.id;
        const stepsOpen = isCur && store.stepClosed[f.id] !== true;
        const st = flowStat(f);
        const all = st.total && st.done === st.total;
        html += `<div class="tnode${stepsOpen ? " open" : ""}">
          <button class="trow lv2${isCur ? " on" : ""}" data-flow="${f.id}">
            <span class="car" data-toggle-steps="${f.id}"></span>
            <span class="nm">${esc(f.title)}</span>${all ? `<span class="ct">✓</span>` : ""}
          </button>`;
        if (stepsOpen) {
          html += `<div class="tkids">` + f.steps.map((s) => `<button class="trow lv3${s.n === S.step ? " on" : ""}" data-goto="${f.id}:${s.n}">
            <span class="car hide"></span><span class="no">${num(s.n)}</span><span class="nm">${esc(s.title)}</span>
          </button>`).join("") + `</div>`;
        }
        html += `</div>`;
      });

      html += `</div></div>`;
    });

    tree.innerHTML = html;
    tree.scrollTop = keep;
  }

  function revealTree() {
    const el = $("#tree .trow.on");
    if (el) el.scrollIntoView({ block: "nearest" });
  }

  function renderRail() {
    renderTree();
  }

  /* ---------------------------------------------------------------- 顶栏 */
  function renderTop() {
    const f = curFlow();
    const d = domainById(f.domain);
    /* 路径式层级：域 / 流程 / 当前步骤 */
    let c = `<span>${esc(d.name)}</span><span class="sep">/</span><b>${esc(f.title)}</b>`;
    if (S.view === "flow" && S.mode === "detail") c += `<span class="sep">/</span><b>${esc(curStep().title)}</b>`;
    if (S.view === "docs") c = `<b>单据索引</b>`;
    if (S.view === "terms") c = `<b>口径</b>`;
    if (S.view === "audit") c = `<b>完备度自检</b>`;
    if (S.view === "manifesto") c = `<b>纲要</b>`;
    $("#crumb").innerHTML = c;

    /* 顶栏导航高亮当前域 */
    const cur = f.domain;
    $$("[data-dom-jump]").forEach((b) => b.classList.toggle("on", b.dataset.domJump === cur));
  }

  /* ---------------------------------------------------------------- 零件 */
  /* 分支点：旧写法「若（…）」，或直接写成条件（客户同意 / 客户不同意） */
  const BRANCH = /^(若|如果|If\s|客户同意|客户不同意)/;
  /* 动词整体：行首「动词（英文 / 快捷键）」，如 打开（Open）/ 截图（Ctrl+Alt+A） */
  const VERB = /^([一-龥]{1,4}（[^（）]{1,24}）)/;
  /* 括号内英文两侧各留一个空格：打开（Open）→ 打开（ Open ） */
  const SPACED = (t) => t.replace(/（([^（）]+)）/, "（ $1 ）");
  /* 括号明细（明细：…）单独成行 */
  const DETAIL = /（明细：[^）]*）\s*$/;
  const actLi = (a) => {
    if (a.charAt(0) === "…") return `<li class="more">${esc(a)}</li>`;
    if (BRANCH.test(a)) return `<li class="br">${esc(a)}</li>`;
    const dm = a.match(DETAIL);
    const main = dm ? a.slice(0, dm.index).trimEnd() : a;
    const det = dm ? `<span class="adetail">${esc(dm[0])}</span>` : "";
    const m = main.match(VERB);
    const body = m
      ? `<span class="verb">${esc(SPACED(m[1]))}</span>${esc(main.slice(m[1].length).replace(/^\s+/, ""))}${det}`
      : esc(main) + det;
    return `<li>${body}</li>`;
  };

  function rawBlock(s) {
    if (!s.raw || !s.raw.length) return "";
    return `<details class="raw">
      <summary>
        <span class="rl">原始记录</span>
        <span class="rn">${s.raw.length} 条按键</span>
        <span class="rx"></span>
      </summary>
      <ol class="rlist${s.code ? " codelist" : ""}">${s.raw.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
      <div class="rhint">这是 OTL 原文的按键层，一字未改。上面写「做什么」，这里留「手怎么动」。</div>
    </details>`;
  }

  function checksBlock(s, f, compact) {
    const arr = store.checks[ckey(f.id, s.n)] || [];
    return `<div class="checks"${compact ? ' style="border-top:none"' : ""}>
      ${s.checks.map((c, i) => `<label class="check">
        <input type="checkbox" data-check="${s.n}" data-i="${i}" ${arr[i] ? "checked" : ""}>
        <span class="box"></span><span class="txt">${esc(c)}</span>
      </label>`).join("")}
    </div>`;
  }

  function outputsBlock(s) {
    return `<div class="kv">${s.outputs.map((o) => `<div class="kv-row">
      <div class="k">${esc(o.name)}</div>
      <div class="v">${esc(o.rule)}${o.to ? `<small class="to">交给：${esc(o.to)}</small>` : ""}</div>
    </div>`).join("")}</div>`;
  }

  function faqBlock(f) {
    if (!f.faq || !f.faq.length) return "";
    return `<details class="faq">
      <summary><span class="rl">常见问题</span><span class="rn">${f.faq.length} 条</span><span class="rx"></span></summary>
      <dl class="faqlist">${f.faq.map((q) => `<dt>${esc(q.q)}</dt>
        <dd><ol class="rlist">${q.a.slice(0, 12).map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
        ${q.a.length > 12 ? `<div class="rhint">…另有 ${q.a.length - 12} 条，完整见原文</div>` : ""}</dd>`).join("")}
      </dl>
    </details>`;
  }

  /* ---------------------------------------------------------------- 流程页 */
  function renderFlow() {
    const f = curFlow();
    return `<div class="page">
      <div class="fhead">
        ${HEAD.code ? `<div class="fcode"><b>${esc(f.code)}</b><span>${esc(f.version)}</span><span>·</span><span>${esc(domainById(f.domain).name)}</span></div>` : ""}
        <h1>${esc(f.title)}</h1>
        ${f.done ? `<p class="lead">${esc(f.done)}</p>` : ""}

        ${HEAD.facts ? `<dl class="facts">
          <div class="fact"><dt>什么时候走</dt><dd>${f.trigger.length ? esc(f.trigger.join(" · ")) : TODO("原文没有写触发条件")}</dd></div>
          <div class="fact"><dt>手上要有</dt><dd>${f.inputs.length
            ? f.inputs.map((x) => `<span class="ph">${esc(x)}</span>`).join("")
            : TODO("原文没有写前置输入")}</dd></div>
          <div class="fact"><dt>做到算完</dt><dd><em>${esc(f.done)}</em></dd></div>
        </dl>` : ""}

        ${HEAD.meta ? `<div class="metarow">
          <span>系统 <em>${f.systems.length ? esc(f.systems.join("、")) : "—"}</em></span>
          <span>原文 <em>${f.ops} 条操作 / ${f.steps.length} 步</em></span>
          <span>负责人 <em>${esc(f.owner)}</em></span>
          <span>更新 <em>${esc(f.updated)}</em></span>
        </div>` : ""}

        ${HEAD.faq ? faqBlock(f) : ""}
      </div>

      ${S.mode === "detail" ? renderStepBar(f) + renderDetail(f, curStep()) : renderList(f)}
      ${(S.mode === "detail" && STEP.foot) ? renderFoot(f, curStep()) : ""}
    </div>`;
  }

  function renderStepBar(f) {
    return `<div class="stepbar">
      <div class="sbwrap">
        ${f.steps.map((s) => {
          const doneAll = s.checks.length && stepDone(f.id, s) === s.checks.length;
          return `<button class="sb ${s.n === S.step ? "on" : ""} ${doneAll ? "done" : ""}" data-step="${s.n}"><span class="no">${num(s.n)}</span>${esc(s.title)}</button>`;
        }).join("")}
      </div>
      ${STEP.list ? `<button class="tlink sbnote" data-list>全部步骤</button>` : ""}
    </div>`;
  }

  function renderDetail(f, s) {
    return `<article class="step">
      <div class="step-h">
        ${STEP.n ? `<span class="n">第 ${num(s.n)} 步</span>` : ""}
        <h2>${esc(s.title)}</h2>
        ${STEP.ops ? `<span class="tm">${s.ops} 条操作</span>` : ""}
      </div>
      ${STEP.desc ? `<p class="sum">${esc(s.summary)}</p>` : ""}

      <section class="sec">
        <h3>怎么做</h3>
        <ol class="acts">${s.actions.map(actLi).join("")}</ol>
      </section>

      ${(STEP.tools && s.systems.length) ? `<section class="sec">
        <h3>用到什么</h3>
        <div class="tools">${s.systems.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </section>` : ""}

      ${(STEP.outputs && s.outputs.length) ? `<section class="sec">
        <h3>这一步交出什么</h3>
        ${outputsBlock(s)}
      </section>` : ""}

      ${STEP.checks ? ((s.checks.length || s.exceptions.length) ? `<section class="sec">
        <h3>做完，自己核这几条</h3>
        ${s.checks.length ? checksBlock(s, f) : TODO("原文只写了出岔子的情形，没写合格线")}
      </section>` : `<section class="sec sec-slim">
        <h3>判定与分支</h3>
        ${TODO("原文没有写判定标准，也没有写异常分支 —— 待补")}
      </section>`) : ""}

      ${(STEP.exceptions && s.exceptions.length) ? `<section class="sec">
        <h3>出岔子怎么办</h3>
        <table class="ex">
          <thead><tr><th>如果</th><th>那就</th><th>找谁</th></tr></thead>
          <tbody>${s.exceptions.map((e) => `<tr>
            <td>${esc(e.when)}</td><td>${esc(e.then)}</td><td class="who">${esc(e.who || "—")}</td>
          </tr>`).join("")}</tbody>
        </table>
      </section>` : ""}

      ${(STEP.pitfalls && s.pitfalls.length) ? `<section class="sec">
        <h3>踩过的坑</h3>
        <ul class="pits">${s.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </section>` : ""}

      ${STEP.raw ? `<section class="sec">${rawBlock(s)}</section>` : ""}
    </article>`;
  }

  function renderFoot(f, s) {
    return `<div class="sfoot">
      <button class="tlink" data-nav="-1" ${s.n === 1 ? "disabled" : ""}>← 上一步</button>
      <button class="tlink" data-nav="1" ${s.n === f.steps.length ? "disabled" : ""}>下一步 →</button>
      <span class="spacer"></span>
      <button class="tlink" data-run-step="${s.n}">从这一步开始执行</button>
    </div>`;
  }

  function renderList(f) {
    return `<div class="page wide" style="margin-top:30px">
      <table class="tbl">
        <thead><tr><th style="width:52px">步骤</th><th>做什么</th><th style="width:104px">操作数</th><th style="width:210px">交出什么</th><th style="width:64px">判定</th></tr></thead>
        <tbody>${f.steps.map((s) => {
          const d = stepDone(f.id, s);
          return `<tr data-step="${s.n}" style="cursor:pointer">
            <td class="num">${num(s.n)}</td>
            <td><div class="name">${esc(s.title)}</div><div class="sub">${esc(s.summary)}</div></td>
            <td class="dim">${s.ops} 条</td>
            <td class="dim">${s.outputs.length ? esc(s.outputs.map((o) => o.name).join("、")) : TODO("待补")}</td>
            <td class="num" style="white-space:nowrap">${s.checks.length ? `${d}/${s.checks.length}` : TODO("待补")}</td>
          </tr>`;
        }).join("")}</tbody>
      </table>
      <div class="sfoot" style="margin-left:0">
        <button class="tlink" data-list>← 返回单步</button>
        <span class="spacer"></span>
        <span class="lbl">原始 ${rawCount(f)} 条按键 → 折叠为 ${f.steps.length} 步</span>
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- 表格页 */
  function chip(fid, n) {
    const f = flowById(fid);
    const s = f && f.steps.find((x) => x.n === n);
    if (!s) return "";
    return `<button class="wchip" data-goto="${fid}:${n}"><span class="wf">${esc(f.title)}</span>${num(n)} ${esc(s.title)}</button>`;
  }

  function renderDocs() {
    return `<div class="page wide">
      <div class="phead">
        <h1>单据索引</h1>
        <p>单据是流程留下的物证。这里列的不是我编的清单，是原文里真正被打开过的那些表、单、台账、模板。</p>
      </div>
      <table class="tbl">
        <thead><tr><th style="width:270px">单据</th><th style="width:190px">载体</th><th>出现在</th></tr></thead>
        <tbody>${DB.documents.map((d) => `<tr>
          <td><div class="name">${esc(d.name)}</div><div class="sub">${esc(d.use)}</div></td>
          <td class="dim">${esc(d.template)}</td>
          <td><div class="where">${d.where.map(([fid, n]) => chip(fid, n)).join("")}</div></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderTerms() {
    return `<div class="page wide">
      <div class="phead">
        <h1>口径</h1>
        <p>同一个词在不同人嘴里指不同的东西，是协作里最贵的错误。这些词都在原文里出现过，右侧是它落在哪一步。</p>
      </div>
      <table class="tbl">
        <thead><tr><th style="width:150px">词</th><th>意思与规则</th><th style="width:280px">出现在</th></tr></thead>
        <tbody>${DB.terms.map((t) => `<tr>
          <td class="name">${esc(t.term)}</td>
          <td class="dim">${esc(t.def)}<div class="sub" style="margin-top:5px">规则：${esc(t.rule)}</div></td>
          <td><div class="where">${t.where.map(([fid, n]) => chip(fid, n)).join("")}</div></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderAudit() {
    const label = { missing: "缺", partial: "部分", have: "有" };
    const c = (k) => DB.audit.filter((a) => a.now === k).length;
    const st = META.stats;
    return `<div class="page wide">
      <div class="phead">
        <h1>完备度自检</h1>
        <p>全量同步之后，用数据说话：${st.steps} 个步骤里，写了判定标准的 ${st.with_checks} 个，写了分支的 ${st.with_exc} 个，写明产出的 ${st.with_out} 个；${st.flows} 条流程里，写明触发条件的${st.no_trigger === st.flows ? "一条都还没有" : " " + (st.flows - st.no_trigger) + " 条"}。</p>
      </div>

      <div class="auditnote">
        <b class="t">结论</b>
        <div>搬上来的内容一条没丢（${st.ops} 条操作全部可查），但结构化的部分几乎全空。缺的不是细节，是四个字段：<strong>触发条件、判定标准、异常分支、执行留痕</strong>。补这四个，流水账才会变成作业书。</div>
      </div>

      <table class="tbl">
        <thead><tr><th style="width:40px">#</th><th style="width:196px">要素</th><th style="width:300px">为什么需要</th><th>现在该怎么补</th><th style="width:52px">状态</th></tr></thead>
        <tbody>${DB.audit.map((a, i) => `<tr>
          <td class="num">${num(i + 1)}</td>
          <td><div class="name">${esc(a.k)}</div><div class="sub">${esc(a.note)}</div></td>
          <td class="dim">${esc(a.why)}</td>
          <td class="dim">${esc(a.fix)}</td>
          <td><span class="st ${a.now}">${label[a.now]}</span></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderManifesto() {
    const H = META.history || [];
    const M = META.manifesto || [];
    return `<div class="page">
      <div class="phead">
        <h1>纲要</h1>
        <p>这一页不是我写的，是从手册自己的《编写规范》里抽出来的：核心哲学、架构、格式、指令规范、逻辑控制。名字、层级、指令词都定死在这里，后面的 ${META.stats.steps} 个步骤只是照它执行。</p>
      </div>

      <div class="prose">
        ${M.map((sec) => `<h2><i>${esc(sec.no)}</i>${esc(sec.h)}</h2>` + sec.blocks.map((b) => {
          if (b.t === "h") return `<h3>${esc(b.v)}</h3>`;
          if (b.t === "table") return `<table class="mtbl"><thead><tr><th>指令词</th><th>含义</th><th>使用场景</th></tr></thead><tbody>${b.rows.map((r) => `<tr><td class="code">${esc(r[0])}</td><td class="dim">${esc(r[1])}</td><td class="dim">${esc(r[2])}</td></tr>`).join("")}</tbody></table>`;
          return `<p>${esc(b.v)}</p>`;
        }).join("")).join("")}
      </div>

      <div class="hist">
        <h2 class="hist-h">沿革</h2>
        ${H.map((h) => `<div class="hist-row">
          <div class="hd">${esc(h.date)}</div>
          <div class="hc">
            <div class="ht">${esc(h.title)}</div>
            ${h.quotes.map((q) => `<p class="hq">${esc(q)}</p>`).join("")}
            ${h.state.map((q) => `<p class="hs">${esc(q)}</p>`).join("")}
          </div>
        </div>`).join("")}
      </div>
    </div>`;
  }

  /* ---------------------------------------------------------------- 渲染 */
  function render() {
    const view = $("#view");
    const top = view.scrollTop;
    if (S.view === "flow") view.innerHTML = renderFlow();
    else if (S.view === "docs") view.innerHTML = renderDocs();
    else if (S.view === "terms") view.innerHTML = renderTerms();
    else if (S.view === "audit") view.innerHTML = renderAudit();
    else view.innerHTML = renderManifesto();
    view.scrollTop = top;
    renderRail();
    renderTop();
    renderOutline();
  }

  /* 右栏「页面导航」：当前流程的步骤 */
  function renderOutline() {
    const el = $("#outline");
    if (!el) return;
    if (S.view !== "flow") { el.innerHTML = ""; return; }
    const f = curFlow();
    el.innerHTML = `<div class="outline-title">页面导航</div>
      <nav class="outline-list">
        ${f.steps.map((s) => `<button class="outline-link${s.n === S.step && S.mode === "detail" ? " on" : ""}" data-step="${s.n}"><span class="idx">${num(s.n)}</span>${esc(s.title)}</button>`).join("")}
      </nav>`;
  }

  function syncProgress() {
    const f = curFlow();
    renderRail();
    renderTop();
    $$(".sb").forEach((el) => {
      const s = f.steps.find((x) => x.n === Number(el.dataset.step));
      el.classList.toggle("done", !!(s && s.checks.length && stepDone(f.id, s) === s.checks.length));
    });
  }

  /* ---------------------------------------------------------------- 导航 */
  function openFlow(fid, step, mode) {
    const f = flowById(fid);
    if (f) store.openDom = f.domain;
    store.lastFlow = fid; store.lastStep = step || 1;
    S.view = "flow"; S.flowId = fid; S.step = step || 1; S.mode = mode || "detail";
    save();
    document.body.classList.remove("nav-open");
    render();
    $("#view").scrollTop = 0;
    revealTree();
  }

  /* ---------------------------------------------------------------- 执行 */
  function openRun(stepN) {
    S.run = true; S.runStep = stepN || S.step;
    $("#run").hidden = false;
    renderRun();
    document.body.style.overflow = "hidden";
  }
  function closeRun() {
    S.run = false; $("#run").hidden = true;
    document.body.style.overflow = "";
  }

  function renderRun() {
    const f = curFlow();
    const s = f.steps.find((x) => x.n === S.runStep) || f.steps[0];
    const idx = f.steps.indexOf(s);
    const target = store.target[f.id] || "";
    const pct = Math.round(((idx + 1) / f.steps.length) * 100);

    $("#run").innerHTML = `
      <div class="run-bar">
        <button class="tlink" data-run-close>退出</button>
        <span class="rb-title">${esc(f.code)}　${esc(f.title)}</span>
        <div class="rb-prog"><i style="width:${pct}%"></i></div>
        <span class="rb-n">${num(s.n)} / ${num(f.steps.length)}</span>
        <button class="tlink" data-run-list>一览</button>
      </div>
      <div class="run-body">
        <div class="run-inner">
          <div class="run-target">
            <label>本次对象</label>
            <input id="targetInput" placeholder="客户全称 / 合同号 / 单据号 / 捆包号" value="${esc(target)}">
          </div>

          <div class="run-n">第 ${num(s.n)} 步 · ${s.ops} 条操作${KIND[s.kind] ? " · " + KIND[s.kind] : ""}</div>
          <h2 class="run-h">${esc(s.title)}</h2>
          <p class="run-sum">${esc(s.summary)}</p>

          <section class="run-sec">
            <h4>现在做</h4>
            <ol class="run-acts">${s.actions.map(actLi).join("")}</ol>
          </section>

          ${s.outputs.length ? `<section class="run-sec">
            <h4>要交出</h4>
            ${outputsBlock(s)}
          </section>` : ""}

          <section class="run-sec">
            <h4>做完核对${s.checks.length ? "（勾上即留痕）" : ""}</h4>
            ${s.checks.length ? checksBlock(s, f, true) : TODO("原文没有写判定标准")}
          </section>

          ${s.exceptions.length ? `<section class="run-sec">
            <h4>出岔子</h4>
            <table class="ex"><tbody>${s.exceptions.map((e) => `<tr><td>${esc(e.when)}</td><td>${esc(e.then)}</td><td class="who">${esc(e.who || "—")}</td></tr>`).join("")}</tbody></table>
          </section>` : ""}

          ${s.raw && s.raw.length ? `<section class="run-sec">${rawBlock(s)}</section>` : ""}
        </div>
      </div>
      <div class="run-foot">
        <button class="tlink" data-run-nav="-1" ${idx === 0 ? "disabled" : ""}>← 上一步</button>
        <button class="tlink" data-run-nav="1" ${idx === f.steps.length - 1 ? "disabled" : ""}>下一步 →</button>
        <span class="spacer"></span>
        <span class="hint">↑ ↓ 切换 · ESC 退出</span>
        <button class="act" data-copy>复制执行记录</button>
      </div>`;
  }

  function copyRecord() {
    const f = curFlow();
    const target = store.target[f.id] || "（未填）";
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    let md = `## 思想钢印 · 执行记录 ${f.code}\n\n`;
    md += `- 流程：${f.title}\n- 对象：${target}\n- 日期：${date}\n- 执行人：${META.owner}\n\n`;
    f.steps.forEach((s) => {
      const arr = store.checks[ckey(f.id, s.n)] || [];
      const n = arr.filter(Boolean).length;
      md += `### ${num(s.n)} ${s.title}　${s.checks.length ? `${n}/${s.checks.length}` : "无判定项"}\n`;
      s.checks.forEach((c, i) => { md += `- [${arr[i] ? "x" : " "}] ${c}\n`; });
      md += "\n";
    });
    md += `> 由《思想钢印》生成 · ${date}\n`;
    const done = () => toast("执行记录已复制，可直接粘回 OTL");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).then(done).catch(() => fallback(md, done));
    } else fallback(md, done);
  }

  function fallback(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); cb(); } catch (e) { toast("复制失败，请手动选择"); }
    document.body.removeChild(ta);
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ---------------------------------------------------------------- 事件 */
  document.addEventListener("click", (e) => {
    const t = e.target;

    const domBtn = t.closest("[data-toggle-dom]");
    if (domBtn) {
      const id = domBtn.dataset.toggleDom;
      store.openDom = openDom() === id ? "" : id;
      save(); renderTree();
      return;
    }

    const stepToggle = t.closest("[data-toggle-steps]");
    if (stepToggle) {
      const id = stepToggle.dataset.toggleSteps;
      if (id === S.flowId) {
        store.stepClosed[id] = store.stepClosed[id] !== true;
        save(); renderTree();
      } else {
        delete store.stepClosed[id];
        save();
        openFlow(id, 1, "detail");
      }
      return;
    }

    const flowBtn = t.closest("[data-flow]");
    if (flowBtn) {
      delete store.stepClosed[flowBtn.dataset.flow];
      save();
      openFlow(flowBtn.dataset.flow, 1, "detail");
      return;
    }

    if (t.closest("[data-list]")) {
      S.mode = S.mode === "list" ? "detail" : "list";
      render();
      return;
    }

    const rowStep = t.closest("tr[data-step]");
    if (rowStep) { S.step = Number(rowStep.dataset.step); S.mode = "detail"; render(); $("#view").scrollTop = 0; return; }

    const stepBtn = t.closest("[data-step]");
    if (stepBtn) {
      S.step = Number(stepBtn.dataset.step);
      if (S.run) { S.runStep = S.step; renderRun(); return; }
      S.mode = "detail";
      render();
      /* 切步后回到页面顶部，让「流程标题 + 步骤条」始终可见 */
      $("#view").scrollTop = 0;
      return;
    }

    const navBtn = t.closest("[data-nav]");
    if (navBtn) {
      const f = curFlow();
      const next = S.step + Number(navBtn.dataset.nav);
      if (next >= 1 && next <= f.steps.length) { S.step = next; render(); $("#view").scrollTop = 0; }
      return;
    }

    const viewBtn = t.closest("[data-view]");
    if (viewBtn) {
      S.view = viewBtn.dataset.view;
      render();
      $("#view").scrollTop = 0;
      document.body.classList.remove("nav-open");
      return;
    }

    const gotoBtn = t.closest("[data-goto]");
    if (gotoBtn) {
      const p = gotoBtn.dataset.goto.split(":");
      openFlow(p[0], Number(p[1]), "detail");
      return;
    }

    const runStepBtn = t.closest("[data-run-step]");
    if (runStepBtn) { openRun(Number(runStepBtn.dataset.runStep)); return; }

    if (t.closest("#menuBtn")) { document.body.classList.toggle("nav-open"); return; }

    const domJump = t.closest("[data-dom-jump]");
    if (domJump) {
      const first = FLOWS.find((f) => f.domain === domJump.dataset.domJump);
      if (first) { openFlow(first.id, 1, "detail"); document.body.classList.remove("nav-open"); }
      return;
    }

    if (t.closest("[data-run-close]")) { closeRun(); return; }
    if (t.closest("[data-run-list]")) { closeRun(); S.mode = "list"; S.view = "flow"; render(); return; }
    const runNav = t.closest("[data-run-nav]");
    if (runNav) {
      const f = curFlow();
      const next = S.runStep + Number(runNav.dataset.runNav);
      if (next >= 1 && next <= f.steps.length) { S.runStep = next; S.step = next; renderRun(); $(".run-body").scrollTop = 0; }
      return;
    }
    if (t.closest("[data-copy]")) { copyRecord(); return; }
  });

  document.addEventListener("change", (e) => {
    const cb = e.target.closest("input[data-check]");
    if (!cb) return;
    const n = Number(cb.dataset.check);
    const i = Number(cb.dataset.i);
    const key = ckey(S.flowId, n);
    const arr = store.checks[key] || [];
    const step = curFlow().steps.find((s) => s.n === n);
    while (arr.length < step.checks.length) arr.push(false);
    arr[i] = cb.checked;
    store.checks[key] = arr;
    save();
    syncProgress();
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "targetInput") { store.target[S.flowId] = e.target.value; save(); return; }
    if (e.target.id === "q") { S.q = e.target.value; renderTree(); }
  });

  document.addEventListener("scroll", () => {}, true);

  /* 顶栏分隔线：内容滚动后出现 */
  $("#view").addEventListener("scroll", () => {
    $("#nav").classList.toggle("scrolled", $("#view").scrollTop > 4);
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    const inInput = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      const q = $("#q");
      if (q) { e.preventDefault(); q.focus(); q.select(); }
      return;
    }
    if (e.key === "Escape") {
      if (S.run) { closeRun(); return; }
      document.body.classList.remove("nav-open");
      const q = $("#q");
      if (document.activeElement === q) { q.value = ""; S.q = ""; renderTree(); q.blur(); }
    }
    if (!S.run) return;
    if (!inInput && (e.key === "ArrowDown" || e.key === "ArrowRight")) {
      e.preventDefault();
      const f = curFlow();
      if (S.runStep < f.steps.length) { S.runStep++; S.step = S.runStep; renderRun(); $(".run-body").scrollTop = 0; }
    }
    if (!inInput && (e.key === "ArrowUp" || e.key === "ArrowLeft")) {
      e.preventDefault();
      if (S.runStep > 1) { S.runStep--; S.step = S.runStep; renderRun(); $(".run-body").scrollTop = 0; }
    }
  });

  /* ---------------------------------------------------------------- 启动 */
  /* 回到上次所在的流程，目录展开的分组与主区始终对得上 */
  if (store.lastFlow && flowById(store.lastFlow)) {
    const f = flowById(store.lastFlow);
    S.flowId = f.id;
    S.step = Math.min(Math.max(1, Number(store.lastStep) || 1), f.steps.length);
  }
  render();
})();
