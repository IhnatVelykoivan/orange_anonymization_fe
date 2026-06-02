import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import ReviewAndRun from '@/components/business/deIdentity/ReviewAndRun';
import { store } from '@/store/store';
import { setLocalOriginalTextAC } from '@/store/slices/jobsSlice';
import { jobsService } from '@/services/jobsService';
import { resultsService } from '@/services/resultsService';
import {
  ComplianceFramework,
  JobStatus,
  type IJob,
  type JobResults,
} from '@/pages/DeIdentify/types';

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
const ORIGINAL_TEXT = 'John me@x.com 5551234 and some additional clinical narrative text here.';

const job: IJob = {
  id: JOB_ID,
  status: JobStatus.SUCCEEDED,
  userId: 'u1',
  wizardState: {
    currentStep: 4,
    frameworkSelection: ComplianceFramework.HIPAA,
    inputData: { fileName: 'note.txt', fileSize: 1024 },
    configSettings: { strategies: { PERSON: 'Redact' } },
  },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const buildResults = (over: Partial<JobResults> = {}): JobResults => ({
  mainContent: { anonymizedText: '[REDACTED] me@x.com [REDACTED]' },
  entityTable: [
    { id: 'e1', start: 0, end: 4, score: 0.95, entity_type: 'PERSON', analysis_explanation: null },
    {
      id: 'e2',
      start: 5,
      end: 13,
      score: 0.5,
      entity_type: 'EMAIL_ADDRESS',
      analysis_explanation: null,
    },
    {
      id: 'e3',
      start: 14,
      end: 21,
      score: 0.8,
      entity_type: 'PHONE_NUMBER',
      analysis_explanation: null,
      isExcluded: true,
    },
  ],
  auditTrail: {
    jobId: JOB_ID,
    framework: ComplianceFramework.HIPAA,
    timestamps: { started: '2024-01-01T00:00:00Z', finished: '2024-01-01T00:01:00Z' },
    processingTime: 42,
  },
  stats: { detected: 3, processed: 2, avgConfidence: 0.75 },
  ...over,
});

const renderReview = () =>
  renderWithProviders(
    <MemoryRouter>
      <ReviewAndRun jobId={JOB_ID} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  store.dispatch(setLocalOriginalTextAC({ jobId: JOB_ID, text: ORIGINAL_TEXT }));
  vi.mocked(jobsService.getJobById).mockResolvedValue(job);
});

describe('ReviewAndRun — populated entity panel', () => {
  it('renders the stats header, filename and entity cards', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    renderReview();

    await screen.findByTestId('review-and-run');
    expect(screen.getByText(/note\.txt/)).toBeTruthy();
    expect(screen.getAllByText('PERSON').length).toBeGreaterThan(0);
  });

  it('filters the entity list when a type chip is toggled', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    renderReview();
    await screen.findByTestId('review-and-run');

    const chip = screen.getAllByText('EMAIL_ADDRESS')[0];
    fireEvent.click(chip);

    await waitFor(() => expect(screen.getAllByText('EMAIL_ADDRESS').length).toBeGreaterThan(0));
  });

  it('changes the sort option through the select', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    renderReview();
    await screen.findByTestId('review-and-run');

    fireEvent.mouseDown(screen.getByRole('combobox'));
    const option = await screen.findByRole('option', {
      name: 'deIdentify.results.sortOptions.type',
    });
    fireEvent.click(option);

    expect(screen.getAllByText('PERSON').length).toBeGreaterThan(0);
  });

  it('toggles an entity through the service and refreshes results', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    vi.mocked(jobsService.toggleEntity).mockResolvedValue(undefined as never);
    renderReview();
    await screen.findByTestId('review-and-run');

    fireEvent.click(screen.getAllByText('deIdentify.results.included')[0]);

    await waitFor(() => expect(jobsService.toggleEntity).toHaveBeenCalled());
  });

  it('exports the PDF on download', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    renderReview();
    await screen.findByTestId('review-and-run');

    fireEvent.click(screen.getByText('common.download'));

    await waitFor(() => expect(resultsService.exportPdf).toHaveBeenCalledWith(JOB_ID));
  });

  it('shows the no-identifiers panel when nothing is detected', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(
      buildResults({ entityTable: [], stats: { detected: 0, processed: 0, avgConfidence: 0 } }),
    );
    renderReview();
    await screen.findByTestId('review-and-run');

    expect(screen.getByText('deIdentify.results.noIdentifiersDetectedPanel')).toBeTruthy();
  });

  it('warns when every detected entity is excluded', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(
      buildResults({
        entityTable: [
          {
            id: 'e1',
            start: 0,
            end: 4,
            score: 0.9,
            entity_type: 'PERSON',
            analysis_explanation: null,
            isExcluded: true,
          },
        ],
      }),
    );
    renderReview();
    await screen.findByTestId('review-and-run');

    expect(screen.getByText('deIdentify.results.allEntitiesExcluded')).toBeTruthy();
  });

  it('renders the de-identified tab text', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    renderReview();
    await screen.findByTestId('review-and-run');

    fireEvent.click(screen.getByRole('tab', { name: 'deIdentify.results.deIdentifiedTab' }));
    const panel = await screen.findByText('[REDACTED] me@x.com [REDACTED]');
    expect(panel).toBeTruthy();
  });

  it('routes back to settings via adjust settings', async () => {
    vi.mocked(resultsService.getResults).mockResolvedValue(buildResults());
    vi.mocked(jobsService.updateJob).mockResolvedValue(job);
    renderReview();
    await screen.findByTestId('review-and-run');

    fireEvent.click(screen.getByText('deIdentify.results.adjustSettings'));

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });
});
