# QA Findings — HIPAA Wizard E2E suite

> Branch: `test/e2e-hipaa-wizard` (local only, NOT pushed)
> Run: `npm run test:e2e` → 14 passed + 1 known-fail (intentional reproducer)
> Artefacts: `playwright-report/index.html` (open with `npm run test:e2e:report`)
> Coverage: `npm run test:coverage:all` → `coverage-combined/index.html`

This document is the source of truth for what these tests _found_ — bugs that
are real prod issues, plus places where the Trello AC describes behaviour that
does not exist in the current code.

The fixes are deferred to the next sprint by product decision; the tests are
left as live reproducers so the team can verify a fix once it lands.

---

## Bug #1 — ReviewAndRun stuck on "Analyzing…" after job failure

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

After the suite runs (`npm run test:coverage:all`):

| Source                                        | Statements | Lines      | Functions  | Branches   |
| --------------------------------------------- | ---------- | ---------- | ---------- | ---------- |
| Vitest unit only (uninstrumented)             | 9.49%      | 9.97%      | 5.27%      | 4.03%      |
| Playwright E2E only (instrumented dev bundle) | 60.13%     | 62.59%     | 51.8%      | 59.71%     |
| **Combined (merged via nyc)**                 | **61.6%**  | **64.57%** | **54.72%** | **47.25%** |

STO target is **≥85%** unit. Gap is ~20 p.p. on statements/lines, ~30 p.p. on
functions/branches. Roadmap of follow-up unit-coverage PRs is in Trello (cards
1–5: services / jobsSlice / utils+hooks / shared UI / pages).

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
