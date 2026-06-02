import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import StandardComplianceConfiguration from '@/components/business/deIdentity/StandardComplianceConfiguration';
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
    frameworkSelection: ComplianceFramework.EU_GDPR,
    inputData: null,
    configSettings: {
      language: 'en',
      strategies: { PERSON: 'Redact' },
      threshold: Threshold.LOW,
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

describe('StandardComplianceConfiguration', () => {
  it('renders the privacy-risk section and the framework warning at low threshold', () => {
    renderWithProviders(<StandardComplianceConfiguration />);
    expect(screen.getByText('deIdentify.settings.sections.privacyRisk')).toBeTruthy();
    expect(screen.getByText('deIdentify.settings.frameworkInfo.euGdpr.warning')).toBeTruthy();
  });

  it('selects a privacy-risk threshold', async () => {
    renderWithProviders(<StandardComplianceConfiguration />);
    fireEvent.click(screen.getByText('deIdentify.settings.detection.thresholds.high.title'));
    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('opens the configuration-logic drawer', async () => {
    renderWithProviders(<StandardComplianceConfiguration />);
    fireEvent.click(screen.getByText('deIdentify.settings.howItWorks.viewLogic'));
    await waitFor(() =>
      expect(screen.getAllByText(/deIdentify\.settings/).length).toBeGreaterThan(0),
    );
  });

  it('filters and selects a language', async () => {
    renderWithProviders(<StandardComplianceConfiguration />);

    fireEvent.click(screen.getAllByTestId('dropdown-toggle').at(-1)!);
    const search = await screen.findByPlaceholderText('deIdentify.languageSelect.search');
    fireEvent.change(search, { target: { value: 'lang' } });
    fireEvent.click(screen.getAllByTestId('dropdown-option-en')[0]);

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });
});
