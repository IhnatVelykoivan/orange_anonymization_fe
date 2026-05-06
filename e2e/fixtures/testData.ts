import type { IJob, JobResults } from '../../src/pages/DeIdentify/types';

export const VALID_TEXT_50 = 'Subject A acct XXX-00-0000 birth 1900-01-01 fixture';
export const VALID_TEXT_100 = VALID_TEXT_50.repeat(2);
export const TEXT_49_CHARS = 'A'.repeat(49);

// 18 identifiers actually rendered by IdentifiersAccordion (driven by IDENTIFIER_GROUPS,
// not ITEM_TO_ENTITY_MAP). BENEFICIARY exists in the map but no group includes it,
// so it's not rendered. Real source of truth: src/constants/index.ts IDENTIFIER_GROUPS.
export const IDENTIFIERS_IN_UI = [
  'NAME',
  'DATE',
  'FAX',
  'EMAIL',
  'PHONE',
  'ZIP',
  'ADDRESS',
  'SSN',
  'ACCOUNT',
  'MRN',
  'HEALTH_PLAN',
  'IP',
  'DEVICE',
  'URL',
  'BIOMETRIC',
  'PHOTO',
  'VEHICLE',
  'CERTIFICATE',
] as const;

export const ENTITIES_AFTER_SAFE_HARBOR = [
  'NAME',
  'DATE',
  'SSN',
  'PHONE',
  'FAX',
  'EMAIL',
  'ADDRESS',
  'ACCOUNT',
  'LICENSE',
  'VEHICLE',
  'URL',
  'IP',
  'BIOMETRIC',
  'PHOTO',
  'DEVICE',
  'MRN',
  'BENEFICIARY',
  'CERTIFICATE',
] as const;

export const METHOD_SAFE_HARBOR = 'Safe Harbor';
export const METHOD_EXPERT_DETERMINATION = 'Expert Determination';

export const STRATEGIES = ['Redact', 'Replace', 'Synthetic', 'Mask', 'Hash'] as const;
export const THRESHOLDS = { conservative: 0.3, balanced: 0.5, aggressive: 0.7 } as const;

export const TEST_JOB_ID = 'test-job-id';
export const TEST_USER_ID = 'test-user-id';

export const makeEmptyDraft = (): IJob => ({
  id: TEST_JOB_ID,
  status: 'draft',
  userId: TEST_USER_ID,
  errorMessage: null,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
  wizardState: {
    currentStep: 1,
    frameworkSelection: null,
    inputData: null,
    configSettings: {},
  },
});

export const MOCK_RESULTS: JobResults = {
  mainContent: {
    anonymizedText: 'Subject [NAME_1] acct [SSN_1] birth [DATE_1] fixture',
  },
  entityTable: [
    {
      id: 'e1',
      start: 8,
      end: 17,
      score: 0.9,
      entity_type: 'PERSON',
      analysis_explanation: null,
    },
    {
      id: 'e2',
      start: 23,
      end: 33,
      score: 0.99,
      entity_type: 'US_SSN',
      analysis_explanation: null,
    },
  ],
  auditTrail: {
    jobId: TEST_JOB_ID,
    framework: 'hipaa',
    timestamps: {
      started: new Date('2026-01-01T10:00:00Z').toISOString(),
      finished: new Date('2026-01-01T10:00:05Z').toISOString(),
    },
    processingTime: 5,
  },
  stats: { detected: 2, processed: 50, avgConfidence: 0.95 },
};
