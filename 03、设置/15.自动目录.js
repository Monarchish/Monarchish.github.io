/* ============================================================
   03、设置 · 15.自动目录.js
   ------------------------------------------------------------
   干嘛的：让你以后加新工序，只需要在 GitHub 上把 .md 放进
   01、支援未来/对应分类/流程目录/ 里，网站自己就能发现它、
   出现在目录和侧栏里 —— 不用再改 1.站点主程序.js 的清单。

   原理：
     ① 向 GitHub 要一份仓库文件树（一次请求，公开仓库免登录）
     ② 找出所有「00 号索引文件」：01.02.MDG/01.02.00.MDG.md
        这种 .00. 开头的，就是每个流程的首页
     ③ 和现成清单比对，只补「新增的」
     ④ 补完重新画一次目录与侧栏

   安全边界（很重要）：
     · 它是**只增不减**的：清单里已有的条目一个都不动，
       只会把仓库里有、清单里没有的新流程补进来。
     · 联网失败（GitHub 抽风 / 断网 / 公司网络拦截）时会
       一声不吭地放弃，站点照常用原来的清单工作，不会白屏、
       不会少内容 —— 也就是说：没有它，一切照旧；有了它，
       只会多出新东西。
     · 结果缓存 30 分钟（localStorage），不会每次访问都请求。

   要改的话：
     · 仓库名/分支变了 → 改下面 REPO / BRANCH
     · 换内容目录      → 改 ROOT
   ============================================================ */
(function () {
    var REPO = "Monarchish/Monarchish.github.io";
    var BRANCH = "main";
    var ROOT = "01、支援未来";
    var CACHE_KEY = "support-future-automanifest-v1";
    var INDEX_KEY = "support-future-index-v2";   // 主程序的索引缓存，清单变了要清掉
    var TTL = 30 * 60 * 1000;                    // 缓存 30 分钟

    /* ---------- 缓存读写 ---------- */
    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var d = JSON.parse(raw);
            if (!d || Date.now() - d.t > TTL) return null;
            return d.list;
        } catch (e) { return null; }
    }
    function writeCache(list) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), list: list }));
        } catch (e) { /* 隐私模式等写不进去，无所谓 */ }
    }

    /* ---------- 路径 → 清单条目 ----------
       01、支援未来/01.准入/01.02.MDG/01.02.00.MDG.md
         → { folder: "01.准入/01.02.MDG", file: "01.02.00.MDG" } */
    function pathsToEntries(paths) {
        var byDir = {};
        paths.forEach(function (p) {
            if (p.indexOf(ROOT + "/") !== 0 || !/\.md$/.test(p)) return;
            var rest = p.slice(ROOT.length + 1);
            var parts = rest.split("/");
            if (parts.length < 3) return;            // 必须落在「分类/流程/文件」三层里
            var dir = parts[0] + "/" + parts[1];
            var name = parts[parts.length - 1].replace(/\.md$/, "");
            /* 只要三层深的文件（更深层是附件/子页，不建卡） */
            if (parts.length !== 3) return;
            if (!byDir[dir]) byDir[dir] = [];
            byDir[dir].push(name);
        });

        var out = [];
        Object.keys(byDir).forEach(function (dir) {
            var names = byDir[dir].sort();
            /* 优先取 .00. 索引文件；没有就用排序第一个顶上 */
            var pick = null;
            for (var i = 0; i < names.length; i++) {
                if (/^\d+\.\d+\.00\./.test(names[i])) { pick = names[i]; break; }
            }
            if (!pick) pick = names[0];
            out.push({ folder: dir, file: pick });
        });
        return out;
    }

    /* ---------- 主流程 ---------- */
    async function run() {
        if (typeof sidebarManifest === "undefined") return;   // 主程序没加载，不添乱
        var list = readCache();
        if (!list) {
            var url = "https://api.github.com/repos/" + REPO + "/git/trees/" + BRANCH + "?recursive=1";
            var res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
            if (!res.ok) return;                             // 拿不到就安静退场
            var data = await res.json();
            if (!data || !data.tree) return;
            list = pathsToEntries(data.tree.map(function (t) { return t.path; }));
            writeCache(list);
        }

        /* 只增不减：已有的不动，只补新的 */
        var known = {};
        sidebarManifest.forEach(function (m) { known[m.file] = 1; });
        var added = list.filter(function (e) { return !known[e.file]; });
        if (!added.length) return;
        added.forEach(function (e) { sidebarManifest.push(e); });

        /* 清单变了 → 清掉旧索引缓存，重画目录与侧栏 */
        try { localStorage.removeItem(INDEX_KEY); } catch (e) { }
        /* 关键：主程序把索引结果记在 _indexPromise 里（算过一次就不再算），
           不清掉它，新补的条目永远进不了索引、画不出卡片 */
        try { if (typeof _indexPromise !== "undefined") _indexPromise = null; } catch (e) { }
        if (typeof buildIndex === "function") {
            try {
                var idx = await buildIndex();
                if (typeof renderPortal === "function" && currentPageId === "home") renderPortal(idx);
            } catch (e) { /* 精修失败就让它保持清单版 */ }
        } else if (typeof renderPortal === "function" && currentPageId === "home") {
            renderPortal(manifestIndex());
        }
        if (typeof loadSidebar === "function") {
            try { await loadSidebar(); } catch (e) { }
        }
        /* 门厅也要知道分组没变多（分组是 5 大类，新增流程不动它，无需处理） */
    }

    /* 启动：等主程序把首屏画完再补，不影响打开速度；失败静默 */
    function boot() {
        setTimeout(function () {
            run().catch(function () { });
        }, 300);
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
