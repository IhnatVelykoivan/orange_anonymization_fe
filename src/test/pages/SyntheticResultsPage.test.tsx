import { screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import SyntheticResults from '@/pages/SyntheticResults';
import { store } from '@/store/store';
import { setJobAC, setLocalOriginalTextAC } from '@/store/slices/jobsSlice';
import { syntheticService } from '@/services/synthetic/syntheticService';
import type { SyntheticDataSummary } from '@/services/synthetic/types';
import { JobStatus, type IJob } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/synthetic/syntheticService', () => ({
  syntheticService: {
    getGeneratedData: vi.fn(),
    downloadSyntheticData: vi.fn(),
    generateSyntheticData: vi.fn(),
  },
}));

const makeSummary = (over: Partial<SyntheticDataSummary> = {}): SyntheticDataSummary => ({
  dataset_id: 'ds-1',
  status: 'completed',
  compliance: { framework: 'HIPAA', risk_level: 'low', direct_identifiers_detected: '0' },
  data_quality: { quality: 'high', consistency: 'high', warnings: [] },
  export_summary: { format: 'CSV', records_count: 100, fields_count: 5 },
  compliance_validation_checks: {
    dates_transformed: true,
    free_text_fields_checked: true,
    export_format_validated: true,
    synthetic_identifiers_generated: true,
    direct_identifiers_removed: true,
  },
  available_fields: { default_selected: ['record_id'], additional_fields: ['email'] },
  preview_records: [{ record_id: 'r-1', docType: 'note', age_range: '30-40' }],
  ...over,
});

const job: IJob = {
  id: 'job-1',
  status: JobStatus.SUCCEEDED,
  userId: 'u1',
  wizardState: null,
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/app/synthetic-data/ds-1']}>
      <Routes>
        <Route path="/app/synthetic-data/:datasetId" element={<SyntheticResults />} />
        <Route path="/app/synthetic-data" element={<div data-testid="generator" />} />
        <Route path="/app/synthetic-data/:datasetId/x" element={<div />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(window.URL, {
    createObjectURL: vi.fn(() => 'blob:url'),
    revokeObjectURL: vi.fn(),
  });
});

describe('SyntheticResults page', () => {
  it('fetches the dataset and renders the results once completed', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(makeSummary());
    renderPage();

    expect(await screen.findByText('syntheticData.syntheticResults.compliance.title')).toBeTruthy();
    expect(syntheticService.getGeneratedData).toHaveBeenCalledWith('ds-1');
  });

  it('shows the processing spinner while generation is pending', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue({
      status: 'processing',
    } as unknown as SyntheticDataSummary);
    renderPage();

    expect(await screen.findByText('syntheticData.status.processing')).toBeTruthy();
  });

  it('renders the error state when the fetch fails', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockRejectedValue(new Error('boom'));
    renderPage();

    expect(await screen.findByText('boom')).toBeTruthy();
  });

  it('renders quality warnings when present', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(
      makeSummary({
        data_quality: { quality: 'medium', consistency: 'medium', warnings: ['Low fidelity'] },
      }),
    );
    renderPage();

    expect(await screen.findAllByText('Low fidelity')).toBeTruthy();
  });

  it('opens the customize-columns drawer', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(makeSummary());
    renderPage();
    await screen.findByText('syntheticData.syntheticResults.compliance.title');

    fireEvent.click(screen.getByText('syntheticData.results.drawers.customizeColumns.title'));

    expect(
      await screen.findByText('syntheticData.results.drawers.customizeColumns.apply'),
    ).toBeTruthy();
  });

  it('opens the record-details drawer from a preview row', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(makeSummary());
    renderPage();
    await screen.findByText('syntheticData.syntheticResults.compliance.title');

    fireEvent.click(screen.getByText('common.view'));

    await waitFor(() => expect(screen.getAllByText(/recordDetails/).length).toBeGreaterThan(0));
  });

  it('opens the validation-details drawer', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(makeSummary());
    renderPage();
    await screen.findByText('syntheticData.syntheticResults.compliance.title');

    fireEvent.click(screen.getByText('syntheticData.syntheticResults.validation.viewDetails'));

    await waitFor(() => expect(screen.getAllByText(/validation/i).length).toBeGreaterThan(0));
  });

  it('regenerates the dataset through the popup', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(makeSummary());
    vi.mocked(syntheticService.generateSyntheticData).mockResolvedValue({
      dataset_id: 'ds-2',
    } as never);
    store.dispatch(setJobAC(job));
    store.dispatch(setLocalOriginalTextAC({ jobId: 'job-1', text: 'raw clinical text' }));

    renderPage();
    await screen.findByText('syntheticData.syntheticResults.compliance.title');

    fireEvent.click(screen.getByText('common.regenerate'));
    fireEvent.click(screen.getAllByText('common.regenerate').at(-1)!);

    await waitFor(() => expect(syntheticService.generateSyntheticData).toHaveBeenCalled());
  });

  it('downloads the dataset through the popup', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(makeSummary());
    vi.mocked(syntheticService.downloadSyntheticData).mockResolvedValue(
      new Blob(['data']) as never,
    );
    renderPage();
    await screen.findByText('syntheticData.syntheticResults.compliance.title');

    fireEvent.click(screen.getByText('common.download'));
    fireEvent.click(screen.getAllByText('common.download').at(-1)!);

    await waitFor(() =>
      expect(syntheticService.downloadSyntheticData).toHaveBeenCalledWith('ds-1'),
    );
  });
});
