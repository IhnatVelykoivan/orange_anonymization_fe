import { test, expect } from './fixtures/coverage';

/**
 * Public Contact form — real React Hook Form + Yup validation, with the
 * /email/contact POST mocked. Inputs are selected by their stable MUI `id`s
 * (#firstName, #lastName, #email, #message), so no dependency on i18n copy
 * beyond the submit / success button labels.
 */
test.describe('Contact form', () => {
  test('submitting a valid message shows the success state', async ({ page }) => {
    await page.route('**/api/email/contact', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
      } else {
        await route.continue();
      }
    });

    await page.goto('/contact');

    await page.locator('#firstName').fill('Jane');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#email').fill('jane@example.com');
    await page.locator('#message').fill('This is a sufficiently long contact message for QA.');

    const submit = page.getByRole('button', { name: 'Send Message' });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByRole('button', { name: 'Back to form' })).toBeVisible();
  });

  test('keeps the submit button disabled until the form is valid', async ({ page }) => {
    await page.goto('/contact');

    const submit = page.getByRole('button', { name: 'Send Message' });
    await expect(submit).toBeDisabled();

    // Filling everything except a long-enough message keeps it disabled (min 20 chars).
    await page.locator('#firstName').fill('Jane');
    await page.locator('#lastName').fill('Doe');
    await page.locator('#email').fill('jane@example.com');
    await page.locator('#message').fill('too short');

    await expect(submit).toBeDisabled();
  });
});
