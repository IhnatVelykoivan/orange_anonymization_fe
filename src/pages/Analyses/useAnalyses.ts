import { useEffect, useRef, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/store';
import { fetchAnalyses } from '@/store/slices/analysesSlice';

export type AnalysesState = 'loading' | 'error' | 'empty' | 'content';

interface Params {
  page: number;
  limit: number;
  search?: string;
  framework?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const useAnalyses = ({
  page,
  limit,
  search,
  framework,
  status,
  startDate,
  endDate,
}: Params) => {
  const dispatch = useAppDispatch();
  const { rows, total, loading, error } = useAppSelector((state) => state.analyses);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    dispatch(
      fetchAnalyses({
        page,
        limit,
        search,
        framework,
        status,
        startDate,
        endDate,
      }),
    );

    return () => controller.abort();
  }, [dispatch, page, limit, search, framework, status, startDate, endDate]);

  const state: AnalysesState = useMemo(() => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!rows.length) return 'empty';
    return 'content';
  }, [loading, error, rows]);

  return {
    rows,
    total,
    loading,
    error,
    state,
  };
};
