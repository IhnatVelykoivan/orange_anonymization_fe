import { expect, type Page } from '@playwright/test';

export const WIZARD_PATH = '/app/de-identify';

export async function navigateToWizard(page: Page) {
  await page.goto(WIZARD_PATH);
  await expect(page.getByTestId('wizard-stepper')).toBeVisible();
}

export const getNextBtn = (page: Page) => page.getByTestId('step-next-btn');
export const getBackBtn = (page: Page) => page.getByTestId('step-back-btn');

export async function selectFramework(
  page: Page,
  slug: 'hipaa' | 'eu-gdpr' | 'uk-gdpr' | 'swiss-fadp' = 'hipaa',
) {
  await page.getByTestId(`framework-${slug}`).click();
  await expect(page.getByTestId(`framework-${slug}`)).toHaveAttribute('data-active', 'true');
}

export async function goToDataInput(page: Page) {
  await selectFramework(page, 'hipaa');
  await expect(getNextBtn(page)).toBeEnabled();
  await getNextBtn(page).click();
  await expect(page.getByTestId('text-input')).toBeVisible();
}

export async function fillTextAndContinue(page: Page, text: string) {
  await page.getByTestId('text-input').fill(text);
  await expect(getNextBtn(page)).toBeEnabled();
  await getNextBtn(page).click();
  await expect(page.getByTestId('step-configuration')).toBeVisible();
}

export async function selectMethod(page: Page, method: 'safe-harbor' | 'expert-determination') {
  await page.getByTestId(`method-${method}`).click();
  await expect(page.getByTestId(`method-${method}`)).toHaveAttribute('data-active', 'true');
}

export async function selectThreshold(
  page: Page,
  level: 'conservative' | 'balanced' | 'aggressive',
) {
  await page.getByTestId(`threshold-${level}`).click();
  await expect(page.getByTestId(`threshold-${level}`)).toHaveAttribute('data-active', 'true');
}

export async function configureForSubmit(page: Page) {
  await selectMethod(page, 'safe-harbor');
  await selectThreshold(page, 'balanced');
  await expect(getNextBtn(page)).toBeEnabled();
}
