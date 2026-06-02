import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import HIPAAConfiguration from '@/components/business/deIdentity/HIPAAConfiguration';
import { store } from '@/store/store';
import { setJobAC } from '@/store/slices/jobsSlice';
import { jobsService } from '@/services/jobsService';
import { ComplianceFramework, JobStatus, Threshold, type IJob } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
vi.mock('@/services/jobsService', () => ({ jobsService: { updateJob: vi.fn() } }));

const job: IJob = {
  id: 'job-1',
  status: JobStatus.DRAFT,
  userId: 'u1',
  wizardState: {
    currentStep: 3,
    frameworkSelection: ComplianceFramework.HIPAA,
    inputData: null,
    configSettings: {
      method: 'Safe Harbor',
      entities: ['NAME', 'DATE'],
      strategies: { NAME: 'Redact', DATE: 'Redact' },
      language: 'en',
      threshold: Threshold.MIDDLE,
      isAutoDetected: true,
    },
  },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(jobsService.updateJob).mockResolvedValue(job);
  store.dispatch(setJobAC(job));
});

describe('HIPAAConfiguration', () => {
  it('renders method, identifier and threshold sections', () => {
    renderWithProviders(<HIPAAConfiguration />);
    expect(screen.getByTestId('method-safe-harbor')).toBeTruthy();
    expect(screen.getByTestId('threshold-balanced')).toBeTruthy();
  });

  it('selects a different method', async () => {
    renderWithProviders(<HIPAAConfiguration />);
    fireEvent.click(screen.getByTestId('method-expert-determination'));
    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('selects a detection threshold', async () => {
    renderWithProviders(<HIPAAConfiguration />);
    fireEvent.click(screen.getByTestId('threshold-aggressive'));
    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('changes the redaction strategy through the dropdown', async () => {
    renderWithProviders(<HIPAAConfiguration />);

    fireEvent.click(screen.getAllByTestId('dropdown-toggle')[0]);
    fireEvent.click(await screen.findByTestId('dropdown-option-Replace'));

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('filters and selects a language', async () => {
    renderWithProviders(<HIPAAConfiguration />);

    fireEvent.click(screen.getAllByTestId('dropdown-toggle')[1]);
    const search = await screen.findByPlaceholderText('deIdentify.languageSelect.search');
    fireEvent.change(search, { target: { value: 'lang' } });

    fireEvent.click(screen.getAllByTestId('dropdown-option-en')[0]);

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });
});
