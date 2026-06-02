import { differenceInCalendarDays, isSameDay, subMonths } from 'date-fns';
import { getDateRange } from '@/pages/Dashboard/utils/getDateRange';
import { CHART_RANGES } from '@/pages/Dashboard/components/ActivityChart/types';

describe('getDateRange', () => {
  it('TODAY spans the current calendar day', () => {
    const { startDate, endDate } = getDateRange(CHART_RANGES.TODAY);
    expect(isSameDay(startDate, new Date())).toBe(true);
    expect(isSameDay(endDate, new Date())).toBe(true);
    expect(startDate.getTime()).toBeLessThan(endDate.getTime());
  });

  it('YESTERDAY spans the previous calendar day', () => {
    const { startDate, endDate } = getDateRange(CHART_RANGES.YESTERDAY);
    expect(differenceInCalendarDays(new Date(), startDate)).toBe(1);
    expect(differenceInCalendarDays(new Date(), endDate)).toBe(1);
  });

  it.each([
    [CHART_RANGES.DAYS_7, 6],
    [CHART_RANGES.DAYS_14, 13],
    [CHART_RANGES.DAYS_30, 29],
    [CHART_RANGES.CUSTOM, 6],
  ] as const)('%s spans the expected number of days back', (range, days) => {
    const { startDate, endDate } = getDateRange(range);
    expect(differenceInCalendarDays(endDate, startDate)).toBe(days);
  });

  it('MONTHS_3 / MONTHS_6 go back whole months', () => {
    const threeMonths = getDateRange(CHART_RANGES.MONTHS_3);
    const sixMonths = getDateRange(CHART_RANGES.MONTHS_6);
    expect(isSameDay(threeMonths.startDate, subMonths(new Date(), 3))).toBe(true);
    expect(isSameDay(sixMonths.startDate, subMonths(new Date(), 6))).toBe(true);
  });

  it('falls back to the 7-day window for an unknown range', () => {
    const { startDate, endDate } = getDateRange('not-a-range' as never);
    expect(differenceInCalendarDays(endDate, startDate)).toBe(6);
  });
});
