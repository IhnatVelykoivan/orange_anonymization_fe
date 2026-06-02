import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { BORDERS } from '@/theme';

const ANALYSES_CARD_MARGIN_TOP = 24;

export const PageWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.neutral[50],
}));

export const AnalysesCard = styled(Box)(({ theme }) => ({
  marginTop: ANALYSES_CARD_MARGIN_TOP,
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  borderRadius: theme.shape.lg,
  border: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,
  boxShadow: theme.customShadows.sm,
  backgroundColor: theme.palette.common.white,
}));

export const TableContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>(({ theme, loading }) => ({
  position: 'relative',
  opacity: loading ? 0.5 : 1,
  pointerEvents: loading ? 'none' : 'auto',
  transition: theme.transitions.create('opacity', {
    duration: theme.transitions.duration.short,
  }),
}));

export const AnalysesFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2, 1, 0),
}));

export const FooterLeft = styled(Box)({
  flex: 1,
});

export const FooterRight = styled(Box)({
  marginLeft: 'auto',
});
