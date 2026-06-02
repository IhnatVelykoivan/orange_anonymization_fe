import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { InputAdornment } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import AddIcon from '@/assets/icons/dashboard/add.svg?react';
import { ROUTES } from '@/constants';
import { FRAMEWORK_OPTIONS } from '@/pages/Dashboard/components/DashboardFilters/constants';
import type { FrameworkValue } from '@/pages/Dashboard/components/DashboardFilters/types';
import { FilterMenuItem } from '@/pages/Dashboard/components/DashboardFilters/styled';
import { NewAnalysisButton } from '@/pages/Dashboard/styled';
import { DateRangeFilter } from '@/pages/Analyses/components/DateRangeFilter';

import {
  FiltersContainer,
  FiltersRow,
  SearchInput,
  StyledFilterSelect,
  NewAnalysisButtonWrapper,
} from './styled';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface AnalysesFiltersProps {
  search: string;
  framework: FrameworkValue;
  status: string;

  setSearch: (value: string) => void;
  setFramework: (value: FrameworkValue) => void;
  setStatus: (value: string) => void;

  dateRange: DateRange;
  setDateRange: (value: DateRange) => void;
}

const STATUS_OPTIONS = [
  {
    value: 'all',
    translationKey: 'dashboard.analyses.filters.allStatuses',
  },
  {
    value: 'succeeded',
    translationKey: 'dashboard.recentActivity.status.succeeded',
  },
  {
    value: 'failed',
    translationKey: 'dashboard.recentActivity.status.failed',
  },
  {
    value: 'queued',
    translationKey: 'dashboard.recentActivity.status.queued',
  },
  {
    value: 'processing',
    translationKey: 'dashboard.recentActivity.status.processing',
  },
  {
    value: 'draft',
    translationKey: 'dashboard.recentActivity.status.draft',
  },
  {
    value: 'configured',
    translationKey: 'dashboard.recentActivity.status.configured',
  },
] as const;

export const AnalysesFilters: React.FC<AnalysesFiltersProps> = ({
  search,
  framework,
  status,
  setSearch,
  setFramework,
  setStatus,
  dateRange,
  setDateRange,
}) => {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const handleFrameworkChange = (event: SelectChangeEvent) => {
    setFramework(event.target.value as FrameworkValue);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value);
  };

  return (
    <FiltersContainer>
      <FiltersRow>
        <SearchInput
          placeholder={t('dashboard.analyses.filters.searchByFilename')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <StyledFilterSelect
          value={framework}
          onChange={handleFrameworkChange}
          IconComponent={KeyboardArrowDownIcon}
        >
          {FRAMEWORK_OPTIONS.map((option) => (
            <FilterMenuItem key={option.value} value={option.value}>
              {t(option.translationKey)}
            </FilterMenuItem>
          ))}
        </StyledFilterSelect>

        <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />

        <StyledFilterSelect
          value={status}
          onChange={handleStatusChange}
          IconComponent={KeyboardArrowDownIcon}
        >
          {STATUS_OPTIONS.map((option) => (
            <FilterMenuItem key={option.value} value={option.value}>
              {t(option.translationKey)}
            </FilterMenuItem>
          ))}
        </StyledFilterSelect>
      </FiltersRow>

      <NewAnalysisButtonWrapper>
        <NewAnalysisButton startIcon={<AddIcon />} onClick={() => navigate(ROUTES.DE_IDENTIFY)}>
          {t('dashboard.newAnalysis')}
        </NewAnalysisButton>
      </NewAnalysisButtonWrapper>
    </FiltersContainer>
  );
};
