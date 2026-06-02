import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import CustomizedSteppers from '@/components/business/deIdentity/CustomizedStepper';
import { jobsService } from '@/services/jobsService';
import { JobStatus, type IJob } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

// Stabilise useSearchParams so syncJobIdInUrl()'s setSearchParams is a no-op:
// the real one mutates the URL, which re-triggers the init effect in a cascade
// and prevents the jsdom render from settling.
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams('jobId=job-1'), vi.fn()],
  };
});

vi.mock('@/services/jobsService', () => ({
  jobsService: {
    getJobById: vi.fn(),
    getLatestDraft: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    runAnalysis: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

const job: IJob = {
  id: 'job-1',
  status: JobStatus.DRAFT,
  userId: 'u1',
  wizardState: { currentStep: 1, frameworkSelection: null, inputData: null, configSettings: {} },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CustomizedSteppers (wizard host)', () => {
  it('loads the job from the URL and renders the stepper on step 0', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(job);

    renderWithProviders(
      <MemoryRouter initialEntries={['/app/de-identify?jobId=job-1']}>
        <CustomizedSteppers />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('wizard-stepper')).toBeTruthy();
    expect(jobsService.getJobById).toHaveBeenCalledWith('job-1');
    expect(await screen.findByTestId('framework-hipaa')).toBeTruthy();
  });
});
