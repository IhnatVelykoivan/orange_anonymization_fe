import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import ReviewAndRun from '@/components/business/deIdentity/ReviewAndRun';
import { jobsService } from '@/services/jobsService';
import { resultsService } from '@/services/resultsService';
import { JobStatus, type IJob, type JobResults } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/jobsService', () => ({
  jobsService: {
    getJobById: vi.fn(),
    toggleEntity: vi.fn(),
    updateJob: vi.fn(),
    runAnalysis: vi.fn(),
  },
}));
vi.mock('@/services/resultsService', () => ({
  resultsService: { getResults: vi.fn(), exportPdf: vi.fn() },
}));

const JOB_ID = 'job-1';

const job: IJob = {
  id: JOB_ID,
  status: JobStatus.SUCCEEDED,
  userId: 'u1',
  wizardState: null,
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const results: JobResults = {
  mainContent: { anonymizedText: '[REDACTED] content' },
  entityTable: [
    {
      id: 'e1',
      start: 0,
      end: 4,
      score: 0.95,
      entity_type: 'PERSON',
      analysis_explanation: null,
    },
  ],
  auditTrail: {
    jobId: JOB_ID,
    framework: 'hipaa',
    timestamps: { started: '2024-01-01T00:00:00Z', finished: '2024-01-01T00:01:00Z' },
    processingTime: 60,
  },
  stats: { detected: 1, processed: 1, avgConfidence: 0.95 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReviewAndRun', () => {
  it('polls the job, loads results and renders the success view', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue(job);
    vi.mocked(resultsService.getResults).mockResolvedValue(results);

    renderWithProviders(
      <MemoryRouter>
        <ReviewAndRun jobId={JOB_ID} />
      </MemoryRouter>,
    );

    const view = await screen.findByTestId('review-and-run');
    expect(view.getAttribute('data-state')).toBe('success');
    expect(jobsService.getJobById).toHaveBeenCalledWith(JOB_ID);
    expect(resultsService.getResults).toHaveBeenCalledWith(JOB_ID);
  });

  it('keeps the processing spinner while the job is not yet finished', async () => {
    vi.mocked(jobsService.getJobById).mockResolvedValue({ ...job, status: JobStatus.PROCESSING });

    renderWithProviders(
      <MemoryRouter>
        <ReviewAndRun jobId={JOB_ID} />
      </MemoryRouter>,
    );

    const view = await screen.findByTestId('review-and-run');
    expect(view.getAttribute('data-state')).toBe('processing');
    expect(resultsService.getResults).not.toHaveBeenCalled();
  });
});
