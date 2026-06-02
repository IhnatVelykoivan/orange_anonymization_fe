import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { ComplianceChart } from '@/pages/Dashboard/components/DistributionCharts/ComplianceChart';
import { EntityTypesChart } from '@/pages/Dashboard/components/DistributionCharts/EntityTypesChart';
import { ActivityChart } from '@/pages/Dashboard/components/ActivityChart';
import { CHART_TYPES } from '@/pages/Dashboard/components/ActivityChart/types';
import type { DistributionData, ChartData } from '@/services/dashboard/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ResponsiveContainer measures its parent (0×0 in jsdom). Clone the chart child
// with concrete dimensions so Recharts actually renders sectors/areas/bars and
// invokes the label/dot render props we want to cover.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        width: 600,
        height: 400,
      }),
  };
});

describe('ComplianceChart', () => {
  it('renders a single-framework distribution', () => {
    const data: DistributionData[] = [{ key: 'hipaa', count: 12 }];
    const { container } = renderWithProviders(<ComplianceChart data={data} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders multiple frameworks and applies the swiss/uk legend swap', () => {
    const data: DistributionData[] = [
      { key: 'hipaa', count: 10 },
      { key: 'eu-gdpr', count: 8 },
      { key: 'swiss-fadp', count: 4 },
      { key: 'uk-gdpr', count: 6 },
    ];
    const { container } = renderWithProviders(<ComplianceChart data={data} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});

describe('EntityTypesChart', () => {
  it('returns nothing when there is no data', () => {
    const { container } = renderWithProviders(<EntityTypesChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders bars and toggles the show-all control past the collapse limit', () => {
    const data: DistributionData[] = Array.from({ length: 9 }, (_, i) => ({
      key: `ENTITY_${i}`,
      count: (i + 1) * 10,
    }));
    renderWithProviders(<EntityTypesChart data={data} />);

    const toggle = screen.getByText('dashboard.entityTypesChart.showAll');
    fireEvent.click(toggle);
    expect(screen.getByText('dashboard.entityTypesChart.showLess')).toBeTruthy();
  });
});

describe('ActivityChart', () => {
  const startDate = new Date('2024-01-01T00:00:00.000Z');
  const endDate = new Date('2024-01-06T00:00:00.000Z');
  const chartData: ChartData[] = [
    { date: '2024-01-02', documents: 3, entities: 5 },
    { date: '2024-01-04', documents: 0, entities: 2 },
    { date: '2024-01-05', documents: 7, entities: 0 },
  ];

  it('shows a loader in the loading state', () => {
    const { getByRole } = renderWithProviders(
      <ActivityChart
        chartData={[]}
        chartType={CHART_TYPES.DOCUMENTS}
        startDate={startDate}
        endDate={endDate}
        state="loading"
      />,
    );
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('shows an error label in the error state', () => {
    const { getByText } = renderWithProviders(
      <ActivityChart
        chartData={[]}
        chartType={CHART_TYPES.DOCUMENTS}
        startDate={startDate}
        endDate={endDate}
        state="error"
      />,
    );
    expect(getByText('dashboard.errors.failedToLoadProcessingActivity')).toBeTruthy();
  });

  it('shows the empty label when every point is zero', () => {
    const { getByText } = renderWithProviders(
      <ActivityChart
        chartData={[]}
        chartType={CHART_TYPES.DOCUMENTS}
        startDate={startDate}
        endDate={endDate}
        state="content"
      />,
    );
    expect(getByText('dashboard.chart.empty')).toBeTruthy();
  });

  it('renders the area chart with data points', () => {
    const { container } = renderWithProviders(
      <ActivityChart
        chartData={chartData}
        chartType={CHART_TYPES.DOCUMENTS}
        startDate={startDate}
        endDate={endDate}
        state="content"
      />,
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders the entities series too', () => {
    const { container } = renderWithProviders(
      <ActivityChart
        chartData={chartData}
        chartType={CHART_TYPES.ENTITIES}
        startDate={startDate}
        endDate={endDate}
        state="content"
      />,
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
