import dayjs from 'dayjs';

export const formatFramework = (value: string): string => {
  if (!value) return '';

  const normalized = value.trim().toLowerCase().replace(/-/g, '_');

  const map: Record<string, string> = {
    hipaa: 'HIPAA',
    gdpr: 'EU GDPR',
    eu_gdpr: 'EU GDPR',
    uk_dpi: 'UK GDPR',
    uk_gdpr: 'UK GDPR',
    swiss_fadp: 'Swiss FADP',
  };

  if (normalized === 'custom') {
    return '–';
  }

  return map[normalized] ?? capitalizeWords(value);
};

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const formatDateRangeLabel = (date: Date): string => dayjs(date).format('DD MMM');
export const formatDateInput = (date: Date): string => dayjs(date).format('D/MM/YYYY');

const capitalizeWords = (str: string): string =>
  str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
