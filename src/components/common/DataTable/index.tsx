import React from 'react';
import { TableHead, TableBody, TableRow, CircularProgress } from '@mui/material';

import { StyledTable, HeadCell, TableWrapper, EmptyCell, StateWrapper, ErrorText } from './styled';

import type { ColumnDef } from './types';

interface DataTableProps<TRow extends { id: string | number }> {
  columns: ColumnDef<TRow>[];
  rows: TRow[];

  state?: 'loading' | 'error' | 'empty' | 'content';

  emptyMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
}

export const DataTable = <TRow extends { id: string | number }>({
  columns,
  rows,
  state = 'content',
  emptyMessage,
  errorMessage,
}: DataTableProps<TRow>) => {
  return (
    <TableWrapper>
      <StyledTable>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <HeadCell key={col.key}>{col.header}</HeadCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {state === 'loading' && (
            <TableRow>
              <EmptyCell colSpan={columns.length}>
                <StateWrapper>
                  <CircularProgress />
                </StateWrapper>
              </EmptyCell>
            </TableRow>
          )}

          {state === 'error' && (
            <TableRow>
              <EmptyCell colSpan={columns.length}>
                <ErrorText>{errorMessage}</ErrorText>
              </EmptyCell>
            </TableRow>
          )}

          {state === 'empty' && (
            <TableRow>
              <EmptyCell colSpan={columns.length}>{emptyMessage}</EmptyCell>
            </TableRow>
          )}

          {state === 'content' &&
            rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <React.Fragment key={col.key}>{col.renderCell(row)}</React.Fragment>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </StyledTable>
    </TableWrapper>
  );
};
