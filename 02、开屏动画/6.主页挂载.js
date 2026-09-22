/* ============================================================
   主页开屏动画 · 挂载脚本
   ------------------------------------------------------------
   它只做四件事：
     1. 确认这次访问需要播动画（判断已经在 index.html 的 <head> 里做完）
     2. 往 #intro-overlay 里塞一个铺满全屏的 iframe 播放动画
     3. 收到动画页发来的 done 消息后，淡出并移除覆盖层，露出主页正文
     4. 异常兜底：动画加载失败或卡住时自动收场，绝不让主页被卡死
   想调参数，改下面 CONFIG 里的值即可。
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = {
    /* 动画页地址，相对于本文件所在目录的上一级（站点根目录） */
    frameUrl: "02、开屏动画/index.html?embed=1",

    /* 是否每次会话只播一次：true = 刷新不再重复播，重开标签页才播 */
    oncePerSession: true,

    /* 会话标记的键名。留空则跟随 index.html <head> 里定义的那个 */
    sessionKey: window.__INTRO_SESSION_KEY || "act54-intro-played",

    /* 与动画页约定的消息标记，必须和 02、开屏动画/1.动画播放器.js 里的一致 */
    messageSource: "ak-act54-intro",

    /* 覆盖层淡出时长（毫秒），要和 7.主页覆盖层样式.css 里的 transition 保持一致 */
    fadeOutMs: 600,

    /* 兜底一：这么久还没收到"资源就绪"消息就强制收场（毫秒） */
    loadTimeoutMs: 20000,

    /* 兜底二：资源就绪后，这么久还没等到"播放完成"消息也强制收场（毫秒） */
    playTimeoutMs: 20000,
  };

  var root = document.documentElement;
  var overlay = document.getElementById("intro-overlay");
  var params = new URLSearchParams(location.search);
  var DEBUG = params.get("debug") === "1";

  function log() {
    if (DEBUG) console.log.apply(console, ["[开屏动画]"].concat([].slice.call(arguments)));
  }

  /* 这次访问不播动画：把覆盖层立刻摘掉，主页照常使用 */
  if (!root.classList.contains("intro-on") || params.get("intro") === "0") {
    if (overlay) overlay.remove();
    root.classList.remove("intro-on");
    log("本次跳过（已播过或 ?intro=0）");
    return;
  }

  if (!overlay) {
    log("找不到 #intro-overlay，放弃播放");
    root.classList.remove("intro-on");
    return;
  }

  var finished = false;
  var timer = 0;

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = 0;
  }

  function rememberPlayed() {
    if (!CONFIG.oncePerSession) return;
    try {
      sessionStorage.setItem(CONFIG.sessionKey, "1");
    } catch (e) { /* 隐私模式下不可写，忽略即可 */ }
  }

  /* 收场：淡出覆盖层 → 移除节点 → 解锁主页滚动 */
  function close(reason) {
    if (finished) return;
    finished = true;
    clearTimer();
    removeEventListener("message", onMessage);
    log("收场：", reason);

    // 动画页已经没用了，切到空白页，省得它在后台继续跑 60Hz 的渲染循环
    try { frame.src = "about:blank"; } catch (e) { /* 忽略 */ }

    overlay.classList.add("is-closing");
    setTimeout(function () {
      overlay.remove();
      root.classList.remove("intro-on");
      log("覆盖层已移除，主页可交互");
    }, CONFIG.fadeOutMs + 60);
  }

  /* 监听动画页发来的消息 */
  function onMessage(event) {
    var data = event.data;
    if (!data || data.source !== CONFIG.messageSource) return;

    if (data.type === "ready") {
      log("动画资源就绪");
      clearTimer();
      timer = setTimeout(function () { close("播放等待超时"); }, CONFIG.playTimeoutMs);
      return;
    }

    if (data.type === "done") {
      rememberPlayed();
      close("动画播放完成");
    }
  }

  /* 建 iframe 并开始播放 */
  var frame = document.createElement("iframe");
  frame.id = "intro-frame";
  frame.title = "开场动画";
  frame.setAttribute("allow", "autoplay");
  overlay.appendChild(frame);
  addEventListener("message", onMessage);

  timer = setTimeout(function () { close("资源加载超时"); }, CONFIG.loadTimeoutMs);

  /* 带上 ?debug=1 时，允许动画页把消息转发给主页，方便在控制台里看清流程 */
  frame.src = CONFIG.frameUrl;
  log("开始播放", CONFIG.frameUrl);
})();
