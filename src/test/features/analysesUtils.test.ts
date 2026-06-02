import { isWithinDateRange } from '@/features/analyses/utils/dateFilter';
import { getDateRangeByPreset } from '@/features/analyses/utils/datePresets';
import { exportAnalysesToCsv } from '@/features/analyses/utils/exportCsv';
import { getEmptyChartDates } from '@/features/dashboard/utils/date';
import type { RecentActivity } from '@/services/dashboard/types';

describe('isWithinDateRange', () => {
  it('returns true when within bounds and for null bounds', () => {
    expect(isWithinDateRange('2024-06-15', new Date('2024-06-01'), new Date('2024-06-30'))).toBe(
      true,
    );
    expect(isWithinDateRange('2024-06-15', null, null)).toBe(true);
  });

  it('returns false outside the start/end bounds', () => {
    expect(isWithinDateRange('2024-05-01', new Date('2024-06-01'), null)).toBe(false);
    expect(isWithinDateRange('2024-07-01', null, new Date('2024-06-30'))).toBe(false);
  });
});

describe('getDateRangeByPreset', () => {
  it.each(['today', '7days', '30days'] as const)('returns a start and end for %s', (preset) => {
    const { start, end } = getDateRangeByPreset(preset);
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
    expect((start as Date).getTime()).toBeLessThanOrEqual((end as Date).getTime());
  });

  it('returns null bounds for an unknown preset', () => {
    expect(getDateRangeByPreset('custom')).toEqual({ start: null, end: null });
  });
});

describe('getEmptyChartDates', () => {
  it('returns 7 ascending ISO (YYYY-MM-DD) dates', () => {
    const dates = getEmptyChartDates();
    expect(dates).toHaveLength(7);
    dates.forEach((d) => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/));
    expect([...dates].sort()).toEqual(dates);
  });
});

describe('exportAnalysesToCsv', () => {
  const clickSpy = vi.fn();
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:csv');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(document.body, 'appendChild');
    vi.spyOn(document.body, 'removeChild');
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clickSpy.mockClear();
  });

  it('builds a CSV blob and triggers an analyses.csv download', () => {
    const rows: RecentActivity[] = [
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
    ];

    exportAnalysesToCsv(rows);

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy.mock.calls[0][0]).toBeInstanceOf(Blob);
    const anchor = vi.mocked(document.body.appendChild).mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('analyses.csv');
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
