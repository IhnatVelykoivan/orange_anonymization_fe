import { renderHook } from '@testing-library/react';
import { useDashboard } from '@/pages/Dashboard/useDashboard';
import { CHART_RANGES } from '@/pages/Dashboard/components/ActivityChart/types';
import { FRAMEWORK_VALUES } from '@/pages/Dashboard/components/DashboardFilters/types';
import type { DashboardData } from '@/services/dashboard/types';

const mockDispatch = vi.fn();
let mockDashboard: { data: DashboardData | null; loading: boolean; error: string | null };

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) => selector({ dashboard: mockDashboard }),
}));

const fullData: DashboardData = {
  metrics: { totalDocuments: 7, entitiesDetected: 12, anonymizationRate: 95, syntheticRecords: 4 },
  chartData: [{ date: '2024-01-01', documents: 1, entities: 2 }],
  recentActivity: [],
  strategiesDistribution: [{ key: 'Redact', count: 3 }],
  frameworksDistribution: [],
  entitiesDistribution: [],
  emptyState: false,
};

const renderDashboard = () =>
  renderHook(() => useDashboard({ range: CHART_RANGES.DAYS_7, framework: FRAMEWORK_VALUES.ALL }));

beforeEach(() => {
  mockDispatch.mockClear();
  mockDashboard = { data: null, loading: false, error: null };
});

describe('useDashboard', () => {
  it('dispatches fetchDashboardData on mount', () => {
    renderDashboard();
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('reports the loading state', () => {
    mockDashboard.loading = true;
    expect(renderDashboard().result.current.state).toBe('loading');
  });

  it('reports the error state', () => {
    mockDashboard.error = 'Failed';
    expect(renderDashboard().result.current.state).toBe('error');
  });

  it('reports the empty state when the backend flags emptyState', () => {
    mockDashboard.data = { ...fullData, emptyState: true };
    expect(renderDashboard().result.current.state).toBe('empty');
  });

  it('reports content and exposes derived data when populated', () => {
    mockDashboard.data = fullData;
    const { result } = renderDashboard();
    expect(result.current.state).toBe('content');
    expect(result.current.metrics).toEqual(fullData.metrics);
    expect(result.current.strategiesDistribution).toEqual(fullData.strategiesDistribution);
    expect(result.current.chartData).toHaveLength(1);
  });

  it('falls back to safe defaults when data is null', () => {
    const { result } = renderDashboard();
    expect(result.current.metrics).toBeNull();
    expect(result.current.recentActivity).toEqual([]);
    expect(result.current.entitiesDistribution).toEqual([]);
  });
});
