import { test, expect } from './fixtures/coverage';

/**
 * Public landing + navigation smoke. Landing, Contact and Login are
 * client-only routes (no auth token, no backend), so this suite needs neither
 * the auth fixture nor API mocks. Locators are scoped to the header banner to
 * avoid matching the duplicate CTAs in the hero / footer / mobile drawer.
 */
test.describe('Landing & public navigation', () => {
  test('landing page renders the header shell and a hero heading', async ({ page }) => {
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'De-ID Studio' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('header "Contact Us" navigates to /contact', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('banner').getByRole('link', { name: 'Contact Us' }).click();

    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole('banner')).toBeVisible();
  });

  test('header "Get Started" navigates to the login route', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('banner').getByRole('link', { name: 'Get Started' }).click();

    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
