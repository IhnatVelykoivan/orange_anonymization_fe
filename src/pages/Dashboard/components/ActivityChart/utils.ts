import { CHART_CONSTANTS } from './constants';

export const formatChartDate = (value: string): string => {
  const date = new Date(value.replace(' ', 'T'));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, '0');

  const month = date.toLocaleString(CHART_CONSTANTS.LOCALE.ENGLISH, {
    month: CHART_CONSTANTS.MONTH_FORMAT.SHORT,
  });

  return `${day} ${month}`;
};
