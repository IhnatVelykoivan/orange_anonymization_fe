import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import CustomizedSteppers from '@/components/business/deIdentity/CustomizedStepper';
import { store } from '@/store/store';
import { setLocalOriginalTextAC } from '@/store/slices/jobsSlice';
import { jobsService } from '@/services/jobsService';
import { ComplianceFramework, JobStatus, type IJob } from '@/pages/DeIdentify/types';

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
vi.mock('@/services/resultsService', () => ({
  resultsService: { getResults: vi.fn(), exportPdf: vi.fn() },
}));

const JOB_ID = 'job-1';
const LONG_TEXT = 'a'.repeat(60);

const makeJob = (currentStep: number, configSettings: Record<string, unknown> = {}): IJob => ({
  id: JOB_ID,
  status: JobStatus.DRAFT,
  userId: 'u1',
  wizardState: {
    currentStep,
    frameworkSelection: ComplianceFramework.HIPAA,
    inputData: { fileName: 'note.txt', fileSize: 1024 },
    configSettings,
  },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const setup = async (job: IJob) => {
  vi.mocked(jobsService.getJobById).mockResolvedValue(job);
  vi.mocked(jobsService.updateJob).mockResolvedValue(job);
  vi.mocked(jobsService.runAnalysis).mockResolvedValue(undefined as never);
  vi.mocked(jobsService.createJob).mockResolvedValue(job);
  store.dispatch(setLocalOriginalTextAC({ jobId: JOB_ID, text: LONG_TEXT }));

  renderWithProviders(
    <MemoryRouter initialEntries={['/app/de-identify?jobId=job-1']}>
      <CustomizedSteppers />
    </MemoryRouter>,
  );

  await screen.findByTestId('wizard-stepper');
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CustomizedSteppers (wizard host)', () => {
  it('loads the job from the URL and renders the stepper on step 0', async () => {
    await setup(makeJob(1));
    expect(jobsService.getJobById).toHaveBeenCalledWith(JOB_ID);
    expect(await screen.findByTestId('framework-hipaa')).toBeTruthy();
  });

  it('advances to the next step from the compliance step', async () => {
    await setup(makeJob(1));

    await waitFor(() => expect(screen.getByTestId('step-next-btn')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('step-next-btn'));

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('goes back from the data-input step', async () => {
    await setup(makeJob(2));

    fireEvent.click(screen.getByTestId('step-back-btn'));

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('runs the analysis from the configuration step', async () => {
    await setup(
      makeJob(3, {
        method: 'safe-harbor',
        strategies: { PERSON: 'Redact' },
        language: 'en',
        threshold: 0.5,
      }),
    );

    await waitFor(() => expect(screen.getByTestId('step-next-btn')).not.toBeDisabled());
    fireEvent.click(screen.getByTestId('step-next-btn'));

    await waitFor(() => expect(jobsService.runAnalysis).toHaveBeenCalledWith(JOB_ID, LONG_TEXT));
  });

  it('confirms the go-back popup when jumping to an earlier step from review', async () => {
    await setup(
      makeJob(4, {
        method: 'safe-harbor',
        strategies: { PERSON: 'Redact' },
        language: 'en',
        threshold: 0.5,
      }),
    );

    fireEvent.click(screen.getByText('deIdentify.steps.compliance'));
    fireEvent.click(await screen.findByText('deIdentify.reviewResults.goBackPopup.goBack'));

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('renders the ReviewAndRun host on the final step', async () => {
    await setup(makeJob(5));
    expect(await screen.findByTestId('review-and-run')).toBeTruthy();
  });
});
