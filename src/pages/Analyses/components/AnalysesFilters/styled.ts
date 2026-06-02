import { Box, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

import { BORDERS } from '@/theme';
import { FilterSelect } from '@/pages/Dashboard/components/DashboardFilters/styled';

const SEARCH_INPUT_HEIGHT = 36;

export const FiltersContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(4),
  marginInline: theme.spacing(-4),
  paddingInline: theme.spacing(4),
  borderBottom: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,

  [theme.breakpoints.down('lg')]: {
    gap: theme.spacing(1.5),
    paddingBottom: theme.spacing(2),
    marginInline: theme.spacing(-2),
    paddingInline: theme.spacing(2),
  },

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: theme.spacing(1.5),
  },

  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    marginInline: theme.spacing(-1.5),
    paddingInline: theme.spacing(1.5),
  },
}));

export const FiltersRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  flex: 1,
  minWidth: 0,

  [theme.breakpoints.down('md')]: {
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },

  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  },
}));

export const SearchInput = styled(TextField)(({ theme }) => ({
  ...theme.typography.bodyMd,
  minWidth: 220,
  maxWidth: 420,
  width: '100%',

  [theme.breakpoints.down('md')]: {
    minWidth: 'unset',
    maxWidth: '100%',
    flexBasis: '100%',
  },

  [theme.breakpoints.down('sm')]: {
    minWidth: 'unset',
    maxWidth: '100%',
  },

  '& .MuiOutlinedInput-root': {
    height: SEARCH_INPUT_HEIGHT,
    borderRadius: theme.shape.sm,
    backgroundColor: theme.palette.common.white,

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.neutral[200],
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary[500],
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary[500],
    },
  },

  '& .MuiInputBase-input': {
    ...theme.typography.bodyMd,
    color: theme.palette.neutral[700],
    padding: theme.spacing(1, 1.5),
  },
}));

export const StyledFilterSelect = styled(FilterSelect)(({ theme }) => ({
  flex: 1,
  minWidth: 180,

  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: 'unset',
  },
}));

export const DateRangeFilterWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 140,
  display: 'contents',

  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: 'unset',
  },
}));

export const NewAnalysisButtonWrapper = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',

  [theme.breakpoints.down('md')]: {
    width: '100%',

    '& > button': {
      width: '100%',
    },
  },
}));
