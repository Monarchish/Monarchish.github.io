/* ==========================================================================
   支援未来 · SOP
   视图：flow(detail|list) / docs / terms / audit / write  ×  run
   ========================================================================== */
(function () {
  "use strict";

  const DB = window.SOP_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const KIND = { action: "操作", check: "检查点", branch: "分支点" };

  const KEY = "sop-proto-v2";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { store = {}; }
  store.checks = store.checks || {};
  store.target = store.target || {};
  store.closed = store.closed || {};

  const S = { view: "flow", flowId: DB.flows[0].id, step: 1, mode: "detail", q: "", run: false, runStep: 1 };

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

  const flowById = (id) => DB.flows.find((f) => f.id === id);
  const curFlow = () => flowById(S.flowId);
  const curStep = () => curFlow().steps.find((s) => s.n === S.step) || curFlow().steps[0];
  const domainById = (id) => DB.domains.find((d) => d.id === id);
  const num = (n) => String(n).padStart(2, "0");

  const join = (arr) => arr.map((t) => esc(t)).join('<span class="sep"> · </span>');

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const hl = (t, q) => {
    const s = String(t == null ? "" : t);
    if (!q) return esc(s);
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length));
  };

  const ckey = (fid, n) => fid + ":" + n;
  const stepDone = (fid, s) => (store.checks[ckey(fid, s.n)] || []).filter(Boolean).length;
  const rawCount = (f) => f.steps.reduce((a, s) => a + ((s.raw && s.raw.length) || 0), 0);

  const flowStat = (f) => {
    let total = 0, done = 0;
    f.steps.forEach((s) => { total += s.checks.length; done += stepDone(f.id, s); });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  /* ---------------------------------------------------------------- 左栏 */
  function renderTree() {
    const tree = $("#tree");
    const keep = tree.scrollTop;
    let html = "";
    DB.domains.forEach((d) => {
      const flows = DB.flows.filter((f) => f.domain === d.id);
      if (!flows.length) return;
      const closed = !!store.closed[d.id];
      html += `<div class="dom ${closed ? "closed" : ""}">
        <button class="dom-h" data-toggle-dom="${d.id}"><span>${esc(d.name)}</span><em>${esc(d.en)}</em></button>`;
      flows.forEach((f) => {
        const st = flowStat(f);
        const all = st.total && st.done === st.total;
        html += `<button class="flow-i ${f.id === S.flowId ? "on" : ""}" data-flow="${f.id}">
          <span class="n">${esc(f.code.split("-").pop())}</span>
          <span class="t">${esc(f.title.split("：")[0])}</span>
          ${all ? `<span class="ok">✓</span>` : ""}
        </button>`;
      });
      html += `</div>`;
    });
    tree.innerHTML = html;
    tree.scrollTop = keep;
  }

  function renderRail() {
    renderTree();
    $("#railMeta").textContent = `${DB.flows.length} 条流程 · ${DB.meta.version}`;
    $("#nvDocs").textContent = DB.documents.length;
    $("#nvTerms").textContent = DB.terms.length;
    $$(".nv").forEach((b) => b.classList.toggle("on", b.dataset.view === S.view));
  }

  /* ---------------------------------------------------------------- 顶栏 */
  function renderTop() {
    const f = curFlow();
    const d = domainById(f.domain);
    let c = `<b>${esc(d.name)}</b><span class="sep">/</span><span>${esc(f.code)}</span>`;
    if (S.view === "flow" && S.mode === "detail") c += `<span class="sep">/</span><b>第 ${num(S.step)} 步</b>`;
    if (S.view === "docs") c = `<b>单据索引</b>`;
    if (S.view === "terms") c = `<b>口径</b>`;
    if (S.view === "audit") c = `<b>完备度自检</b>`;
    if (S.view === "write") c = `<b>写法</b>`;
    $("#crumb").innerHTML = c;

    const st = flowStat(f);
    $("#tbStat").textContent = `${f.steps.length} 步 · 已核 ${st.done}/${st.total}`;
    $("#runBtn").textContent = S.view === "flow" && S.mode === "detail" ? "执行模式" : "回到流程";
  }

  /* ---------------------------------------------------------------- 零件 */
  function rawBlock(s) {
    if (!s.raw || !s.raw.length) return "";
    return `<details class="raw">
      <summary>
        <span class="rl">原始记录</span>
        <span class="rn">${s.raw.length} 条按键</span>
        <span class="rx"></span>
      </summary>
      <ol class="rlist">${s.raw.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
      <div class="rhint">这是 OTL 原文的按键层。上面写"要交出什么"，这里留"手怎么动"——给 RPA 抓，也给第一次做的人自学。</div>
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

  /* ---------------------------------------------------------------- 流程页 */
  function renderFlow() {
    const f = curFlow();
    const st = flowStat(f);
    return `<div class="page">
      <div class="fhead">
        <div class="fcode"><b>${esc(f.code)}</b><span>${esc(f.version)}</span><span>·</span><span>${esc(domainById(f.domain).name)}</span></div>
        <h1>${esc(f.title)}</h1>
        <div class="fen">${esc(f.en)}</div>

        <dl class="facts">
          <div class="fact"><dt>什么时候走</dt><dd>${join(f.trigger)}</dd></div>
          <div class="fact"><dt>开工要有</dt><dd>${join(f.inputs)}</dd></div>
          <div class="fact"><dt>做到算完</dt><dd><em>${esc(f.done)}</em></dd></div>
        </dl>

        <div class="metarow">
          <span>负责人 <em>${esc(f.owner)}</em></span>
          <span>时限 <em>${esc(f.sla)}</em></span>
          <span>更新 <em>${esc(f.updated)}</em></span>
          <span>角色 <em>${esc(f.roles)}</em></span>
        </div>
      </div>

      ${S.mode === "detail" ? renderStepBar(f) + renderDetail(f, curStep()) : renderList(f)}
      ${S.mode === "detail" ? renderFoot(f, curStep()) : ""}
    </div>`;
  }

  function renderStepBar(f) {
    return `<div class="stepbar">
      <div class="sbwrap">
        ${f.steps.map((s) => {
          const doneAll = s.checks.length && stepDone(f.id, s) === s.checks.length;
          return `<button class="sb ${s.n === S.step ? "on" : ""} ${doneAll ? "done" : ""}" data-step="${s.n}">${num(s.n)}</button>`;
        }).join("")}
      </div>
      <button class="tlink sbnote" data-list>全部步骤</button>
    </div>`;
  }

  function renderDetail(f, s) {
    return `<article class="step">
      <div class="step-h">
        <span class="n">第 ${num(s.n)} 步</span>
        <h2>${esc(s.title)}</h2>
        <span class="tm">${esc(s.time)}</span>
      </div>
      <p class="sum">${esc(s.summary)}</p>

      <section class="sec">
        <h3>怎么做</h3>
        <ol class="acts">${s.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
      </section>

      <section class="sec">
        <h3>用到什么</h3>
        <div class="tools">${s.tools.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </section>

      <section class="sec">
        <h3>这一步要交出什么</h3>
        <div class="kv">${s.outputs.map((o) => `<div class="kv-row">
          <div class="k">${esc(o.name)}</div>
          <div class="v">${esc(o.rule)}<small class="to">交给：${esc(o.to)}</small></div>
        </div>`).join("")}</div>
      </section>

      <section class="sec">
        <h3>做完，自己核这几条</h3>
        ${checksBlock(s, f)}
      </section>

      ${s.exceptions.length ? `<section class="sec">
        <h3>出岔子怎么办</h3>
        <table class="ex">
          <thead><tr><th>如果</th><th>那就</th><th>找谁</th></tr></thead>
          <tbody>${s.exceptions.map((e) => `<tr>
            <td>${esc(e.when)}</td><td>${esc(e.then)}</td><td class="who">${esc(e.who)}</td>
          </tr>`).join("")}</tbody>
        </table>
      </section>` : ""}

      ${s.pitfalls.length ? `<section class="sec">
        <h3>踩过的坑</h3>
        <ul class="pits">${s.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </section>` : ""}

      <section class="sec">${rawBlock(s)}</section>
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
        <thead><tr><th style="width:52px">步骤</th><th>做什么</th><th style="width:112px">用时</th><th style="width:196px">交出什么</th><th style="width:58px">判定</th></tr></thead>
        <tbody>${f.steps.map((s) => {
          const d = stepDone(f.id, s);
          return `<tr data-step="${s.n}" style="cursor:pointer">
            <td class="num">${num(s.n)}</td>
            <td><div class="name">${esc(s.title)}</div><div class="sub">${esc(s.summary)}</div></td>
            <td class="dim">${esc(s.time)}</td>
            <td class="dim">${esc(s.outputs.map((o) => o.name).join("、"))}</td>
            <td class="num" style="white-space:nowrap">${d}/${s.checks.length}</td>
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
  function renderDocs() {
    return `<div class="page wide">
      <div class="phead">
        <h1>单据索引</h1>
        <p>单据是流程留下的物证。每张单据要能回答三件事：干什么用、按什么规矩命名、出现在哪几步。</p>
      </div>
      <table class="tbl">
        <thead><tr><th style="width:250px">单据</th><th>用途</th><th style="width:300px">出现在</th></tr></thead>
        <tbody>${DB.documents.map((d) => `<tr>
          <td><div class="name">${esc(d.name)}</div><div class="sub">${esc(d.template)}</div></td>
          <td class="dim">${esc(d.use)}</td>
          <td><div class="where">${d.where.map(([fid, n]) => {
            const f = flowById(fid); const s = f.steps.find((x) => x.n === n);
            return `<button class="wchip" data-goto="${fid}:${n}">${num(n)} ${esc(s.title)}</button>`;
          }).join("")}</div></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderTerms() {
    return `<div class="page wide">
      <div class="phead">
        <h1>口径</h1>
        <p>同一个词在不同人嘴里指不同的东西，是协作里最贵的错误。这里不只解释词，还给出判定规则和它出现在哪一步。</p>
      </div>
      <table class="tbl">
        <thead><tr><th style="width:170px">词</th><th>意思与规则</th><th style="width:300px">出现在</th></tr></thead>
        <tbody>${DB.terms.map((t) => `<tr>
          <td class="name">${esc(t.term)}</td>
          <td class="dim">${esc(t.def)}<div class="sub" style="margin-top:5px">规则：${esc(t.rule)}</div></td>
          <td><div class="where">${t.where.map(([fid, n]) => {
            const f = flowById(fid); const s = f.steps.find((x) => x.n === n);
            return `<button class="wchip" data-goto="${fid}:${n}">${num(n)} ${esc(s.title)}</button>`;
          }).join("")}</div></td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
  }

  function renderAudit() {
    const label = { missing: "缺", partial: "部分", have: "有" };
    const c = (k) => DB.audit.filter((a) => a.now === k).length;
    return `<div class="page wide">
      <div class="phead">
        <h1>完备度自检</h1>
        <p>${esc(DB.meta.source)}。这是一份扎实的按键脚本，但脚本回答的是"手怎么动"，SOP 要回答"什么时候做、做到什么算对、错了找谁"。下面 12 项是照着你现有文档逐条对出来的。</p>
      </div>

      <div class="auditnote">
        <b class="t">结论</b>
        <div>12 项里，现有记录 <span class="st missing">缺 ${c("missing")} 项</span>、<span class="st partial">部分 ${c("partial")} 项</span>、<span class="st have">合格 ${c("have")} 项</span>。缺的不是细节，是四个结构性字段：<strong>前置输入、判定标准、异常分支、执行留痕</strong>。补上这四项，流水账才会变成作业书。</div>
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

  function renderWrite() {
    return `<div class="page">
      <div class="phead">
        <h1>写法</h1>
        <p>你的 12 万字已经覆盖了"手怎么动"。差的不在篇幅，在约束——同一件事，允许有几种说法，就会有几种做法。</p>
      </div>

      <div class="prose">
        <p style="margin-top:26px">1980 年代，欧洲几国的技师在同一架飞机上读维修手册。同一颗螺栓，法国人写 remove，英国人写 dismantle，德国工程师写成 take away。三种英语，同一个动作，扳手上错了地方。</p>
        <p>1986 年，欧洲航空航天设备制造商协会（AECMA）印发了一本小册子：把英语砍到 900 个批准词，一个词只准有一个意思，一句话只准下一个指令。2005 年 AECMA 并入 ASD，这本册子改名 <strong>ASD-STE100</strong>，今天空客的维修手册、北约的装备文档、大批医疗器械的说明书都按它写；波音走的是自己的一套，思路同源。</p>
        <p>它不是"写得简单"，是<strong>写得只有一个读法</strong>。</p>

        <h2><i>01</i>一个词只准有一个意思</h2>
        <p>"查一下、看一下、核对一下、对一下"——你我都知道是同一件事，但新人不知道。定一张动词表：<strong>查、录、核、交</strong>四个字，全篇只准用这四个，不准换同义词。词表一固定，句子就没法含糊。</p>

        <h2><i>02</i>一句话只下一个指令</h2>
        <p>一句话里塞三个动作，读到第三个时第一个已经忘了。</p>
        <div class="cmp">
          <div><span class="caph">现在这样写</span>打开台账，找到那一行，然后把金额改成含税的。</div>
          <div><span class="caph">拆成三条</span>① 打开台账。② 找到客户全称对应的那一行。③ 把金额改为含税金额。</div>
        </div>

        <h2><i>03</i>条件写在动作前面，单独成句</h2>
        <p>"下载时注意每天只能下一次"——这句话在动作之后，人已经点完了。条件必须前置，并且能单独判断。</p>
        <div class="cmp">
          <div><span class="caph">现在这样写</span>点击下载，注意云仓每天只能下一次，重复下载会导致库存错误。</div>
          <div><span class="caph">受控写法</span>① 若今天已下载过，停止，转第 05 步。② 点击"下载"。③ 核对：文件日期 = 今天。</div>
        </div>

        <h2><i>04</i>每句话都要能被第三方判真假</h2>
        <p>"金额正确"判不了，谁都能说自己正确。"台账金额 = 发票金额，含税，保留两位小数"能判，而且判错的人要负责。判定标准写不成等式，就不是标准，是态度。</p>

        <h2><i>05</i>警告分三级，不许都叫"注意"</h2>
        <p>会做错的叫<strong>错</strong>（停手，重做）；会造成损失的叫<strong>险</strong>（停手，上报）；只是提醒的叫<strong>注</strong>（记一笔，继续）。三级对应三种动作，混在一起等于没有警告。</p>

        <h2><i>06</i>所以 SOP 不是模板，是一张词表加五条句式</h2>
        <p>模板解决"填什么"，词表解决"怎么写"。你现在缺的是后者：一套自己的受控写法——四个动词、一句话一个动作、条件前置、判定成等式、警告分三级。</p>
        <p>把这三万条按键按这五条过一遍，SOP 就成型了。剩下的工作量不在写，在<strong>删</strong>：把 2982 条按键压成 126 个"交出什么"，每一条都能被另一人数出来。</p>
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
    else view.innerHTML = renderWrite();
    view.scrollTop = top;
    renderRail();
    renderTop();
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

  /* ---------------------------------------------------------------- 搜索 */
  function search(q) {
    const res = [];
    DB.flows.forEach((f) => {
      if ((f.title + f.code + f.en).toLowerCase().includes(q)) {
        res.push({ type: "流程", t: f.title, c: f.code, go: () => openFlow(f.id, 1, "detail") });
      }
      f.steps.forEach((s) => {
        const hay = [s.title, s.summary, s.actions.join(" "), s.tools.join(" "), s.checks.join(" "),
          s.pitfalls.join(" "), (s.raw || []).join(" "),
          s.outputs.map((o) => o.name + " " + o.rule).join(" "),
          s.exceptions.map((e) => e.when + " " + e.then).join(" ")
        ].join(" ").toLowerCase();
        if (hay.includes(q)) {
          res.push({ type: "步骤", t: s.title, c: f.code + " · " + num(s.n), go: () => openFlow(f.id, s.n, "detail") });
        }
      });
    });
    DB.documents.forEach((d) => {
      if ((d.name + d.use + d.template).toLowerCase().includes(q)) res.push({ type: "单据", t: d.name, c: d.template, go: () => { S.view = "docs"; render(); } });
    });
    DB.terms.forEach((t) => {
      if ((t.term + t.def + t.rule).toLowerCase().includes(q)) res.push({ type: "口径", t: t.term, c: t.def.slice(0, 26), go: () => { S.view = "terms"; render(); } });
    });
    return res.slice(0, 22);
  }

  function renderSearch() {
    const panel = $("#sp");
    const q = S.q.trim().toLowerCase();
    if (!q) { panel.classList.remove("show"); panel.innerHTML = ""; return; }
    const res = search(q);
    if (!res.length) {
      panel.innerHTML = `<div class="sp-empty">没有匹配。试试「开票」「质保书」「捆包号」「审批」。</div>`;
      panel.classList.add("show");
      return;
    }
    const groups = {};
    res.forEach((r, i) => { (groups[r.type] = groups[r.type] || []).push(Object.assign({}, r, { i })); });
    let html = "";
    Object.keys(groups).forEach((g) => {
      html += `<div class="sp-g"><div class="sp-gh">${g}</div>`;
      groups[g].forEach((r) => {
        html += `<button class="sp-row" data-res="${r.i}"><div class="sp-t">${hl(r.t, q)}</div><div class="sp-c">${esc(r.c)}</div></button>`;
      });
      html += `</div>`;
    });
    panel.innerHTML = html;
    panel.classList.add("show");
    window.__res = res;
  }

  /* ---------------------------------------------------------------- 导航 */
  function openFlow(fid, step, mode) {
    S.view = "flow"; S.flowId = fid; S.step = step || 1; S.mode = mode || "detail";
    closeSearch();
    $("#rail").classList.remove("open");
    render();
    $("#view").scrollTop = 0;
  }

  function closeSearch() {
    S.q = ""; $("#q").value = ""; $("#sp").classList.remove("show");
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
        <span class="rb-title">${esc(f.code)}　${esc(f.title.split("：")[0])}</span>
        <div class="rb-prog"><i style="width:${pct}%"></i></div>
        <span class="rb-n">${num(s.n)} / ${num(f.steps.length)}</span>
        <button class="tlink" data-run-list>一览</button>
      </div>
      <div class="run-body">
        <div class="run-inner">
          <div class="run-target">
            <label>本次对象</label>
            <input id="targetInput" placeholder="客户全称 / 合同号 / 订单号 / 车号" value="${esc(target)}">
          </div>

          <div class="run-n">第 ${num(s.n)} 步 · ${esc(s.time)} · ${KIND[s.kind] || KIND.action}</div>
          <h2 class="run-h">${esc(s.title)}</h2>
          <p class="run-sum">${esc(s.summary)}</p>

          <section class="run-sec">
            <h4>现在做</h4>
            <ol class="run-acts">${s.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
          </section>

          <section class="run-sec">
            <h4>要交出</h4>
            <div class="kv">${s.outputs.map((o) => `<div class="kv-row">
              <div class="k">${esc(o.name)}</div>
              <div class="v">${esc(o.rule)}<small class="to">交给：${esc(o.to)}</small></div>
            </div>`).join("")}</div>
          </section>

          <section class="run-sec">
            <h4>做完核对（勾上即留痕）</h4>
            ${checksBlock(s, f, true)}
          </section>

          ${s.exceptions.length ? `<section class="run-sec">
            <h4>出岔子</h4>
            <table class="ex"><tbody>${s.exceptions.map((e) => `<tr><td>${esc(e.when)}</td><td>${esc(e.then)}</td><td class="who">${esc(e.who)}</td></tr>`).join("")}</tbody></table>
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
    let md = `## SOP 执行记录 · ${f.code}\n\n`;
    md += `- 流程：${f.title}\n- 版本：${f.version}\n- 对象：${target}\n- 日期：${date}\n- 执行人：施俊臣\n\n`;
    f.steps.forEach((s) => {
      const arr = store.checks[ckey(f.id, s.n)] || [];
      const n = arr.filter(Boolean).length;
      md += `### ${num(s.n)} ${s.title}　${n}/${s.checks.length}\n`;
      s.checks.forEach((c, i) => { md += `- [${arr[i] ? "x" : " "}] ${c}\n`; });
      md += "\n";
    });
    md += `> 由 SOP 生成 · ${date}\n`;
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
      store.closed[id] = !store.closed[id];
      save(); renderTree();
      return;
    }

    const flowBtn = t.closest("[data-flow]");
    if (flowBtn) { openFlow(flowBtn.dataset.flow, 1, "detail"); return; }

    if (t.closest("[data-list]")) {
      S.mode = S.mode === "list" ? "detail" : "list";
      render();
      return;
    }

    const rowStep = t.closest("tr[data-step]");
    if (rowStep) { S.step = Number(rowStep.dataset.step); S.mode = "detail"; render(); $("#view").scrollTop = 0; return; }

    const stepBtn = t.closest("[data-step]");
    if (stepBtn) {
      const same = S.mode === "detail" && S.step === Number(stepBtn.dataset.step);
      S.step = Number(stepBtn.dataset.step);
      if (S.run) { S.runStep = S.step; renderRun(); return; }
      S.mode = "detail";
      render();
      const bar = $(".stepbar"), v = $("#view");
      if (bar && !same) {
        const r = bar.getBoundingClientRect(), vr = v.getBoundingClientRect();
        v.scrollTop += r.top - vr.top - 6;
      }
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
      $("#rail").classList.remove("open");
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

    if (t.closest("#runBtn")) {
      if (S.view === "flow" && S.mode === "detail") openRun(S.step);
      else { S.view = "flow"; S.mode = "detail"; render(); }
      return;
    }

    if (t.closest("#menuBtn")) { $("#rail").classList.toggle("open"); return; }

    const resBtn = t.closest("[data-res]");
    if (resBtn && window.__res) {
      const r = window.__res[Number(resBtn.dataset.res)];
      if (r) r.go();
      return;
    }
    if (!t.closest(".search") && !t.closest("#sp")) closeSearch();

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
    if (e.target.id === "q") { S.q = e.target.value; renderSearch(); return; }
    if (e.target.id === "targetInput") { store.target[S.flowId] = e.target.value; save(); }
  });

  document.addEventListener("keydown", (e) => {
    const inInput = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    if (e.key === "Escape") {
      if (S.run) { closeRun(); return; }
      if (S.q) { closeSearch(); return; }
      $("#rail").classList.remove("open");
    }
    if (e.key === "/" && !inInput) { e.preventDefault(); $("#q").focus(); return; }
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
  render();
})();
