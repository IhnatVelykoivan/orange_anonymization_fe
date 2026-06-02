import React, { useMemo, useState } from 'react';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { InputAdornment } from '@mui/material';

import { DayPicker } from 'react-day-picker';
import { enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import 'react-day-picker/dist/style.css';

import { formatDateInput, formatDateRangeLabel } from '@/features/analyses/utils/formatters';

import { CalendarCaption } from './CalendarCaption';

import {
  ActionsRow,
  ApplyButton,
  CalendarsWrapper,
  CancelButton,
  DateFilterButton,
  DateFilterPopover,
  DateInput,
  DateInputsRow,
  DatePopoverContent,
  DatePopoverTitle,
} from './styled';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  setDateRange: (value: DateRange) => void;
  open?: boolean;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ dateRange, setDateRange }) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(dateRange.start);
  const [endDate, setEndDate] = useState<Date | null>(dateRange.end);
  const [startMonth, setStartMonth] = useState<Date>(dateRange.start ?? new Date());
  const [endMonth, setEndMonth] = useState<Date>(dateRange.end ?? new Date());

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
    setStartMonth(dateRange.start ?? new Date());
    setEndMonth(dateRange.end ?? new Date());
    setAnchorEl(e.currentTarget);
  };

  const handleApply = () => {
    setDateRange({
      start: startDate ? startOfDay(startDate) : null,
      end: endDate ? endOfDay(endDate) : null,
    });
    setAnchorEl(null);
  };

  const handleCancel = () => {
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
    setAnchorEl(null);
  };

  const label = useMemo(() => {
    const start = dateRange.start ? formatDateRangeLabel(dateRange.start) : '';
    const end = dateRange.end ? formatDateRangeLabel(dateRange.end) : '';

    if (start && end) {
      return `${start} - ${end}`;
    }

    if (start) {
      return `${t('dashboard.analyses.filters.from')} ${start}`;
    }

    if (end) {
      return `${t('dashboard.analyses.filters.to')} ${end}`;
    }

    return t('dashboard.analyses.filters.date');
  }, [dateRange.start, dateRange.end, t]);

  const sharedModifiers = {
    range_start: (date: Date) => !!startDate && date.toDateString() === startDate.toDateString(),
    range_end: (date: Date) => !!endDate && date.toDateString() === endDate.toDateString(),
    range: (date: Date) => !!startDate && !!endDate && date >= startDate && date <= endDate,
  };

  const sharedModifiersClassNames = {
    range: 'rdp-range_middle',
    range_start: 'rdp-range_start',
    range_end: 'rdp-range_end',
  };

  const sharedProps = {
    numberOfMonths: 1,
    showOutsideDays: true,
    fixedWeeks: true,
    weekStartsOn: 0 as const,
    locale: enUS,
    components: { MonthCaption: CalendarCaption },
    startMonth: new Date(2000, 0),
    endMonth: new Date(2050, 11),
    modifiers: sharedModifiers,
    modifiersClassNames: sharedModifiersClassNames,
  };

  return (
    <>
      <DateFilterButton
        open={open}
        variant="outlined"
        endIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        onClick={handleOpen}
      >
        {label}
      </DateFilterButton>

      <DateFilterPopover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCancel}
        marginThreshold={0}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <DatePopoverContent>
          <DatePopoverTitle>{t('dashboard.analyses.filters.selectDateRange')}</DatePopoverTitle>

          <DateInputsRow>
            <DateInput
              fullWidth
              label={t('dashboard.analyses.filters.startDate')}
              $hasValue={!!startDate}
              value={startDate ? formatDateInput(startDate) : ''}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarMonthIcon />
                  </InputAdornment>
                ),
              }}
            />

            <DateInput
              fullWidth
              label={t('dashboard.analyses.filters.endDate')}
              $hasValue={!!endDate}
              value={endDate ? formatDateInput(endDate) : ''}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarMonthIcon />
                  </InputAdornment>
                ),
              }}
            />
          </DateInputsRow>

          <CalendarsWrapper>
            <DayPicker
              {...sharedProps}
              mode="single"
              month={startMonth}
              onMonthChange={setStartMonth}
              selected={startDate ?? undefined}
              onSelect={(date) => {
                if (!date) return;

                setStartDate(date);

                if (endDate && date > endDate) {
                  setEndDate(null);
                }
              }}
            />

            <DayPicker
              {...sharedProps}
              mode="single"
              month={endMonth}
              onMonthChange={setEndMonth}
              selected={endDate ?? undefined}
              onSelect={(date) => {
                if (!date) return;

                if (startDate && date < startDate) {
                  setStartDate(null);
                  setEndDate(date);
                  return;
                }

                setEndDate(date);
              }}
            />
          </CalendarsWrapper>

          <ActionsRow>
            <CancelButton onClick={handleCancel}>
              {t('dashboard.analyses.filters.cancel')}
            </CancelButton>
            <ApplyButton onClick={handleApply}>{t('dashboard.analyses.filters.apply')}</ApplyButton>
          </ActionsRow>
        </DatePopoverContent>
      </DateFilterPopover>
    </>
  );
};
