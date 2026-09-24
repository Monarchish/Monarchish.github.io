/* ============================================================
   03、设置 · 5.内容门锁.js
   ------------------------------------------------------------
   这是什么：站点内容的"门锁"——目录（卡片墙）所有人都能看，
   但点进具体操作手册内容时，要先输入访问密码。
   为什么要有它：网站面向全公司同事，正文需要脱敏——只有拿到
   密码的同事才能看具体流程。输对一次会记在浏览器里（localStorage），
   之后全站畅通，不用反复输。
   它怎么工作：
     · 1.站点主程序.js 的 loadContent() 开头会问它一句：
       非首页内容必须先过 SiteGate.request() 这道闸
     · 密码本身不写在代码里，代码里只存它的指纹（djb2 哈希）；
       输入的密码算出指纹对一下，对上就放行
     · 解锁标记存在 localStorage 键 support-future-gate-v1
       （想给新同事重新上锁：控制台执行
         localStorage.removeItem('support-future-gate-v1') ）
   它防不了谁：纯静态站的正文文件技术上仍可被直接下载，
   这把锁挡的是"随手点开"，不是有心人——真要硬脱敏得上服务端。
   ============================================================ */
(function () {
    "use strict";

    /* 访问密码的 djb2 指纹（base36）。换密码 = 用新密码算一个新指纹换上来：
       控制台执行 djb2("新密码") 即可，函数在本文件底部有导出。 */
    var PASS_HASH = "142i3vp";
    var STORE_KEY = "support-future-gate-v1";
    var MAX_HINT = 5;   /* 连续输错几次后额外提示找管理员 */

    function djb2(s) {
        var h = 5381;
        for (var i = 0; i < s.length; i++) h = ((h * 33) + s.charCodeAt(i)) >>> 0;
        return h.toString(36);
    }

    function readStore() {
        try { return localStorage.getItem(STORE_KEY) || ""; } catch (e) { return ""; }
    }
    function writeStore(v) {
        try { localStorage.setItem(STORE_KEY, v); } catch (e) { /* 无痕模式等：本次会话内放行即可 */ }
    }

    function isUnlocked() {
        return readStore() === PASS_HASH;
    }

    /* ---------- 遮罩界面（第一次用到才创建） ---------- */
    var mask = null;
    var inputEl = null;
    var errEl = null;
    var failCount = 0;
    var pendingAllow = null;   // 解锁后要继续的动作

    function ensureMask() {
        if (mask) return;
        mask = document.createElement("div");
        mask.className = "site-gate-mask";
        mask.setAttribute("role", "dialog");
        mask.setAttribute("aria-modal", "true");
        mask.setAttribute("aria-label", "内容访问授权");
        mask.innerHTML =
            '<div class="site-gate-card">' +
            '<svg class="site-gate-icon" viewBox="0 0 24 24" aria-hidden="true">' +
            '<rect x="4" y="10.5" width="16" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
            '<path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
            '<circle cx="12" cy="15.4" r="1.5" fill="currentColor"/>' +
            '<path d="M12 16.6v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
            "</svg>" +
            '<p class="site-gate-kicker">Internal · 内部资料</p>' +
            '<h2 class="site-gate-title">内容需要授权</h2>' +
            '<p class="site-gate-desc">操作手册正文仅限授权同事查看，请输入访问密码。</p>' +
            '<div class="site-gate-row">' +
            '<input class="site-gate-input" type="password" inputmode="numeric" autocomplete="off" placeholder="访问密码" aria-label="访问密码" />' +
            '<button class="site-gate-btn" type="button">解锁</button>' +
            "</div>" +
            '<p class="site-gate-err" aria-live="polite"></p>' +
            "</div>";
        document.body.appendChild(mask);

        inputEl = mask.querySelector(".site-gate-input");
        errEl = mask.querySelector(".site-gate-err");
        var btn = mask.querySelector(".site-gate-btn");

        function tryPass() {
            var v = (inputEl.value || "").replace(/\s+/g, "");
            if (!v) { inputEl.focus(); return; }
            if (djb2(v) === PASS_HASH) {
                failCount = 0;
                writeStore(PASS_HASH);
                close(true);
                return;
            }
            failCount += 1;
            errEl.textContent = failCount >= MAX_HINT
                ? "密码不对。忘记密码请联系发布这套手册的同事。"
                : "密码不对，请再试一次。";
            mask.classList.remove("is-shaking");
            void mask.offsetWidth;      // 重新触发抖动动画
            mask.classList.add("is-shaking");
            inputEl.select();
        }

        btn.addEventListener("click", tryPass);
        inputEl.addEventListener("keydown", function (e) {
            if (e.key === "Enter") tryPass();
        });
        mask.addEventListener("mousedown", function (e) {
            if (e.target === mask) {    // 点空白处收起（本次不放行）
                close(false);
            }
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && mask.classList.contains("is-open")) close(false);
        });
    }

    function open(onAllow) {
        pendingAllow = onAllow;
        ensureMask();
        errEl.textContent = "";
        inputEl.value = "";
        mask.classList.add("is-open");
        document.documentElement.classList.add("gate-locked");
        setTimeout(function () { inputEl.focus(); }, 60);
    }

    function close(allow) {
        mask.classList.remove("is-open", "is-shaking");
        document.documentElement.classList.remove("gate-locked");
        var cb = pendingAllow;
        pendingAllow = null;
        /* 等淡出动画走完再清显示，避免闪一下 */
        setTimeout(function () { if (!mask.classList.contains("is-open")) inputEl && inputEl.blur(); }, 300);
        if (allow && cb) cb();
    }

    /* ---------- 对外的闸门 ---------- */
    window.SiteGate = {
        isUnlocked: isUnlocked,
        /* 未解锁就弹锁；输对后自动继续 onAllow。已解锁则直接执行。 */
        request: function (onAllow) {
            if (isUnlocked()) {
                if (onAllow) onAllow();
                return;
            }
            open(onAllow);
        }
    };
    /* 换密码用：djb2("新密码") 算出新指纹 */
    window.SiteGate.djb2 = djb2;
})();
