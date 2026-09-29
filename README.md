# Gluten-Free Pot Dinners

14 celiac-safe Instant Pot and slow cooker dinners (comfort, Italian, Mexican, Asian). Each one makes 4 servings: dinner for 2 plus a round of leftovers.

- Every recipe has **both** Instant Pot and slow cooker steps.
- Every recipe has a **gluten-free checks** box, and ingredients that need a GF label are tagged.
- Tick recipes to build a **combined shopping list** grouped by aisle. You can check off items, copy the list or print it. Selections are saved in your browser.

## View locally

Open `index.html` in a browser. There's no build step.

## Host on GitHub Pages

1. Push this folder to a GitHub repo, with the files at the repo root.
2. Go to **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
3. The site will be live at `https://<username>.github.io/<repo>/`. [site](https://masonmasoff.github.io/gf-crockpot-recipes/)

## Adding a new recipe (with Claude)

Find any recipe online, even one that isn't gluten free, then open Claude Code in this folder and say something like:

> Add this recipe to the GF pot dinners site: <paste URL or the recipe text>

Claude will translate it into the house format:

1. **Make it celiac-safe.** Swap flour for cornstarch, soy sauce for GF tamari, and regular pasta or buns for GF ones. Drop or replace anything that can't be made GF, and flag every ingredient that needs a GF label (`gf: true`).
2. **Scale it to 4 servings** (dinner for 2 + leftovers), keeping enough thin liquid for a large Instant Pot.
3. **Write both methods** (Instant Pot and slow cooker), adjusting pressure time if the cut size or amount changed.
4. **Reuse existing ingredient names** so the shopping list merges correctly.
5. **Add the `source` link** plus a note on what changed from the original.

The full process and swap table are in `CLAUDE.md`. After any change, run `node check.js`. It fails on gluten-containing ingredients and warns on label-dependent ones that aren't flagged `gf: true`.

Handy extras you can mention: "make it spicier", "no Instant Pot version needed", "it's a side dish".

## Editing recipes

All recipe content is in `recipes.js`. Each ingredient's `n` (name) + `u` (unit) is its key for combining the shopping list, so use the same name across recipes (e.g. `"chicken broth"`, `"garlic"` with unit `"clove"`) for items to merge. Set `gf: true` on anything that needs a gluten-free label.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell + GF kitchen rules |
| `recipes.js` | Recipe data |
| `check.js` | GF and format linter (`node check.js`) |
| `CLAUDE.md` | Recipe-adding process and GF audit rules for Claude |
| `app.js` | Rendering, method tabs, filters, shopping list |
| `styles.css` | Styles (light/dark, mobile, print) |
