import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { BORDERS } from '@/theme';

export const CardWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'start',
  minHeight: 430,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.lg,
  boxShadow: theme.customShadows.sm,

  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
  },
}));

export const Title = styled('div')(({ theme }) => ({
  ...theme.typography.h5,
  color: theme.palette.neutral[900],
  marginBottom: theme.spacing(0.5),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const Subtitle = styled('div')(({ theme }) => ({
  ...theme.typography.labelSm,
  color: theme.palette.neutral[500],
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const SectionDivider = styled(Box)(({ theme }) => ({
  height: BORDERS.divider,
  borderRadius: BORDERS.dividerRadius,
  backgroundColor: theme.palette.neutral[200],
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
}));

export const EmptyBody = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: theme.spacing(4.7, 0),
  gap: theme.spacing(1.25),
}));

export const EmptyLabel = styled('div')(({ theme }) => ({
  ...theme.typography.labelMd,
  color: theme.palette.neutral[500],
}));

export const ErrorLabel = styled('div')(({ theme }) => ({
  ...theme.typography.labelMd,
  color: theme.palette.error.main,
}));
