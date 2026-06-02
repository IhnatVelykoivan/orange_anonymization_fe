# QA Findings — Final regression pass

> Branch: `test/final-regression-coverage` (cherry-picked the wizard E2E suite
> onto current `develop` #48)
> Run: `npm run build` ✓ · `npm run test:run` → 223 passed ·
> `npm run test:e2e` → 22 passed (wizard 15 + landing 3 + contact 2 + login 2)
> Artefacts: `playwright-report/index.html` (open with `npm run test:e2e:report`)
> Coverage: `npm run test:coverage:all` → `coverage-combined/index.html`

This document is the source of truth for what this regression pass _found_ — real
prod bugs, process gaps, plus places where the Trello AC describes behaviour that
does not exist in the current code.

✅ **Resolved (backend):** Bug #10 — "Generate Synthetic Data" 500 in production was
a **missing DB migration** (`synthetic_datasets` table never created on Heroku — no
release phase), confirmed via logs and fixed by running the migration. Not a FE bug;
the suite missed it because unit/E2E mock the synthetic service/routes. See the
finding for the confirmed root cause, the migrations-on-deploy fix, and the one real
FE follow-up (surface the regenerate error).

Bug #7 (build-breaker) is **fixed in this branch**. Bug #1 (endless spinner) was
**fixed upstream in develop #53** and merged in — its reproducer is now a normal
passing regression guard. The remaining De-ID findings (#2–#6) are spec/UX
discrepancies deferred to the next sprint.

---

## Final regression pass — new findings

### Bug #7 — [CRITICAL · FIXED in this branch] Dashboard slice dropped from the root reducer

**Severity:** critical — broke `npm run build` (`tsc -b`) for everyone and crashed
the Dashboard page at runtime (a demo-critical flow).

**Where:**

- [src/store/store.ts](../src/store/store.ts) — `combineReducers`
- [src/pages/Dashboard/useDashboard.ts:22](../src/pages/Dashboard/useDashboard.ts) — `useSelector((state) => state.dashboard)`

**Root cause:** PR #48 (`Feat/dashboard metrics filters recalc`) added the new
`analyses` slice but, instead of inserting it as a new line, **replaced** the
existing `dashboard: dashboardSlice` registration:

```diff
 const rootReducer = combineReducers({
   jobs: persistReducer(persistConfig, jobsSlice),
   auth: authSlice,
-  dashboard: dashboardSlice,
+  analyses: analysesSlice,
   syntheticResult: syntheticResultSlice,
 });
```

`import dashboardSlice` and `useDashboard`'s `state.dashboard` selector were left
in place, so `tsc -b` failed (TS6133 unused import + TS2339 `dashboard` missing on
`RootState`) and `state.dashboard` was `undefined` at runtime → the page threw on
destructuring `{ data, loading, error }`.

**Why review missed it:** there is **no PR-level CI** — see Finding #8. Nothing
runs `tsc`/`build`/`test` before merge, and #48's branch in isolation built fine.

**Fix (this branch, commit `fix(dashboard): re-register dashboard slice dropped in #48`):**
re-added `dashboard: dashboardSlice` to `combineReducers` (one line; `analyses`
stays). `npm run build` is green again.

**Regression guard:** [src/test/store/rootReducer.test.ts](../src/test/store/rootReducer.test.ts)
asserts every selected slice (`jobs`, `auth`, `dashboard`, `analyses`,
`syntheticResult`) is registered — this test fails on the broken #48 state and
would have caught it.

> Coordination note: Ihor is reworking the Dashboard / All-Analyses pages and has
> a local fix too. This branch carries the fix as an isolated commit so it drops
> cleanly on rebase if his lands in `develop` first.

### Finding #8 — [SYSTEMIC] No PR-level CI gate (build / lint / test)

[.github/workflows/deploy.yml](../.github/workflows/deploy.yml) only deploys on
push to `develop`; `npm run build` runs **inside** the Docker image
([Dockerfile:18](../Dockerfile)) at deploy time. No workflow runs `tsc -b` /
`eslint` / `vitest` / `playwright` on pull requests, so a broken build (Bug #7)
can be merged with no automated signal — it only surfaces when the develop deploy
fails.

**Suggested fix:** add a `pull_request` workflow running `npm ci` →
`npm run lint` → `npm run build` → `npm run test:run` (optionally
`npm run test:e2e`). Single highest-leverage process fix from this regression pass.

### Finding #9 — Landing assistant widget not implemented

Final-sprint scope mentions "landing page / assistant widget **if already
implemented**". As of `develop` #48 there is no assistant/chat/widget code
(`git grep -i 'assistant\|widget\|chat'` → nothing in `src/`). The landing page
itself is now covered by [e2e/landing.spec.ts](../e2e/landing.spec.ts) (renders +
public navigation to Contact / Login). No assistant test added — nothing to test yet.

---

### Bug #10 — [CRITICAL · backend · ROOT CAUSE CONFIRMED, fix in progress] "Generate Synthetic Data" 500 in production

`POST /api/synthetic-data/generate` returned **500 Internal Server Error** on the
deployed environment (observed 2026-06-02, FE `…-d92cbccc60f3` → BE
`…-ea5bfb80acf3`). **Not a frontend bug** — the FE request was structurally valid
all along.

**Confirmed root cause (from Heroku logs, not FE inference):**

```
ERROR [ExceptionsHandler] Table 'q2fg6vakb2uoxa0t.synthetic_datasets' doesn't exist
QueryFailedError: Table 'q2fg6vakb2uoxa0t.synthetic_datasets' doesn't exist
```

The `synthetic_datasets` table does not exist in the production JawsDB. The
migration that creates it (`1779200000000-CreateSyntheticDatasetsTable`) shipped
with the deploy, but the backend has **no release phase / `migrationsRun` / boot-time
`runMigrations`** and `synchronize` is `false`, so the migration was never executed
against prod. The synchronous `datasetRepository.save()` therefore throws
`ER_NO_SUCH_TABLE` → unhandled → generic 500. (The same failure also fired every
10 min in `SyntheticDataCleanupService`.) De-Identify works because its older
`CreateJobsTable` migration was run on an earlier deploy.

**Fix:** backend ran the migration manually
(`typeorm migration:run -d dist/database/data-source.js`) to unblock prod, and the
permanent fix is a Heroku **release phase** (`release: npm run migration:run:prod`)
so every future migration runs on deploy. Owned by backend; tracked there.

> Correction: an earlier draft of this finding floated a `compliance_framework`
> case mismatch (form sends `'hipaa'`, regenerate sends `'HIPAA'`) as a possible
> trigger — that was **wrong** (an enum mismatch would be a 400, not a 500). The
> casing is at most a minor cleanup, not the cause.

**Genuine FE follow-up (independent of the 500):** `onRegenerate` only
`console.error`s on failure — no user feedback
([SyntheticResults/index.tsx:227](../src/pages/SyntheticResults/index.tsx#L227-L229)),
whereas the generator form surfaces errors via a Snackbar
([SyntheticDataForm.tsx:234](../src/components/business/syntheticData/SyntheticDataForm.tsx#L234-L242)).
Worth a small PR so the regenerate flow signals failures too.

**Testing limitation this exposed (the real lesson).** Unit tests **mock**
`syntheticService.generateSyntheticData` and the E2E specs **mock the network
routes** — neither hits the real backend, so a green suite cannot catch a missing
prod table or any other live-integration failure. The FE error branch _is_ covered
([useSyntheticDataForm.test.tsx](../src/test/synthetic/useSyntheticDataForm.test.tsx)
asserts a rejected call sets `error`) — graceful degradation, not proof the feature
works. **Recommendation:** a smoke test against a real (staging) backend +
migrations-on-deploy, so "table missing in prod" is impossible to ship silently.

---

## Bug #1 — ReviewAndRun stuck on "Analyzing…" after job failure ✅ FIXED (develop #53)

> **Resolved in develop #53** ("fix: Fix endless spinner"), merged into this branch.
> `checkStatus()` now calls `setIsProcessing(false)` + `setHasFailedGeneration(true)`
> on FAILED, so the job resolves to a "failed to generate / try again" state instead
> of hanging. The E2E reproducer was un-marked from `test.fail()` to a normal passing
> guard (`Polling — failed job status leaves the processing spinner`). Original
> analysis kept below for history.

**Severity:** medium-high (user can never recover from a failed job without
reload — no error UI, no retry button, just an infinite spinner).

**Where:**

- [src/components/business/deIdentity/ReviewAndRun.tsx](../src/components/business/deIdentity/ReviewAndRun.tsx) — `checkStatus()` (FAILED branch) and `getResults()` (catch block)

**Root cause:**
`setIsError(true)` is called, but `setIsProcessing(false)` is **not**. The very
first early-return in the component is `if (isProcessing) return <CircularProgress />`
— so the spinner wins over the error state forever.

```tsx
// Current code (buggy):
} else if (job.status === JobStatus.FAILED) {
  setIsError(true);
  stopPolling();
  // setIsProcessing(false); ← MISSING
}
```

Same pattern in `getResults()` catch branch.

**Reproducer:** [e2e/hipaa-wizard.spec.ts](../e2e/hipaa-wizard.spec.ts) → test `Polling — failed job status renders error state in ReviewAndRun [KNOWN BUG]`. Marked with `test.fail(true, …)` — Playwright reports it as a passing **expected failure** today; once the bug is fixed and the test starts succeeding, Playwright will start failing the suite with `expected to fail but passed`, forcing the test to be unmarked.

**Steps to reproduce in browser:**

1. Open wizard, complete step 0 (HIPAA), step 1 (any text), step 2 (any method + threshold).
2. Click Continue from step 2 (this fires `POST /jobs/:id/run`).
3. Make backend return `status: 'failed'` for the polling endpoint `GET /jobs/:id`.
4. **Expected:** "Failed" / "Try again" UI.
5. **Actual:** "Analyzing…" with `<CircularProgress>` indefinitely.

**Suggested fix (2 lines, scoped to next sprint):**

```tsx
} else if (job.status === JobStatus.FAILED) {
  setIsError(true);
  setIsProcessing(false); // add
  stopPolling();
}
// and in getResults() catch:
} catch {
  setIsError(true);
  setIsProcessing(false); // add
  stopPolling();
}
```

---

## Discrepancy #2 — Trello AC says `.txt/.csv/.json` upload, code accepts only `.txt/.pdf`

**Where:**

- [src/components/business/deIdentity/DataInput.tsx:22-23](../src/components/business/deIdentity/DataInput.tsx)

```ts
const SUPPORTED_FILE_TYPES = ['text/plain', 'application/pdf'];
const SUPPORTED_FILE_EXTENSIONS = '.txt,.pdf';
```

**Impact:** Trello AC for "Step 2 file: uploading supported file (.txt/.csv/.json) shows uploaded state" is **factually wrong against the current implementation**. Either the AC text needs to be updated, or the code needs to be extended to support `.csv`/`.json`. This is a product/spec call, not a code bug.

**E2E coverage of current behaviour:**

- ✅ `Step 1 file — uploading .txt shows success state`
- ✅ `Step 1 file — uploading .pdf shows success state`
- ✅ `Step 1 file — unsupported .csv shows error state` (verifies CURRENT prod behaviour, not Trello AC)

---

## Discrepancy #3 — "All 18 identifiers selected by default" is not what happens

**Where:**

- [src/components/business/deIdentity/HIPAAConfiguration.tsx:281-300](../src/components/business/deIdentity/HIPAAConfiguration.tsx) — hard-coded `entities` array sent on `selectMethod()`
- [src/constants/index.ts:87-104](../src/constants/index.ts) — `IDENTIFIER_GROUPS` rendered by [IdentifiersAccordion.tsx](../src/components/business/deIdentity/IdentifiersAccordion.tsx)

**Three separate issues bundled into one prod-state mismatch:**

1. The accordion renders **18** identifier rows (driven by `IDENTIFIER_GROUPS`). Trello AC says 18 — that part matches.
2. But `selectMethod()` PATCHes a hard-coded list of 18 entities that contains `LICENSE` (which has **no row in the UI**) and is missing `ZIP` and `HEALTH_PLAN` (which **are** rows in the UI).
3. Net effect: after clicking "Safe Harbor", **16 of the 18 visible identifiers are checked**, not all 18. `ZIP` and `HEALTH_PLAN` are unchecked. `LICENSE` exists in the PATCH payload but cannot be unchecked from the UI because it isn't displayed.
4. Bonus: `BENEFICIARY` exists in `ITEM_TO_ENTITY_MAP` but isn't included in any `IDENTIFIER_GROUPS` group, so it is also invisible. `selectMethod()` does include `BENEFICIARY` in its hard-coded list.

**Reproducer:** test `Step 2 Safe Harbor — 18 identifier rows shown; Safe Harbor active by default after click` documents the actual prod behaviour (18 rows; the 16 that overlap with the hard-coded list are checked).

**Suggested fix direction (next sprint):** make `selectMethod()` derive `entities` from `IDENTIFIER_GROUPS` / `ITEM_TO_ENTITY_MAP` rather than maintain a parallel hard-coded list. Out of scope here.

---

## Discrepancy #4 — Strategies in UI: 5 options, not 2 or 3

**Where:**

- [src/components/business/deIdentity/HIPAAConfiguration.tsx:124-165](../src/components/business/deIdentity/HIPAAConfiguration.tsx) — `STRATEGY_OPTIONS`

The dropdown actually exposes `Redact`, `Replace`, `Synthetic`, `Mask`, `Hash`. Earlier internal documentation referenced only 2 ("Redact"/"Replace") or proposed `Encrypt` (which doesn't exist). The E2E test asserts the live list of 5 — so it's a documentation issue, not a bug.

---

## Note #5 — i18n loading warning for `en-US`

**Where:** runtime console — visible in Playwright `[WebServer]` output:

```
[vite] (client) [console.warn] i18next::backendConnector: loading namespace
translation for language en-US failed failed parsing /locales/en-US/translation.json to json
```

`/public/locales/` only has `en/`, not `en-US/`. i18next tries `en-US` first because the browser locale is `en-US`, falls back to `en`, but logs the failure as a warning every time. Cosmetic but noisy in production logs.

**Suggested fix:** add `load: 'languageOnly'` to the i18next init, or pre-create an empty `en-US/translation.json` that re-exports `en/`. Out of scope here.

---

## Note #6 — Pre-existing TypeScript deprecation hints

Surfaced by IDE during this work but not introduced by it:

- [CustomizedStepper.tsx:255](../src/components/business/deIdentity/CustomizedStepper.tsx) — `StepIconComponent` is deprecated (MUI v7 prefers `slots`)
- [HIPAAConfiguration.tsx:446](../src/components/business/deIdentity/HIPAAConfiguration.tsx) — `InputProps` is deprecated (MUI v7 prefers `slotProps`)

Both are in pre-existing code paths; safe to address as part of MUI v7 modernisation epic.

---

## Coverage snapshot at the time of this report

| Scope                                                | Statements | Lines      | Functions  | Branches   |
| ---------------------------------------------------- | ---------- | ---------- | ---------- | ---------- |
| Unit suite — start of regression (pre-existing only) | ~25%       | ~25%       | ~7%        | ~6%        |
| **Unit suite — now** (`test:coverage`, 223 tests)    | **85.79%** | **86.58%** | **81.19%** | **72.30%** |

Coverage journey this regression pass: unit **~25% → 85.79%** statements
(lines 86.58%, functions ~7% → 81%, branches ~6% → 72%) across **223 tests** — the
**≥85% target is met**. After Ihor's Dashboard/All-Analyses refactor landed
(develop #50/#52/#53, merged in) those pages became stable enough to test, and the
wizard host hang was resolved by stubbing `useSearchParams` in the unit render.

**Now covered (unit):**

- utils + all Redux slices (`jobs`, `auth`, `dashboard`, `analyses`,
  `syntheticResult`) incl. thunk lifecycle (initializeAuth expired/no-token/fail,
  verifyMagicLink error, logout); full service layer (100%); hooks (`useDashboard`,
  `useAnalyses`-flow, `useAuthForm`, `useSyntheticDataForm`, `useLanding`,
  `useSidebar`, `useHeader`, `useMainLayout`).
- Page renders + interactions: **Dashboard** (content + empty + charts:
  Compliance/Activity/EntityTypes), **Analyses** (+ `DateRangeFilter`/
  `CalendarCaption` calendar), **SyntheticData**, **SyntheticResults** (drawers +
  regenerate/download popups + processing/error/warning states), **Landing**,
  **Auth**, **Contact**.
- De-ID wizard: **`CustomizedStepper`** host with full step navigation
  (next/back/step-jump + go-back popup + review host), `StepContent`,
  `HIPAAConfiguration` + `StandardComplianceConfiguration` (method/threshold/
  strategy/language), `EntityConfigurationAccordion`, `DataInput` (text validation +
  file upload + replace dialog), and **ReviewAndRun** (success/processing, entity
  toggle/filter/sort, copy/export, no-identifiers + all-excluded states).
- Layout components (Header, Sidebar, Auth/Landing/Main).

**Remaining gap to 100% (low-value, intentionally deferred):**

- App bootstrap (`App.tsx`, `i18n.ts`, `main.tsx`) — exercised by E2E, low value to
  unit-test.
- Scattered defensive branches inside large components (rare error paths, responsive
  `sx` callbacks) — diminishing returns past the ≥85% gate.

Roadmap of follow-up unit-coverage PRs in Trello (cards 1–5) is effectively complete:
services, slices, utils/hooks, shared UI and pages are all now covered.

---

## How to view the artefacts

```bash
# Open the HTML report (videos, traces, screenshots for every test):
npm run test:e2e:report

# Re-run the suite and regenerate artefacts:
npm run test:e2e

# Combined coverage HTML:
npm run test:coverage:all
# then open coverage-combined/index.html
```

`playwright-report/` is gitignored — artefacts are local-only. To share with
the team: zip `playwright-report/` and attach to Slack / Trello.
