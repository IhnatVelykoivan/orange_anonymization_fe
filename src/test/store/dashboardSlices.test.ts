import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer, { fetchDashboardData } from '@/store/slices/dashboardSlice';
import analysesReducer, { fetchAnalyses } from '@/store/slices/analysesSlice';
import { getStats } from '@/services/dashboard/dashboardService';
import { getAnalyses } from '@/services/dashboard/analysesService';
import type { DashboardData, AnalysesResponse } from '@/services/dashboard/types';

vi.mock('@/services/dashboard/dashboardService', () => ({ getStats: vi.fn() }));
vi.mock('@/services/dashboard/analysesService', () => ({ getAnalyses: vi.fn() }));

const dashboardData: DashboardData = {
  metrics: { totalDocuments: 10, entitiesDetected: 5, anonymizationRate: 0.9, syntheticRecords: 3 },
  chartData: [],
  recentActivity: [],
  strategiesDistribution: [],
  frameworksDistribution: [],
  entitiesDistribution: [],
  emptyState: false,
};

const dashboardInitial = { data: null, loading: false, error: null };

describe('dashboardSlice', () => {
  it('returns the initial state', () => {
    expect(dashboardReducer(undefined, { type: '@@INIT' })).toEqual(dashboardInitial);
  });

  it('pending sets loading and clears any prior error', () => {
    const state = dashboardReducer(
      { ...dashboardInitial, error: 'old error' },
      fetchDashboardData.pending('req-1', undefined),
    );
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('fulfilled stores the payload and stops loading', () => {
    const state = dashboardReducer(
      { ...dashboardInitial, loading: true },
      fetchDashboardData.fulfilled(dashboardData, 'req-1', undefined),
    );
    expect(state.loading).toBe(false);
    expect(state.data).toEqual(dashboardData);
    expect(state.error).toBeNull();
  });

  it('rejected with a payload surfaces that error message', () => {
    const state = dashboardReducer(
      { ...dashboardInitial, loading: true },
      fetchDashboardData.rejected(new Error('boom'), 'req-1', undefined, 'Server down'),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Server down');
  });

  it('rejected without a payload falls back to the generic error', () => {
    const state = dashboardReducer(
      { ...dashboardInitial, loading: true },
      fetchDashboardData.rejected(new Error('boom'), 'req-1', undefined),
    );
    expect(state.error).toBe('errors.generic');
  });
});

const analysesResponse: AnalysesResponse = { data: [], total: 42, page: 2, limit: 10 };

const analysesInitial = {
  rows: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
};

describe('analysesSlice', () => {
  it('returns the initial state', () => {
    expect(analysesReducer(undefined, { type: '@@INIT' })).toEqual(analysesInitial);
  });

  it('pending sets loading and clears any prior error', () => {
    const state = analysesReducer(
      { ...analysesInitial, error: 'old error' },
      fetchAnalyses.pending('req-1', undefined),
    );
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('fulfilled maps rows, total, page and limit from the payload', () => {
    const state = analysesReducer(
      { ...analysesInitial, loading: true },
      fetchAnalyses.fulfilled(analysesResponse, 'req-1', undefined),
    );
    expect(state.loading).toBe(false);
    expect(state.total).toBe(42);
    expect(state.page).toBe(2);
    expect(state.rows).toEqual([]);
  });

  it('rejected with a payload surfaces that error message', () => {
    const state = analysesReducer(
      { ...analysesInitial, loading: true },
      fetchAnalyses.rejected(new Error('boom'), 'req-1', undefined, 'Network error'),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('rejected without a payload falls back to the default message', () => {
    const state = analysesReducer(
      { ...analysesInitial, loading: true },
      fetchAnalyses.rejected(new Error('boom'), 'req-1', undefined),
    );
    expect(state.error).toBe('Failed to load analyses');
  });
});

describe('fetchDashboardData (thunk)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getStats and stores the result on success', async () => {
    vi.mocked(getStats).mockResolvedValue(dashboardData);
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    await store.dispatch(fetchDashboardData({ framework: 'hipaa' }));

    expect(getStats).toHaveBeenCalledWith({ framework: 'hipaa' });
    expect(store.getState().dashboard.data).toEqual(dashboardData);
    expect(store.getState().dashboard.loading).toBe(false);
  });

  it('maps a thrown error into the rejected state', async () => {
    vi.mocked(getStats).mockRejectedValue(new Error('Stats unavailable'));
    const store = configureStore({ reducer: { dashboard: dashboardReducer } });

    await store.dispatch(fetchDashboardData());

    expect(store.getState().dashboard.error).toBe('Stats unavailable');
    expect(store.getState().dashboard.loading).toBe(false);
  });
});

describe('fetchAnalyses (thunk)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getAnalyses and stores the result on success', async () => {
    vi.mocked(getAnalyses).mockResolvedValue(analysesResponse);
    const store = configureStore({ reducer: { analyses: analysesReducer } });

    await store.dispatch(fetchAnalyses({ page: 2 }));

    expect(getAnalyses).toHaveBeenCalled();
    expect(store.getState().analyses.total).toBe(42);
    expect(store.getState().analyses.loading).toBe(false);
  });

  it('maps a thrown error into the rejected state', async () => {
    vi.mocked(getAnalyses).mockRejectedValue(new Error('Boom'));
    const store = configureStore({ reducer: { analyses: analysesReducer } });

    await store.dispatch(fetchAnalyses());

    expect(store.getState().analyses.error).toBe('Boom');
  });
});
