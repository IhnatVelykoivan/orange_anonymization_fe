import { screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import SyntheticResults from '@/pages/SyntheticResults';
import { syntheticService } from '@/services/synthetic/syntheticService';
import type { SyntheticDataSummary } from '@/services/synthetic/types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/synthetic/syntheticService', () => ({
  syntheticService: {
    getGeneratedData: vi.fn(),
    downloadSyntheticData: vi.fn(),
    generateSyntheticData: vi.fn(),
  },
}));

const summary: SyntheticDataSummary = {
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
  available_fields: { default_selected: ['name'], additional_fields: ['email'] },
  preview_records: [{ name: 'Synthetic Person', email: 's@example.com' }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SyntheticResults page', () => {
  it('fetches the dataset and renders the results once completed', async () => {
    vi.mocked(syntheticService.getGeneratedData).mockResolvedValue(summary);

    renderWithProviders(
      <MemoryRouter initialEntries={['/app/synthetic-data/ds-1']}>
        <Routes>
          <Route path="/app/synthetic-data/:datasetId" element={<SyntheticResults />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('syntheticData.syntheticResults.compliance.title')).toBeTruthy();
    expect(syntheticService.getGeneratedData).toHaveBeenCalledWith('ds-1');
  });
});
