# Induction Card — rules for any AI or developer editing this app

Induction Card is an offline PWA for anaesthetists in Malaysia (phone first, also iPad and desktop).
The owner is a practising anaesthetist who designs every change. **Read this whole file before editing.**
If a request conflicts with this file, stop and ask the owner.

## 1. How we work with the owner

- **"Grill me"** = before coding, reply with short numbered questions, each with a recommendation
  (`*Recommend: …*`). The owner answers "Yes to all" or names exceptions. Do not start building until answered.
- **Mocks first** for any visual change: render 3–5 options as screenshots at iPhone width, then build the one chosen.
- **Small, specific changes only.** Never "refactor", "clean up", rename, reorganise or restyle things you were not asked to touch.
- Plain English in replies. Say what changed for the user; skip internal jargon.

## 2. Clinical safety rules (non-negotiable)

1. **MOH Malaysia / local guidance first** (different demographic). International sources second; show differences side by side, never silently merge.
2. **Never invent** doses, maximums, thresholds, ratios, citations or pregnancy/renal/hepatic classifications. If no source is in hand, ask the owner to upload it.
3. **New or changed clinical numbers/advice = critical change:**
   - add a `const X_CHECKED = false;` flag and a yellow `DRAFT — …` banner on the card,
   - add an **undated** entry to the Values sheet (`VGROUPS`) and a changelog entry in `CHANGES` ending `(draft)`,
   - deploy to the dev branch only and wait for the owner to type **"Check and pass"**.
   - On "Check and pass": flag → `true   // checked by author <date>;`, date the Values entry, `(draft)` → `(checked)`, bump patch version, run all tests, deploy.
4. Layout / wording-only changes (no clinical meaning changed) may be deployed directly after tests pass.
5. In risk matrices, `·` means **"no specific note here" — never "safe"**. Only ✓/⚠/✗ cells that trace to a written source sentence.
6. No hospital names, author names or patient identifiers anywhere. English only.
7. Numbers always stay as text next to any picture — a visual never replaces the number.

## 3. Design system (keep it — this is what makes the app)

- **One file:** `docs/index.html` (HTML + CSS + JS, no framework, no build step, no external runtime calls; CSP `connect-src 'self'`). Service worker `docs/sw.js`. Fonts in `docs/fonts/`.
- **Font:** IBM Plex Sans everywhere. The digital "DSEG7" monitor font is **only** for Home (monitor tiles, quick answers, clock) and the relaxant timer. Monospace only for the Home ticker and version numbers.
- **Type scale inside cards:** 13 / 14 / 15 / 16 / 17 px. **Bold dose numbers use exactly three sizes:** 20 px (the calculated answer), 17 px (dose inside a crisis step), 16 px (reference / secondary). Tests enforce this.
- **Colours:** use the CSS variables, never hard-coded new palettes. Section colour `--gc` (General `--g-airway` amber, Obstetric `--g-obs` pink, Regional `--g-spinal` teal, Paeds `--g-paeds` green, Pre-op `--g-premed` blue, Transplant `--g-tx` purple, Emergencies `--g-emerg` red). Status: `--warn-*`, `--danger-*`. Drug colours: bupivacaine `--sy-bupi` pink, morphine `--sy-mor` amber, fentanyl `--sy-fen` blue; ropivacaine purple, lignocaine teal.
- **Light and dark mode** must both work (check `prefers-color-scheme` and `data-theme`).
- **Declutter:** short visible text; secondary text goes into `<details class="ndet">` collapsibles. Big visual "hook", few words.
- **Established visual patterns — reuse them, don't invent new styles:**
  - band ruler + pin (LSCS / non-obstetric spinal height bands),
  - syringe drawing with smooth slide animation (`lscsSyringe`, `lsyAnimate`),
  - gauge bar with 80 % / 100 % lines (LA calculator), step gauges (`stepGauge`: Apfel, STOP-BANG), opioid total bar,
  - stop/restart timeline (anticoagulants), fasting timeline to induction, MAC-by-age curve,
  - drug × patient matrix (intra-op analgesia), one-line patient bar with tap-open weight scale (`ptScale`).
- **Layouts:** phone < 700 px (big touch tiles with − / +); iPad 700–1099 px (220 px right column, vertical rows, − / + kept on touch); desktop ≥ 1100 px (patient panel under the left menu; mouse = no − / +, ↑ ↓ keys step).
- **No jumping:** the card being edited must stay still on screen (see `LASTEL` anchoring in `renderNow`); reserve space so text changes don't shift layout.
- Every new visual: check iPhone 13, iPhone SE, iPad portrait/landscape, desktop 1366, light + dark, no horizontal overflow.

## 4. Code map (search for these names)

- Patient state `S`; per-case clinical keys list `CLIN` (add new per-case inputs there so "new patient" resets them).
- Weights `wts()` (TBW / IBW / LBW / AdjBW / BMI). Number helpers `sig`, `dz`, `rng`, `numV`, `numIn`.
- Card builders: `gaCards`, `raCards`, `pCards`, `obsCards`, `txCards`; dose tables `GT`, `FT`, `R`, `GD`.
- Card registry `GROUPS` (tabs, order), stable ids `CARD_IDS`, search `SEARCH_EXTRA`.
- Values sheet `VGROUPS`; changelog `CHANGES`; draft flags `*_CHECKED`; source line `src(...)`.
- Dose-number auto-highlighter skips selectors in `DOSE_SKIP`.

## 5. Tests — the safety net

Run **every file in `tests/`** before any deploy (Playwright + Chromium) — new suites get added, so never use a fixed list:

```
for t in tests/*.test.js; do NODE_PATH=$(npm root -g) node "$t"; done
```

A suite fails if its exit code ≠ 0 **or any output line starts with `✗`** (count `grep -c '^✗'`, not every ✗ character).

- **Never edit, skip or loosen a test to make it pass** without the owner's explicit approval. If a redesign legitimately changes card text, register it (`REDESIGNED` = every old word kept; `REWRITTEN` = must cite its source) and explain why in a comment.
- Add a test for every new calculator or rule (worked examples with known answers).
- GitHub Actions (`.github/workflows/max-dose.yml`) re-runs everything on push — keep it.

## 6. Release steps

1. **Pull the latest `claude/cool-cray-mdyw33` first** (other tools may have released since), then work on a new feature branch from it. Only one AI/developer edits at a time.
2. Bump the version in **both** `APP_VERSION` (index.html) and `CACHE` (sw.js) — they must match.
3. Add a `CHANGES` entry (plain-English, what the user sees).
4. Run all tests; **stop on any failure** (check each step explicitly — do not rely on `set -e`).
5. Commit, merge into `claude/cool-cray-mdyw33`, push.
6. Deploy: copy `docs/index.html` and `docs/sw.js` into the **induction-card** repo (GitHub Pages, branch `main`), commit, push. Only for layout changes or after "Check and pass".
7. Send the owner screenshots (phone, and iPad/desktop if layout changed).

## 7. Sources already in use (cite, don't guess)

MOH Pain Management Handbook 3rd ed.; MOH Pain Management in O&G Guidelines 2023; MOH PBM consensus 2024; Malaysian NAG 2024; local blood bank, OAS, obstetric, paediatric and transplant protocols; Association of Anaesthetists (TIVA 2019, monitoring 2021, steroids 2020, QRH 2023); ANZCA FPM opioid equivalence 2025; FPM Surgery & Opioids 2021; multisociety buprenorphine RAPM 2021; BJA Education 2023 (non-obstetric surgery in pregnancy); FDA 2020 / MHRA 2023 NSAID notices; Eleveld 2017/2018; ASRA 5th ed.; Mapleson 1996.
