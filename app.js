(() => {
  const CUISINES = ["All", "Comfort", "Italian", "Mexican", "Asian"];
  const UNIT_PLURAL = { cup: "cups", clove: "cloves", can: "cans", jar: "jars", slice: "slices", bunch: "bunches", bag: "bags" };
  const FRACTIONS = [[0, ""], [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [5 / 6, "⅚"], [1, ""]];
  // Extra "how much to buy" hints for summed items, keyed by item name.
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const BUY_HINTS = {
    "chicken broth": (q) => `≈ ${plural(Math.ceil(q / 4), "32-oz carton")}`,
    "beef broth": (q) => `≈ ${plural(Math.ceil(q / 4), "32-oz carton")}`,
    "heavy cream": (q) => `≈ ${plural(Math.ceil(q / 2), "pint")}`,
    garlic: (q) => `≈ ${plural(Math.ceil(q / 10), "head")}`,
  };

  // ---------- storage (per-browser convenience only) ----------
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
    },
  };

  const state = {
    filter: "All",
    method: store.get("gf.method", "ip"),
    selected: new Set(store.get("gf.selected", [])),
    checked: new Set(store.get("gf.checked", [])),
  };

  // ---------- formatting ----------
  function fmtQty(q) {
    if (q == null) return "";
    let whole = Math.floor(q);
    const frac = q - whole;
    let best = FRACTIONS[0];
    for (const f of FRACTIONS) if (Math.abs(frac - f[0]) < Math.abs(frac - best[0])) best = f;
    if (Math.abs(frac - best[0]) > 0.03) return String(Math.round(q * 10) / 10);
    if (best[0] === 1) { whole += 1; best = FRACTIONS[0]; }
    if (whole === 0) return best[1] || "0";
    return `${whole}${best[1]}`;
  }

  function unitLabel(u, q) {
    if (!u) return "";
    return q != null && q > 1 && UNIT_PLURAL[u] ? UNIT_PLURAL[u] : u;
  }

  function nameLabel(ing, q) {
    if (!ing.u && q != null && q > 1) return ing.pl || `${ing.n}s`;
    return ing.n;
  }

  function ingText(ing, q = ing.q) {
    const parts = [];
    if (q != null) parts.push(fmtQty(q));
    const unit = unitLabel(ing.u, q);
    if (unit) parts.push(ing.sz ? `${unit} (${ing.sz})` : unit);
    parts.push(nameLabel(ing, q));
    return parts.join(" ");
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const methodName = (m) => (m === "ip" ? "Instant Pot" : "Slow Cooker");

  // ---------- recipes ----------
  function renderFilters() {
    const el = document.getElementById("filters");
    el.innerHTML = CUISINES.map((c) =>
      `<button type="button" class="chip" aria-pressed="${state.filter === c}" data-filter="${c}">${c}</button>`
    ).join("");
    el.onclick = (e) => {
      const b = e.target.closest("[data-filter]");
      if (!b) return;
      state.filter = b.dataset.filter;
      renderFilters();
      applyFilter();
    };
  }

  function applyFilter() {
    document.querySelectorAll("[data-cuisine]").forEach((node) => {
      node.hidden = state.filter !== "All" && node.dataset.cuisine !== state.filter;
    });
  }

  function renderCards() {
    document.getElementById("card-grid").innerHTML = RECIPES.map((r, i) => `
      <div class="card" data-cuisine="${r.cuisine}">
        <div class="card-top">
          <span class="tag tag-${r.cuisine.toLowerCase()}">${r.cuisine}</span>
          <span class="num">${String(i + 1).padStart(2, "0")}</span>
        </div>
        <a class="card-title" href="#${r.id}">${esc(r.title)}</a>
        <dl class="meta">
          <div><dt>Prep</dt><dd>${esc(r.prep.replace(/ \(.*\)/, ""))}</dd></div>
          <div><dt>IP</dt><dd>${esc(r.ipTotal)}</dd></div>
          <div><dt>Slow</dt><dd>${esc(r.scTotal.replace(" on low", ""))}</dd></div>
        </dl>
        <label class="add">
          <input type="checkbox" data-select="${r.id}" ${state.selected.has(r.id) ? "checked" : ""}>
          Add to list
        </label>
      </div>`).join("");
  }

  function renderRecipes() {
    document.getElementById("recipe-list").innerHTML = RECIPES.map((r) => `
      <article class="recipe" id="${r.id}" data-cuisine="${r.cuisine}">
        <header class="recipe-head">
          <div>
            <span class="tag tag-${r.cuisine.toLowerCase()}">${r.cuisine}</span>
            <h3>${esc(r.title)}</h3>
            <p class="blurb">${esc(r.blurb)}</p>
          </div>
          <label class="add">
            <input type="checkbox" data-select="${r.id}" ${state.selected.has(r.id) ? "checked" : ""}>
            Add to list
          </label>
        </header>

        <dl class="facts">
          <div><dt>Serves</dt><dd>4 (2 dinners for 2)</dd></div>
          <div><dt>Active prep</dt><dd>${esc(r.prep)}</dd></div>
          <div><dt>Instant Pot</dt><dd>${esc(r.ipTotal)}</dd></div>
          <div><dt>Slow cooker</dt><dd>${esc(r.scTotal)}</dd></div>
          <div><dt>Best in</dt><dd>${esc(r.best)}</dd></div>
        </dl>

        <aside class="gf-box" aria-label="Gluten-free warnings">
          <h4><span aria-hidden="true">⚠</span> Gluten-free checks</h4>
          <ul>${r.gf.map((g) => `<li>${g}</li>`).join("")}</ul>
        </aside>

        <div class="recipe-body">
          <div class="ingredients">
            <h4>Ingredients</h4>
            ${r.ingredients.map((g) => `
              ${g.title ? `<h5>${esc(g.title)}</h5>` : ""}
              <ul>${g.items.map((ing) => `
                <li>
                  <span>${esc(ingText(ing))}${ing.prep ? `<span class="prep">, ${esc(ing.prep)}</span>` : ""}${ing.opt ? ' <span class="prep">(optional)</span>' : ""}${ing.q == null && !ing.prep ? ' <span class="prep">(as desired)</span>' : ""}</span>
                  ${ing.gf ? '<span class="gf-badge" title="Must be labeled gluten free">GF label</span>' : ""}
                </li>`).join("")}
              </ul>`).join("")}
          </div>

          <div class="method">
            <div class="tabs" role="tablist" aria-label="Cooking method">
              ${["ip", "sc"].map((m) => `
                <button type="button" role="tab" class="tab" data-method="${m}" aria-selected="${state.method === m}">${methodName(m)}</button>`).join("")}
            </div>
            ${["ip", "sc"].map((m) => `
              <ol class="steps" data-steps="${m}" ${state.method === m ? "" : "hidden"}>
                ${r[m].map((s) => `<li>${s}</li>`).join("")}
              </ol>`).join("")}
            <div class="notes">
              <p><strong>Serve:</strong> ${esc(r.serve)}</p>
              <p><strong>Leftovers:</strong> ${esc(r.leftovers)}</p>
            </div>
            ${r.source ? `<p class="source"><strong>Checked against:</strong> <a href="${esc(r.source.url)}" target="_blank" rel="noopener">${esc(r.source.name)}</a>. ${r.source.note}</p>` : ""}
          </div>
        </div>
        <a class="to-top" href="#recipes">↑ All recipes</a>
      </article>`).join("");
  }

  function setMethod(m) {
    state.method = m;
    store.set("gf.method", m);
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.method === m));
    document.querySelectorAll("[data-steps]").forEach((ol) => { ol.hidden = ol.dataset.steps !== m; });
  }

  // ---------- shopping list ----------
  function buildList() {
    const items = new Map();
    for (const r of RECIPES) {
      if (!state.selected.has(r.id)) continue;
      for (const g of r.ingredients) for (const ing of g.items) {
        const key = `${ing.n}|${ing.u}|${ing.sz || ""}`;
        let it = items.get(key);
        if (!it) {
          it = { key, ing, q: 0, anyNull: false, gf: false, opt: true, from: [] };
          items.set(key, it);
        }
        if (ing.q == null) it.anyNull = true; else it.q += ing.q;
        it.gf = it.gf || !!ing.gf;
        it.opt = it.opt && !!ing.opt;
        if (!it.from.includes(r.title)) it.from.push(r.title);
      }
    }
    const byAisle = new Map(AISLES.map((a) => [a, []]));
    for (const it of items.values()) byAisle.get(it.ing.a).push(it);
    for (const list of byAisle.values()) list.sort((a, b) => a.ing.n.localeCompare(b.ing.n));
    return byAisle;
  }

  function itemLine(it) {
    const q = it.q > 0 ? it.q : null;
    let text = q != null ? ingText(it.ing, q) : it.ing.n;
    if (it.anyNull && q != null) text += " + extra";
    if (q == null) text += " (as desired)";
    const hint = q != null && BUY_HINTS[it.ing.n] ? BUY_HINTS[it.ing.n](q) : "";
    return { text, hint };
  }

  function renderShopping() {
    const body = document.getElementById("shopping-body");
    const count = state.selected.size;
    const navCount = document.getElementById("nav-count");
    navCount.hidden = count === 0;
    navCount.textContent = count;

    if (count === 0) {
      body.innerHTML = `<div class="empty">No recipes selected yet. Tick <strong>“Add to list”</strong> on any recipe and its ingredients are added and combined here.</div>`;
      return;
    }

    const byAisle = buildList();
    const chosen = RECIPES.filter((r) => state.selected.has(r.id));
    body.innerHTML = `
      <p class="chosen">For <strong>${count}</strong> recipe${count > 1 ? "s" : ""}: ${chosen.map((r) => `<a href="#${r.id}">${esc(r.title)}</a>`).join(" · ")}</p>
      <p class="legend"><span class="gf-badge">GF label</span> means buy a version labeled gluten free.</p>
      <div class="aisles">
        ${[...byAisle].filter(([, l]) => l.length).map(([aisle, list]) => `
          <div class="aisle ${aisle.startsWith("Staples") ? "staples" : ""}">
            <h3>${esc(aisle)}</h3>
            <ul>
              ${list.map((it) => {
                const { text, hint } = itemLine(it);
                const checked = state.checked.has(it.key);
                return `<li>
                  <label class="${checked ? "done" : ""}">
                    <input type="checkbox" data-check="${esc(it.key)}" ${checked ? "checked" : ""}>
                    <span class="item-main">
                      <span>${esc(text)}${it.opt ? ' <span class="prep">(optional)</span>' : ""}</span>
                      ${it.gf ? '<span class="gf-badge">GF label</span>' : ""}
                    </span>
                    <span class="item-sub">${hint ? `${esc(hint)} · ` : ""}${esc(it.from.join(", "))}</span>
                  </label>
                </li>`;
              }).join("")}
            </ul>
          </div>`).join("")}
      </div>`;
  }

  function listAsText() {
    const lines = ["GLUTEN-FREE SHOPPING LIST", ""];
    for (const [aisle, list] of buildList()) {
      if (!list.length) continue;
      lines.push(aisle.toUpperCase());
      for (const it of list) {
        const { text, hint } = itemLine(it);
        lines.push(`[ ] ${text}${it.gf ? " (GF LABEL)" : ""}${hint ? ` — ${hint}` : ""}`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  function toggleSelect(id, on) {
    if (on) state.selected.add(id); else state.selected.delete(id);
    store.set("gf.selected", [...state.selected]);
    document.querySelectorAll(`[data-select="${id}"]`).forEach((cb) => { cb.checked = on; });
    renderShopping();
  }

  // ---------- events ----------
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.select) toggleSelect(t.dataset.select, t.checked);
    if (t.dataset.check) {
      if (t.checked) state.checked.add(t.dataset.check); else state.checked.delete(t.dataset.check);
      store.set("gf.checked", [...state.checked]);
      t.closest("label").classList.toggle("done", t.checked);
    }
  });

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-method]");
    if (tab) setMethod(tab.dataset.method);
  });

  document.getElementById("copy-list").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    if (!state.selected.size) return;
    try {
      await navigator.clipboard.writeText(listAsText());
      btn.textContent = "Copied ✓";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => { btn.textContent = "Copy list"; }, 1800);
  });

  document.getElementById("print-list").addEventListener("click", () => {
    document.body.classList.add("print-list");
    window.print();
    document.body.classList.remove("print-list");
  });

  document.getElementById("clear-list").addEventListener("click", () => {
    state.selected.clear();
    state.checked.clear();
    store.set("gf.selected", []);
    store.set("gf.checked", []);
    document.querySelectorAll("[data-select]").forEach((cb) => { cb.checked = false; });
    renderShopping();
  });

  renderFilters();
  renderCards();
  renderRecipes();
  renderShopping();
})();
