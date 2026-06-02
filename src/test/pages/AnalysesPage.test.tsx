import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import Analyses from '@/pages/Analyses';
import { getAnalyses } from '@/services/dashboard/analysesService';
import type { AnalysesResponse } from '@/services/dashboard/types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/dashboard/analysesService', () => ({
  getAnalyses: vi.fn(),
  getAllAnalyses: vi.fn(),
}));

const response: AnalysesResponse = {
  data: [
    {
      id: '1',
      framework: 'hipaa',
      status: 'succeeded',
      createdAt: '2024-01-15T10:00:00.000Z',
      fileName: 'record.txt',
      entitiesCount: 8,
    },
    {
      id: '2',
      framework: null,
      status: 'failed',
      createdAt: '2024-01-16T10:00:00.000Z',
      fileName: 'notes.pdf',
      entitiesCount: null,
    },
  ],
  total: 20,
  page: 1,
  limit: 10,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Analyses page', () => {
  it('renders the analyses table rows in the content state', async () => {
    vi.mocked(getAnalyses).mockResolvedValue(response);

    renderWithProviders(
      <MemoryRouter>
        <Analyses />
      </MemoryRouter>,
    );

    expect(await screen.findByText('record.txt')).toBeTruthy();
    expect(screen.getByText('notes.pdf')).toBeTruthy();
  });
});
