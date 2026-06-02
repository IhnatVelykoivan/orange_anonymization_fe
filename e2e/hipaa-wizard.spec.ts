import { test, expect } from './fixtures/coverage';
import { setupAuthAndMocks } from './fixtures/auth';
import {
  navigateToWizard,
  getNextBtn,
  getBackBtn,
  goToDataInput,
  fillTextAndContinue,
  selectFramework,
  selectMethod,
  selectThreshold,
  configureForSubmit,
} from './helpers/wizard';
import {
  IDENTIFIERS_IN_UI,
  ENTITIES_AFTER_SAFE_HARBOR,
  METHOD_SAFE_HARBOR,
  METHOD_EXPERT_DETERMINATION,
  STRATEGIES,
  THRESHOLDS,
  TEXT_49_CHARS,
  VALID_TEXT_50,
  VALID_TEXT_100,
} from './fixtures/testData';

test.describe('HIPAA Wizard E2E', () => {
  test('Step 0 — selecting HIPAA framework saves selection and enables Continue', async ({
    page,
  }) => {
    const state = await setupAuthAndMocks(page);
    await navigateToWizard(page);

    await expect(getNextBtn(page)).toBeDisabled();

    await selectFramework(page, 'hipaa');
    await expect(getNextBtn(page)).toBeEnabled();

    expect(state.patchPayloads.at(-1)).toMatchObject({
      framework: 'hipaa',
      wizardState: { frameworkSelection: 'hipaa' },
    });

    await getNextBtn(page).click();
    await expect(page.getByTestId('text-input')).toBeVisible();
  });

  test('Step 1 text — empty/short blocks Continue; >=50 chars enables it', async ({ page }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);

    await expect(getNextBtn(page)).toBeDisabled();

    await page.getByTestId('text-input').fill(TEXT_49_CHARS);
    await expect(getNextBtn(page)).toBeDisabled();

    await page.getByTestId('text-input').fill(VALID_TEXT_50);
    await expect(getNextBtn(page)).toBeEnabled();

    await page.getByTestId('text-input').fill('');
    await expect(getNextBtn(page)).toBeDisabled();
  });

  // Real supported types: .txt, .pdf (see DataInput.tsx SUPPORTED_FILE_TYPES).
  // Trello AC said .txt/.csv/.json — that is wishful, not what the UI codes.
  for (const ext of ['txt'] as const) {
    test(`Step 1 file — uploading .${ext} shows success state`, async ({ page }) => {
      const mime = 'text/plain';
      await setupAuthAndMocks(page, { uploadFileName: `sample.${ext}`, uploadFileSize: 512 });
      await navigateToWizard(page);
      await goToDataInput(page);

      await page.getByRole('tab', { name: /file/i }).click();

      const fileInput = page.getByTestId('file-upload-input');
      await fileInput.setInputFiles({
        name: `sample.${ext}`,
        mimeType: mime,
        buffer: Buffer.from('synthetic file content for fixture'),
      });

      await expect(page.getByTestId('upload-success')).toBeVisible();
      await expect(page.getByText(`sample.${ext}`)).toBeVisible();
    });
  }

  test('Step 1 file — unsupported .csv shows error state', async ({ page }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);

    await page.getByRole('tab', { name: /file/i }).click();

    await page.getByTestId('file-upload-input').setInputFiles({
      name: 'data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('col1,col2\nval1,val2'),
    });

    await expect(page.getByTestId('upload-error')).toBeVisible();
  });

  test('Step 1 file — uploading .pdf shows success state', async ({ page }) => {
    await setupAuthAndMocks(page, { uploadFileName: 'sample.pdf', uploadFileSize: 1024 });
    await navigateToWizard(page);
    await goToDataInput(page);

    await page.getByRole('tab', { name: /file/i }).click();

    await page.getByTestId('file-upload-input').setInputFiles({
      name: 'sample.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake pdf bytes for fixture'),
    });

    await expect(page.getByTestId('upload-success')).toBeVisible();
    await expect(page.getByText('sample.pdf')).toBeVisible();
  });

  test('Step 1 file — file > 5 MB shows size error', async ({ page }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);

    await page.getByRole('tab', { name: /file/i }).click();

    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 'a');
    await page.getByTestId('file-upload-input').setInputFiles({
      name: 'huge.txt',
      mimeType: 'text/plain',
      buffer: oversizedBuffer,
    });

    await expect(page.getByTestId('upload-error')).toBeVisible();
  });

  test('Step 1 text — text > 5000 chars blocks Continue', async ({ page }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);

    await page.getByTestId('text-input').fill('a'.repeat(5001));
    await expect(getNextBtn(page)).toBeDisabled();

    await page.getByTestId('text-input').fill('a'.repeat(5000));
    await expect(getNextBtn(page)).toBeEnabled();
  });

  test('Step 2 Safe Harbor — 18 identifier rows shown; Safe Harbor active by default after click', async ({
    page,
  }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);

    await selectMethod(page, 'safe-harbor');

    await page.getByTestId('identifiers-accordion').click();

    const idLocators = page.locator('[data-testid^="identifier-"]');
    await expect(idLocators).toHaveCount(IDENTIFIERS_IN_UI.length);

    const checkedInUi = IDENTIFIERS_IN_UI.filter((e) =>
      (ENTITIES_AFTER_SAFE_HARBOR as readonly string[]).includes(e),
    );
    for (const entity of checkedInUi) {
      await expect(page.getByTestId(`identifier-${entity}`)).toHaveAttribute(
        'data-checked',
        'true',
      );
    }
  });

  test('Step 2 Expert Determination — toggling switches method title in PATCH', async ({
    page,
  }) => {
    const state = await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);

    await selectMethod(page, 'safe-harbor');
    expect(state.patchPayloads.at(-1)).toMatchObject({
      wizardState: { configSettings: { method: METHOD_SAFE_HARBOR } },
    });

    await selectMethod(page, 'expert-determination');
    expect(state.patchPayloads.at(-1)).toMatchObject({
      wizardState: { configSettings: { method: METHOD_EXPERT_DETERMINATION } },
    });

    await selectMethod(page, 'safe-harbor');
    await expect(page.getByTestId('method-safe-harbor')).toHaveAttribute('data-active', 'true');
  });

  test('Step 2 output — strategy + threshold selectable via testids', async ({ page }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);

    await selectMethod(page, 'safe-harbor');

    const strategySelect = page.getByTestId('strategy-select');
    await expect(strategySelect).toHaveAttribute('data-value', 'Redact');

    await strategySelect.getByTestId('dropdown-toggle').click();
    for (const id of STRATEGIES) {
      await expect(strategySelect.getByTestId(`dropdown-option-${id}`)).toBeVisible();
    }
    await strategySelect.getByTestId('dropdown-option-Replace').click();
    await expect(strategySelect).toHaveAttribute('data-value', 'Replace');

    await selectThreshold(page, 'aggressive');
    await expect(page.getByTestId('threshold-aggressive')).toHaveAttribute(
      'data-score',
      String(THRESHOLDS.aggressive),
    );
  });

  test('Submit — clicking Continue on Step 2 fires POST /jobs/:id/run and shows results', async ({
    page,
  }) => {
    const state = await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);
    await configureForSubmit(page);

    await getNextBtn(page).click();

    await expect(page.getByTestId('review-and-run')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('review-and-run')).toHaveAttribute('data-state', 'success', {
      timeout: 15_000,
    });
    expect(state.runCalled).toBe(true);
  });

  test('Step 2 Expert Determination — toggling an identifier checkbox PATCHes entities list', async ({
    page,
  }) => {
    const state = await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);

    await selectMethod(page, 'expert-determination');

    await page.getByTestId('identifiers-accordion').click();
    const nameRow = page.getByTestId('identifier-NAME');
    await expect(nameRow).toHaveAttribute('data-checked', /true|false/);
    const wasChecked = (await nameRow.getAttribute('data-checked')) === 'true';

    await nameRow.locator('input[type="checkbox"]').click();

    await expect.poll(() => state.patchPayloads.length).toBeGreaterThan(0);
    const lastPatch = state.patchPayloads.at(-1) as {
      wizardState?: { configSettings?: { entities?: string[] } };
    };
    const entitiesAfter = lastPatch.wizardState?.configSettings?.entities ?? [];
    if (wasChecked) {
      expect(entitiesAfter).not.toContain('NAME');
    } else {
      expect(entitiesAfter).toContain('NAME');
    }
  });

  // Regression guard for the old "endless Analyzing… spinner" bug (was
  // docs/qa-findings.md Bug #1, fixed in develop #53): a FAILED job must leave the
  // processing state. Current UX resolves to the results view (data-state="success")
  // and surfaces a "failed to generate / try again" affordance rather than hanging.
  test('Polling — failed job status leaves the processing spinner', async ({ page }) => {
    await setupAuthAndMocks(page, { forceFinalStatus: 'failed' });
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);
    await configureForSubmit(page);

    await getNextBtn(page).click();

    const reviewAndRun = page.getByTestId('review-and-run');
    await expect(reviewAndRun).toHaveAttribute('data-state', 'success', { timeout: 15_000 });
    await expect(reviewAndRun).not.toHaveAttribute('data-state', 'processing');
  });

  test('Back navigation — config (method + threshold) preserved when going back and forward', async ({
    page,
  }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);

    await selectMethod(page, 'safe-harbor');
    await selectThreshold(page, 'aggressive');

    await getBackBtn(page).click();
    await expect(page.getByTestId('text-input')).toBeVisible();
    await expect(page.getByTestId('text-input')).toHaveValue(VALID_TEXT_100);

    await getNextBtn(page).click();
    await expect(page.getByTestId('step-configuration')).toBeVisible();

    await expect(page.getByTestId('method-safe-harbor')).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('threshold-aggressive')).toHaveAttribute('data-active', 'true');
  });

  test('Back navigation — text input value preserved when going back from Step 2 to Step 1', async ({
    page,
  }) => {
    await setupAuthAndMocks(page);
    await navigateToWizard(page);
    await goToDataInput(page);
    await fillTextAndContinue(page, VALID_TEXT_100);

    await getBackBtn(page).click();
    await expect(page.getByTestId('text-input')).toBeVisible();
    await expect(page.getByTestId('text-input')).toHaveValue(VALID_TEXT_100);

    await getBackBtn(page).click();
    await expect(page.getByTestId('framework-hipaa')).toHaveAttribute('data-active', 'true');
  });
});
