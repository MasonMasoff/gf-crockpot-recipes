#!/usr/bin/env node
// Lint recipes.js for gluten-free safety and house format. Usage: node check.js
// Exit code 1 on any ERROR. WARNs need a human decision (see CLAUDE.md).
const fs = require("fs");
const vm = require("vm");

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + "/recipes.js", "utf8") + "\n;this.RECIPES=RECIPES;this.AISLES=AISLES;", ctx);
const { RECIPES, AISLES } = ctx;

// Gluten-containing ingredients. Always an error unless the name says gluten-free/GF.
const GLUTEN = /\b(wheat|flour|bread ?crumbs?|panko|barley|rye|malt|beer|ale|lager|stout|couscous|orzo|farro|bulgur|semolina|seitan|spelt|kamut|udon|ramen|noodles?|pasta|spaghetti|penne|macaroni|lasagna|bun|pita|naan|crouton|cracker|biscuit|roux|breading|flour tortilla)s?\b/i;
const SAFE_WORD = /gluten[- ]?free|\bgf\b|rice (noodle|pasta)|corn (pasta|tortilla)|cornstarch|corn ?flour|rice flour|almond flour|coconut flour|tapioca|potato starch|arrowroot/i;

// Must be flagged gf: true because the label decides whether they are safe.
const NEEDS_LABEL = /(soy sauce|tamari|teriyaki|hoisin|oyster sauce|worcestershire|broth|stock|bouillon|sausage|chorizo|bacon|hot dog|meatball|seasoning|spice blend|taco|curry paste|fish sauce|bbq|barbecue|marinade|enchilada|cream of|condensed|gravy|rice mix|oats?|polenta|cornmeal|tortilla|sriracha|miso|liquid smoke|dressing)/i;
const ALWAYS_UNSAFE_VINEGAR = /malt vinegar/i;

let errors = 0, warns = 0;
const err = (r, m) => { errors++; console.log(`ERROR [${r.id}] ${m}`); };
const warn = (r, m) => { warns++; console.log(`WARN  [${r.id}] ${m}`); };

const seenIds = new Set();
// Canonical name+unit pairs used by other recipes, to suggest reuse.
const names = new Map();
for (const r of RECIPES) for (const g of r.ingredients || []) for (const i of g.items) {
  const k = i.n.toLowerCase();
  names.set(k, (names.get(k) || 0) + 1);
}

for (const r of RECIPES) {
  if (seenIds.has(r.id)) err(r, "duplicate id");
  seenIds.add(r.id);
  for (const f of ["title", "cuisine", "blurb", "best", "prep", "ipTotal", "scTotal", "serve", "leftovers"])
    if (!r[f]) err(r, `missing ${f}`);
  if (!r.source || !r.source.url || !r.source.note) warn(r, "missing source {name,url,note}");
  if (!Array.isArray(r.gf) || r.gf.length === 0) err(r, "missing gf-checks list (`gf: [...]`)");
  if (!r.ip || !r.ip.length) err(r, "missing Instant Pot steps");
  if (!r.sc || !r.sc.length) err(r, "missing slow cooker steps");

  for (const g of r.ingredients || []) for (const i of g.items) {
    const label = `"${i.n}"`;
    if (!AISLES.includes(i.a)) err(r, `${label} has invalid aisle`);
    if (typeof i.q !== "number" && i.q !== null) err(r, `${label} bad quantity`);
    if (ALWAYS_UNSAFE_VINEGAR.test(i.n)) err(r, `${label} is malt vinegar (barley). Use apple cider/white/red wine vinegar.`);
    if (GLUTEN.test(i.n) && !SAFE_WORD.test(i.n)) err(r, `${label} contains gluten. Swap for a GF version (name it "gluten-free …") or remove.`);
    // Needs-label items: only warn if not already flagged. Whole/plain produce, meat, dairy pass.
    if (NEEDS_LABEL.test(i.n) && !i.gf)
      warn(r, `${label} usually needs a GF label check but has no gf: true`);
    if (names.get(i.n.toLowerCase()) === 1 && RECIPES.length > 1)
      console.log(`INFO  [${r.id}] "${i.n}" only appears here. Reuse an existing name if one fits so the shopping list merges.`);
  }
  // Steps must not reintroduce gluten.
  for (const s of [...(r.ip || []), ...(r.sc || []), r.serve || ""]) {
    const t = s.replace(/<[^>]+>/g, "");
    if (/\ball[- ]purpose flour|\bflour\b(?![^.]*(?:corn|rice|tapioca|almond))/i.test(t) && !/gluten[- ]free|never|instead/i.test(t))
      warn(r, `step mentions flour: "${t.slice(0, 70)}…"`);
  }
}

console.log(`\n${RECIPES.length} recipes checked: ${errors} error(s), ${warns} warning(s).`);
process.exit(errors ? 1 : 0);
