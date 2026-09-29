# GF Pot Dinners: recipe workflow

Static site (no build). Recipe data lives in `recipes.js`; field docs are in the comment at its top. The audience is **celiac**, so "probably fine" is not good enough.

## Adding a recipe (follow in order)

1. **Get the source.** URL or pasted text. Keep the link for `source`.
2. **Gluten audit** (below). Classify every ingredient before writing any code.
3. **Report to the user before editing** if any ingredient was swapped, dropped, or can't be made safe. Offer GF suggestions (see swap table) and let them choose when there's more than one reasonable option.
4. **Convert to house format:** 4 servings (dinner for 2 + leftovers), both `ip` and `sc` steps, `gf` checks list, `source` with a `note` on what changed. Reuse existing ingredient `n`/`u` so the shopping list merges (`grep` recipes.js for the name first).
5. **Insert** in the right cuisine section (`// ─── COMFORT/ITALIAN/MEXICAN/ASIAN ───`).
6. **Run `node check.js`.** Fix all ERRORs. Resolve each WARN or consciously accept it.
7. **Update counts**: "14" in `README.md` and the lede in `index.html`.
8. **Verify** by opening `index.html` (or serving it) and confirming the card, recipe view and shopping list render.
9. Commit on a branch. Don't push to `main` without the user's OK.

## Gluten audit

Classify each ingredient as one of:

| Class | Meaning | Action |
| --- | --- | --- |
| **Contains gluten** | wheat, barley, rye, malt, flour, regular pasta/bread/buns/tortillas/panko/couscous/orzo, beer, soy sauce | Swap or remove. Never ship as written. |
| **Label-dependent** | broth/stock/bouillon, sausage, spice blends & seasoning packets, Worcestershire, teriyaki, hoisin, oyster/fish sauce, curry paste, BBQ sauce, enchilada sauce, cream-of-X soups, gravy mix, oats, corn tortillas, polenta, sriracha, miso, liquid smoke | Set `gf: true` and add a line to the recipe's `gf` list saying what to look for. |
| **Naturally GF** | plain produce, fresh meat/fish, plain dairy, rice, plain dried beans, spices bought single-ingredient, oils | No flag. |

Also read the **method**, not just the ingredients: flour dredging, roux, beer deglazing, soy in a marinade, "serve with bread", a thickener added late. Check cross-contact too (shared colander for pasta, toasted buns).

If unsure about an ingredient, treat it as label-dependent, never as safe.

### Swap table

| Original | GF swap |
| --- | --- |
| All-purpose flour (thickener) | Cornstarch slurry (added after pressure cooking) |
| Flour dredge | Cornstarch or GF all-purpose flour (e.g. Cup4Cup, King Arthur Measure for Measure) |
| Soy sauce | GF tamari (San-J, Kikkoman GF label) |
| Regular pasta | GF pasta (corn/rice blend holds up best). Cook separately, not in the pot |
| Breadcrumbs / panko | GF panko, crushed GF cornflakes/crackers, or omit |
| Beer | GF beer or extra broth + 1 tsp vinegar |
| Buns / bread | GF buns, or serve over rice/potatoes/lettuce wraps |
| Flour tortillas | Certified GF corn tortillas |
| Cream-of-X soup | Homemade: broth + cream + cornstarch |
| Couscous / orzo / farro | Rice, quinoa, or GF pasta |
| Malt vinegar | Apple cider or white vinegar |
| Worcestershire | US Lea & Perrins (GF label), or coconut aminos + splash of vinegar |
| Hoisin / teriyaki | GF-labeled versions, or tamari + honey + garlic |

### Can't be made GF

If the dish depends on gluten (seitan, dumplings, pierogi, noodle-based soups with no good substitute, beer-braised where beer is the point), say so and suggest the closest GF-friendly alternative rather than forcing it. Pressure cooker/slow cooker fit also matters: crisp/breaded dishes usually don't belong here.

## Suggesting GF alternatives to the user

When the user shares a non-GF recipe, lead with a short verdict: **GF as-is / GF with label checks / needs swaps / not a good fit**. Then list swaps in a table (original, swap, why). Keep brand names as examples only; the site tells readers to confirm labels.

## Rules

- Don't invent sources. If the recipe came from the user's text with no URL, set `source` note accordingly.
- Don't remove or weaken existing `gf` warnings.
- Brand claims (e.g. "Lea & Perrins US is GF") must be ones you're confident about; otherwise say "look for a GF label".
