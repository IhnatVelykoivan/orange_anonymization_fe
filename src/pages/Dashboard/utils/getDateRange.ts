import { endOfDay, startOfDay, subDays, subMonths } from 'date-fns';

import { CHART_RANGES, type Range } from '@/pages/Dashboard/components/ActivityChart/types';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

export const getDateRange = (range: Range): DateRange => {
  const now = new Date();

  switch (range) {
    case CHART_RANGES.TODAY:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now),
      };
    case CHART_RANGES.YESTERDAY: {
      const yesterday = subDays(now, 1);

      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday),
      };
    }
    case CHART_RANGES.DAYS_14:
      return {
        startDate: subDays(now, 13),
        endDate: now,
      };
    case CHART_RANGES.DAYS_30:
      return {
        startDate: subDays(now, 29),
        endDate: now,
      };
    case CHART_RANGES.MONTHS_3:
      return {
        startDate: subMonths(now, 3),
        endDate: now,
      };
    case CHART_RANGES.MONTHS_6:
      return {
        startDate: subMonths(now, 6),
        endDate: now,
      };
    case CHART_RANGES.CUSTOM:
      return {
        startDate: subDays(now, 6),
        endDate: now,
      };
    case CHART_RANGES.DAYS_7:
    default:
      return {
        startDate: subDays(now, 6),
        endDate: now,
      };
  }
};
