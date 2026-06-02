import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import Dashboard from '@/pages/Dashboard';
import { getStats } from '@/services/dashboard/dashboardService';
import type { DashboardData } from '@/services/dashboard/types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/dashboard/dashboardService', () => ({ getStats: vi.fn() }));

const data: DashboardData = {
  metrics: { totalDocuments: 7, entitiesDetected: 12, anonymizationRate: 95, syntheticRecords: 4 },
  chartData: [{ date: '2024-01-01', documents: 1, entities: 2 }],
  recentActivity: [
    {
      id: '1',
      framework: 'hipaa',
      status: 'succeeded',
      createdAt: '2024-01-15T10:00:00.000Z',
      fileName: 'record.txt',
      entitiesCount: 8,
    },
  ],
  strategiesDistribution: [{ key: 'Redact', count: 3 }],
  frameworksDistribution: [{ key: 'HIPAA', count: 2 }],
  entitiesDistribution: [{ key: 'PERSON', count: 5 }],
  emptyState: false,
};

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Dashboard page', () => {
  it('renders metrics, chart and recent-activity sections once data loads', async () => {
    vi.mocked(getStats).mockResolvedValue(data);

    renderPage();

    expect(await screen.findByText('dashboard.metrics.totalDocuments')).toBeTruthy();
    expect(screen.getByText('dashboard.metrics.entitiesDetected')).toBeTruthy();
    expect(screen.getByText('dashboard.chart.activityTitle')).toBeTruthy();
    expect(screen.getByText('dashboard.recentActivity.title')).toBeTruthy();
  });

  it('renders the welcome banner in the empty state', async () => {
    vi.mocked(getStats).mockResolvedValue({ ...data, emptyState: true });

    renderPage();

    expect(await screen.findByText('dashboard.welcomeTitle')).toBeTruthy();
    expect(screen.getByText('dashboard.newAnalysis')).toBeTruthy();
  });
});
