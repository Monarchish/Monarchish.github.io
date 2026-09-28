(function () {
  const tocEl = document.getElementById("toc");
  const contentEl = document.getElementById("manual-content");
  const searchEl = document.getElementById("search");
  const emptyEl = document.getElementById("empty");
  const tocToggle = document.getElementById("toc-toggle");

  function classifyLine(line) {
    if (/^⚠/.test(line)) return "warn";
    if (/^【.+】$/.test(line) || /（\s*【/.test(line)) return "placeholder";
    if (/^(Open |Write |Left Click |Ctrl )/i.test(line)) return "action";
    return "";
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderToc(chapters) {
    const frag = document.createDocumentFragment();
    Object.entries(chapters).forEach(([chapter, groups]) => {
      const details = document.createElement("details");
      details.className = "toc-chapter";
      details.open = chapter === "准入";
      details.innerHTML = `<summary>${escapeHtml(chapter)}</summary>`;
      Object.entries(groups).forEach(([group, items]) => {
        const g = document.createElement("details");
        g.className = "toc-group";
        g.open = true;
        g.innerHTML = `<summary>${escapeHtml(group)}</summary>`;
        items.forEach((item) => {
          const a = document.createElement("a");
          a.href = `#${item.id}`;
          a.textContent = item.leaf;
          a.dataset.id = item.id;
          g.appendChild(a);
        });
        details.appendChild(g);
      });
      frag.appendChild(details);
    });
    tocEl.appendChild(frag);
  }

  function renderSections(sections) {
    const frag = document.createDocumentFragment();
    sections.forEach((sec) => {
      const card = document.createElement("article");
      card.className = "section-card";
      card.id = sec.id;
      card.dataset.search = (sec.searchText || "").toLowerCase();

      const linesHtml = (sec.lines || [])
        .map((line) => {
          if (!line) return `<div class="step" style="border:0;padding:4px 0"></div>`;
          const cls = classifyLine(line);
          return `<div class="step ${cls}">${escapeHtml(line)}</div>`;
        })
        .join("");

      card.innerHTML = `
        <div class="section-meta">${escapeHtml(sec.chapter)} · ${escapeHtml(sec.group)}</div>
        <h2>${escapeHtml(sec.leaf)}</h2>
        <div class="steps">${linesHtml}</div>
      `;
      frag.appendChild(card);
    });
    contentEl.appendChild(frag);
  }

  function applySearch(q) {
    const query = q.trim().toLowerCase();
    const cards = contentEl.querySelectorAll(".section-card");
    let shown = 0;
    cards.forEach((card) => {
      const hit = !query || (card.dataset.search || "").includes(query);
      card.classList.toggle("is-hidden", !hit);
      if (hit) shown += 1;
    });
    emptyEl.classList.toggle("show", shown === 0);
  }

  function bindActiveLink() {
    const links = tocEl.querySelectorAll("a[data-id]");
    const map = new Map([...links].map((a) => [a.dataset.id, a]));
    const cards = [...contentEl.querySelectorAll(".section-card")];

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          links.forEach((a) => a.classList.remove("is-active"));
          map.get(id)?.classList.add("is-active");
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    cards.forEach((c) => io.observe(c));

    tocEl.addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      if (window.matchMedia("(max-width: 900px)").matches) {
        tocEl.classList.remove("is-open");
      }
    });
  }

  async function boot() {
    const res = await fetch("./data/manual.json");
    const data = await res.json();
    renderToc(data.chapters);
    renderSections(data.sections);
    bindActiveLink();

    searchEl?.addEventListener("input", () => applySearch(searchEl.value));
    tocToggle?.addEventListener("click", () => {
      tocEl.classList.toggle("is-open");
    });

    if (location.hash) {
      const el = document.querySelector(location.hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  window.SupportFutureHandbook = { boot };
})();
