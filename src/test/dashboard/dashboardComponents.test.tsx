import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MetricCard } from '@/pages/Dashboard/components/MetricCard';
import { EmptyStateCard } from '@/pages/Dashboard/components/EmptyStateCard';
import { RecentActivityTable } from '@/pages/Dashboard/components/RecentActivityTable';
import type { RecentActivity } from '@/services/dashboard/types';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('MetricCard', () => {
  it('renders the numeric value in the content state', () => {
    const { getByText } = renderWithProviders(
      <MetricCard icon={<span>icon</span>} label="Documents" value={10} state="content" />,
    );
    expect(getByText('Documents')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('renders an em dash in the error state', () => {
    const { getByText, queryByText } = renderWithProviders(
      <MetricCard icon={<span>icon</span>} label="Docs" value={5} state="error" />,
    );
    expect(getByText('—')).toBeTruthy();
    expect(queryByText('5')).toBeNull();
  });

  it('hides the value behind a skeleton while loading', () => {
    const { queryByText } = renderWithProviders(
      <MetricCard icon={<span>icon</span>} label="Docs" value={42} state="loading" />,
    );
    expect(queryByText('42')).toBeNull();
  });

  it('accepts string percentage values', () => {
    const { getByText } = renderWithProviders(
      <MetricCard icon={<span>icon</span>} label="Rate" value="95%" state="content" />,
    );
    expect(getByText('95%')).toBeTruthy();
  });
});

describe('EmptyStateCard', () => {
  const baseProps = {
    icon: <span>empty-icon</span>,
    title: 'Distribution',
    subtitle: 'subtitle',
    contentSubtitle: 'content-subtitle',
  };

  it('renders children when content has data', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <EmptyStateCard {...baseProps} state="content" hasData>
        <div data-testid="chart">chart</div>
      </EmptyStateCard>,
    );
    expect(getByTestId('chart')).toBeTruthy();
    expect(getByText('content-subtitle')).toBeTruthy();
  });

  it('shows the empty body when content has no data', () => {
    const { getByText, queryByTestId } = renderWithProviders(
      <EmptyStateCard {...baseProps} state="content" hasData={false}>
        <div data-testid="chart">chart</div>
      </EmptyStateCard>,
    );
    expect(getByText('dashboard.emptyState.noAnalysesFound')).toBeTruthy();
    expect(queryByTestId('chart')).toBeNull();
  });

  it('shows a loader while loading', () => {
    const { getByRole } = renderWithProviders(<EmptyStateCard {...baseProps} state="loading" />);
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('shows an error label in the error state', () => {
    const { getByText } = renderWithProviders(<EmptyStateCard {...baseProps} state="error" />);
    expect(getByText('dashboard.errors.failedToLoadAnalysesActivity')).toBeTruthy();
  });
});

describe('RecentActivityTable', () => {
  const rows: RecentActivity[] = [
    {
      id: '1',
      framework: 'hipaa',
      status: 'succeeded',
      createdAt: '2024-01-15T10:00:00.000Z',
      fileName: 'patient-record.txt',
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
  ];

  it('renders document rows in the content state', () => {
    const { getByText } = renderWithProviders(
      <MemoryRouter>
        <RecentActivityTable rows={rows} state="content" />
      </MemoryRouter>,
    );
    expect(getByText('patient-record.txt')).toBeTruthy();
    expect(getByText('notes.pdf')).toBeTruthy();
  });
});
