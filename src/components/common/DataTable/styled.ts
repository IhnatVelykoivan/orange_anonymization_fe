import { Box, Table, TableCell } from '@mui/material';
import { styled } from '@mui/material/styles';

import { BORDERS } from '@/theme';

const TABLE_WRAPPER_MARGIN_X = -3;
const TABLE_MIN_WIDTH_SPACING = 75;
const EMPTY_CELL_HEIGHT = 6;

export const TableWrapper = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  marginLeft: theme.spacing(TABLE_WRAPPER_MARGIN_X),
  marginRight: theme.spacing(TABLE_WRAPPER_MARGIN_X),
  WebkitOverflowScrolling: 'touch',
}));

export const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: theme.spacing(TABLE_MIN_WIDTH_SPACING),
  borderCollapse: 'collapse',
}));

export const HeadCell = styled(TableCell)(({ theme }) => ({
  ...theme.typography.bodyMd,
  color: theme.palette.neutral[900],
  textTransform: 'uppercase',
  borderBottom: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,
  padding: theme.spacing(1, 3),
}));

export const EmptyCell = styled(TableCell)(({ theme }) => ({
  ...theme.typography.labelMd,
  borderBottom: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,
  color: theme.palette.neutral[500],
  textAlign: 'center',
  padding: theme.spacing(4, 3),
  height: theme.spacing(EMPTY_CELL_HEIGHT),
}));

export const StateWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: theme.spacing(25),
  padding: theme.spacing(4),
}));

export const ErrorText = styled(Box)(({ theme }) => ({
  ...theme.typography.bodyMd,
  color: theme.palette.error.main,
  textAlign: 'center',
}));
