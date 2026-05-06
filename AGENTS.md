# AGENTS.md — Landed Cost Calculator

Mobile-first PWA calculator for landed cost / profit / margin on goods imported to Russia.

## Stack

- Static HTML/CSS/Vanilla JS (ES Modules) — no build step, no dependencies, no package.json
- PWA via `manifest.json` + `service-worker.js`
- Deployed to GitHub Pages on push to `main`/`master` (`.github/workflows/pages.yml`)

## Commands

```
make serve    # python3 -m http.server 8080
make test     # node test-runner.js  (20 formula tests, exit 1 on failure)
```

Browser tests: open `tests.html` (imports JS modules directly, needs HTTP server — `file://` won't work due to CORS on ES modules).




## Testing

- **Node**: `make test` — 20 tests covering formula correctness, percent normalization, edge cases, Example A & B baselines.
- **Browser**: open `tests.html` via HTTP server — same tests plus formatter and validation tests using real module imports.
- Tolerance: ±0.01 for RUB values, ±0.0001 for margin rate.

## Conventions

- UI Russian language throughout
- Formula logic isolated in `formulas.js` — never duplicate math in UI code
- State updates via `state.js` subscription model; `app.js` renders on every state change
- All CSS uses custom properties from `tokens.css` for theming

# Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.