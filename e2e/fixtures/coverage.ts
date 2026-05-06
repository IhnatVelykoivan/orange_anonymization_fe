/* eslint-disable react-hooks/rules-of-hooks -- `use` is the Playwright fixture
   callback, not a React hook. Plugin can't tell them apart. */
import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const COVERAGE_DIR = path.resolve(process.cwd(), '.nyc_output');

if (process.env.VITE_COVERAGE === 'true' && !fs.existsSync(COVERAGE_DIR)) {
  fs.mkdirSync(COVERAGE_DIR, { recursive: true });
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    if (process.env.VITE_COVERAGE !== 'true') return;

    try {
      const coverage = await page.evaluate(
        () => (window as unknown as { __coverage__?: unknown }).__coverage__,
      );
      if (!coverage) return;

      const fingerprint = crypto.randomBytes(6).toString('hex');
      const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
      const filePath = path.join(COVERAGE_DIR, `${safeTitle}_${fingerprint}.json`);
      fs.writeFileSync(filePath, JSON.stringify(coverage));
    } catch {
      // Page may already be closed; coverage dumping is best-effort.
    }
  },
});

export { expect } from '@playwright/test';
