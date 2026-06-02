import React, { useRef, useState } from 'react';

import { AnalysesTable } from '@/features/analyses/components/AnalysesTable';
import { useDebounce } from '@/features/analyses/hooks/useDebounce';
import { exportAnalysesToCsv } from '@/features/analyses/utils/exportCsv';

import {
  FRAMEWORK_API_VALUES,
  FRAMEWORK_VALUES,
  type FrameworkValue,
} from '@/pages/Dashboard/components/DashboardFilters/types';

import { getAllAnalyses } from '@/services/dashboard/analysesService';

import { useAnalyses } from './useAnalyses';

import { AnalysesFilters } from './components/AnalysesFilters';
import { AnalysesPagination } from './components/AnalysesPagination';
import { ExportCsvButton } from './components/ExportCsvButton';

import {
  PageWrapper,
  AnalysesCard,
  AnalysesFooter,
  TableContainer,
  FooterLeft,
  FooterRight,
} from './styled';

const ROWS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_DELAY = 300;

interface DateRange {
  start: Date | null;
  end: Date | null;
}

const Analyses: React.FC = () => {
  const tableRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [framework, setFramework] = useState<FrameworkValue>(FRAMEWORK_VALUES.ALL);
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_DELAY);

  const { rows, total, state } = useAnalyses({
    page,
    limit: ROWS_PER_PAGE,
    search: debouncedSearch.trim() || undefined,
    framework: FRAMEWORK_API_VALUES[framework],
    status: status === 'all' ? undefined : status,
    startDate: dateRange.start?.toISOString(),
    endDate: dateRange.end?.toISOString(),
  });

  const totalPages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return;

    setPage(newPage);
  };

  const handleExportCsv = async () => {
    const allRows = await getAllAnalyses({
      search: debouncedSearch.trim() || undefined,
      framework: FRAMEWORK_API_VALUES[framework],
      status: status === 'all' ? undefined : status,
      startDate: dateRange.start?.toISOString(),
      endDate: dateRange.end?.toISOString(),
    });

    exportAnalysesToCsv(allRows);
  };

  return (
    <PageWrapper>
      <AnalysesFilters
        search={search}
        framework={framework}
        status={status}
        setSearch={(value) => {
          setPage(1);
          setSearch(value);
        }}
        setFramework={(value) => {
          setPage(1);
          setFramework(value);
        }}
        setStatus={(value) => {
          setPage(1);
          setStatus(value);
        }}
        dateRange={dateRange}
        setDateRange={(value) => {
          setPage(1);
          setDateRange(value);
        }}
      />

      <AnalysesCard>
        <TableContainer ref={tableRef}>
          <AnalysesTable rows={rows} state={state} />
        </TableContainer>

        {state === 'content' && (
          <AnalysesFooter ref={footerRef}>
            <FooterLeft>
              {totalPages > 1 && (
                <AnalysesPagination
                  page={page}
                  totalPages={totalPages}
                  onChange={handlePageChange}
                />
              )}
            </FooterLeft>

            <FooterRight>
              <ExportCsvButton onClick={handleExportCsv} />
            </FooterRight>
          </AnalysesFooter>
        )}
      </AnalysesCard>
    </PageWrapper>
  );
};

export default Analyses;
