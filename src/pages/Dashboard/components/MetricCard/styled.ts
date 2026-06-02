import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { BORDERS, LAYOUT } from '@/theme';

export const CardWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden ',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.shape.sm,
  padding: theme.spacing(2.5),
  gap: theme.spacing(2),
  boxShadow: theme.customShadows.sm,
  border: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,
}));

export const TopBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: LAYOUT.topBar.offset,
  height: LAYOUT.topBar.height,
  left: theme.spacing(2.5),
  right: theme.spacing(2.5),
  borderRadius: theme.shape.xs,
  backgroundColor: theme.palette.primary[500],
}));

export const IconWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasData',
})<{ hasData: boolean }>(({ theme, hasData }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: LAYOUT.icon.md,
  height: LAYOUT.icon.md,
  borderRadius: theme.radius.circle,
  flexShrink: 0,

  backgroundColor: hasData ? theme.palette.primary[50] : theme.palette.neutral[100],

  color: hasData ? theme.palette.primary[500] : theme.palette.neutral[500],

  '& svg': {
    color: 'inherit',
  },

  '& svg path': {
    fill: 'currentColor',
  },
}));

export const Label = styled('div')(({ theme }) => ({
  ...theme.typography.labelSm,
  color: theme.palette.neutral[500],
  marginBottom: theme.spacing(0.5),
}));

export const Value = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isError',
})<{ isError?: boolean }>(({ theme, isError }) => ({
  ...theme.typography.h4,
  color: isError ? theme.palette.error.main : theme.palette.neutral[900],
}));
