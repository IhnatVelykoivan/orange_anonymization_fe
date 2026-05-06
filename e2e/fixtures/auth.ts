import type { Page } from '@playwright/test';
import type { IJob } from '../../src/pages/DeIdentify/types';
import { MOCK_RESULTS, TEST_JOB_ID, makeEmptyDraft } from './testData';

const AUTH_TOKEN_KEY = 'clinical_studio_token';
const AUTH_SESSION_STARTED_AT_KEY = 'clinical_studio_session_started_at';

const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Record<string, unknown>,
): T => {
  const result: Record<string, unknown> = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      result[k] &&
      typeof result[k] === 'object' &&
      !Array.isArray(result[k])
    ) {
      result[k] = deepMerge(result[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      result[k] = v;
    }
  }
  return result as T;
};

export type WizardMockState = {
  job: IJob;
  runCalled: boolean;
  uploadCalled: boolean;
  patchPayloads: Array<Record<string, unknown>>;
};

export type SetupOptions = {
  initialJob?: Partial<IJob>;
  uploadFileName?: string;
  uploadFileSize?: number;
  forceFinalStatus?: 'succeeded' | 'failed' | 'queued';
};

export async function setupAuthAndMocks(
  page: Page,
  opts: SetupOptions = {},
): Promise<WizardMockState> {
  const baseDraft = makeEmptyDraft();
  const initial = opts.initialJob
    ? (deepMerge(
        baseDraft as unknown as Record<string, unknown>,
        opts.initialJob as Record<string, unknown>,
      ) as unknown as IJob)
    : baseDraft;

  const state: WizardMockState = {
    job: initial,
    runCalled: false,
    uploadCalled: false,
    patchPayloads: [],
  };

  await page.addInitScript(
    ([tokenKey, sessionKey, token]) => {
      window.localStorage.setItem(tokenKey, token);
      window.localStorage.setItem(sessionKey, String(Date.now()));
    },
    [AUTH_TOKEN_KEY, AUTH_SESSION_STARTED_AT_KEY, 'fake-jwt-token'] as const,
  );

  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: 'test-user-id',
        email: 'e2e@example.com',
        createdAt: new Date('2026-01-01').toISOString(),
      },
    });
  });

  await page.route('**/api/jobs/latest-draft', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: state.job });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/jobs', async (route) => {
    if (route.request().method() === 'POST') {
      state.job = makeEmptyDraft();
      await route.fulfill({ status: 200, json: state.job });
      return;
    }
    await route.continue();
  });

  await page.route(`**/api/jobs/${TEST_JOB_ID}`, async (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      state.patchPayloads.push(body);
      state.job = deepMerge(
        state.job as unknown as Record<string, unknown>,
        body,
      ) as unknown as IJob;
      await route.fulfill({ status: 200, json: state.job });
      return;
    }
    if (method === 'GET') {
      const finalStatus =
        opts.forceFinalStatus ?? (state.runCalled ? 'succeeded' : state.job.status);
      await route.fulfill({ status: 200, json: { ...state.job, status: finalStatus } });
      return;
    }
    await route.continue();
  });

  await page.route(`**/api/jobs/${TEST_JOB_ID}/run`, async (route) => {
    state.runCalled = true;
    state.job = { ...state.job, status: 'queued' };
    await route.fulfill({ status: 200, json: state.job });
  });

  await page.route(`**/api/jobs/${TEST_JOB_ID}/upload`, async (route) => {
    state.uploadCalled = true;
    const fileName = opts.uploadFileName ?? 'test.txt';
    const fileSize = opts.uploadFileSize ?? 512;
    state.job = {
      ...state.job,
      wizardState: {
        ...(state.job.wizardState ?? makeEmptyDraft().wizardState!),
        inputData: { fileName, fileSize, lineCount: 5 },
      },
    };
    await route.fulfill({ status: 200, json: state.job });
  });

  await page.route(`**/api/app/results/${TEST_JOB_ID}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, json: MOCK_RESULTS });
      return;
    }
    await route.continue();
  });

  return state;
}
