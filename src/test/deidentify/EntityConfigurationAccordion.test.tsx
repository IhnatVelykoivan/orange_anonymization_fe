import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import EntityConfigurationAccordion from '@/components/business/deIdentity/EntityConfigurationAccordion';
import { ComplianceFramework, JobStatus, type IJob } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

const job: IJob = {
  id: 'job-1',
  status: JobStatus.DRAFT,
  userId: 'u1',
  wizardState: {
    currentStep: 3,
    frameworkSelection: ComplianceFramework.EU_GDPR,
    inputData: null,
    configSettings: { strategies: { PERSON: 'Redact' } },
  },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('EntityConfigurationAccordion', () => {
  it('expands to reveal per-entity strategy dropdowns', () => {
    renderWithProviders(<EntityConfigurationAccordion currentJob={job} updateJob={vi.fn()} />);

    fireEvent.click(screen.getByText('deIdentify.settings.entityConfig.title'));

    expect(screen.getAllByTestId('dropdown-toggle').length).toBeGreaterThan(1);
  });

  it('persists a strategy change via updateJob', async () => {
    const updateJob = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<EntityConfigurationAccordion currentJob={job} updateJob={updateJob} />);

    fireEvent.click(screen.getByText('deIdentify.settings.entityConfig.title'));
    fireEvent.click(screen.getAllByTestId('dropdown-toggle')[0]);
    fireEvent.click(await screen.findByTestId('dropdown-option-Replace'));

    await waitFor(() => expect(updateJob).toHaveBeenCalledTimes(1));
    const [, payload] = updateJob.mock.calls[0];
    expect(payload.wizardState.configSettings.strategies.PERSON).toBe('Replace');
  });

  it('resets all strategies to defaults through the confirmation popup', async () => {
    const updateJob = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<EntityConfigurationAccordion currentJob={job} updateJob={updateJob} />);

    fireEvent.click(screen.getByText('deIdentify.settings.entityConfig.resetToDefault'));
    fireEvent.click(await screen.findByText('deIdentify.settings.resetDialog.confirm'));

    await waitFor(() => expect(updateJob).toHaveBeenCalledTimes(1));
  });
});
