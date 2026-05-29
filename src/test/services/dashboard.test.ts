import { getStats } from '@/services/dashboard/dashboardService';
import { getAnalyses, getAllAnalyses } from '@/services/dashboard/analysesService';
import { API_ROUTES } from '@/constants/api-routes';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/services/api', () => ({ api: { get } }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dashboardService.getStats', () => {
  it('GETs the overview route with filter params', async () => {
    get.mockResolvedValue({ data: { emptyState: false } });
    const params = { startDate: '2024-01-01', endDate: '2024-01-31', framework: 'hipaa' };

    const result = await getStats(params);

    expect(get).toHaveBeenCalledWith(API_ROUTES.DASHBOARD_OVERVIEW, { params });
    expect(result).toEqual({ emptyState: false });
  });

  it('GETs the overview route with undefined params when none given', async () => {
    get.mockResolvedValue({ data: {} });
    await getStats();
    expect(get).toHaveBeenCalledWith(API_ROUTES.DASHBOARD_OVERVIEW, { params: undefined });
  });
});

describe('analysesService', () => {
  it('getAnalyses GETs the analyses route with params and an abort signal', async () => {
    const data = { items: [], total: 0, page: 1, limit: 10 };
    get.mockResolvedValue({ data });
    const params = { page: 1, limit: 10, search: 'jane' };
    const controller = new AbortController();

    const result = await getAnalyses(params, controller.signal);

    expect(get).toHaveBeenCalledWith(API_ROUTES.ANALYSES, {
      params,
      signal: controller.signal,
    });
    expect(result).toEqual(data);
  });

  it('getAllAnalyses GETs the export route and returns the array', async () => {
    const rows = [{ id: 'a1' }, { id: 'a2' }];
    get.mockResolvedValue({ data: rows });

    const result = await getAllAnalyses({ framework: 'hipaa' });

    expect(get).toHaveBeenCalledWith(`${API_ROUTES.ANALYSES}/export`, {
      params: { framework: 'hipaa' },
    });
    expect(result).toEqual(rows);
  });
});
