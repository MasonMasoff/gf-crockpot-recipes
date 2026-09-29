---
description: Convert a recipe URL (or pasted text) into a GF pot dinner and open a PR
argument-hint: <recipe URL or text>
---

Add this recipe to the site: $ARGUMENTS

Follow "Adding a recipe" and "Gluten audit" in CLAUDE.md exactly:

1. Fetch the recipe (WebFetch for a URL). If it can't be fetched, ask the user to paste the text.
2. Run the gluten audit. If the dish can't be made gluten free, stop and explain instead of adding it.
3. Create a branch `recipe/<id>` from an up-to-date `main`.
4. Convert to house format, insert it, update the recipe counts, run `node check.js`, and fix all ERRORs.
5. Commit, push, and open a PR against `main`. The PR body must include:
   - the source link
   - a table of every swap (original, replacement, why)
   - the list of `gf: true` ingredients, as a checklist for the human to confirm labels
   - any check.js warnings left and why
6. Reply with the PR link and a short summary of swaps. Don't merge.
