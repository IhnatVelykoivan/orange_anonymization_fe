import { test, expect } from './fixtures/coverage';

/**
 * Magic-link login (no password). Renders the real Auth page; the
 * POST /auth/login request is mocked so the flow reaches the "check your
 * inbox" confirmation state without a backend.
 */
test.describe('Login (magic link)', () => {
  test('submitting a valid email shows the check-inbox confirmation', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'sent' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/auth/login');

    await page.getByRole('textbox').fill('jane@example.com');

    const submit = page.getByRole('button', { name: 'Send Magic Link' });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText('Check your inbox')).toBeVisible();
  });

  test('keeps the submit button disabled for an invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    const submit = page.getByRole('button', { name: 'Send Magic Link' });
    await expect(submit).toBeDisabled();

    await page.getByRole('textbox').fill('not-an-email');
    await expect(submit).toBeDisabled();
  });
});
