import { Box, Button, styled } from '@mui/material';

const SHOW_MORE_ICON_MARGIN = 8;
const SHOW_MORE_MARGIN_TOP = 37;

interface AnimatedChartContainerProps {
  height: number;
}

export const Wrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

export const AnimatedChartContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'height',
})<AnimatedChartContainerProps>(({ height }) => ({
  height,
  overflow: 'hidden',
  transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  willChange: 'height',
}));

export const ShowMoreContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: SHOW_MORE_MARGIN_TOP,
  scrollMarginBottom: theme.spacing(3),
}));

export const ShowMoreButton = styled(Button)(({ theme }) => ({
  ...theme.typography.bodyMd,
  padding: 0,
  minWidth: 'unset',
  color: theme.palette.accent.main,
  textTransform: 'none',
  transition: 'opacity 0.2s ease',

  '&:hover': {
    opacity: 0.6,
  },

  '& .MuiButton-endIcon': {
    marginLeft: SHOW_MORE_ICON_MARGIN,
  },

  '& svg': {
    fontSize: theme.typography.bodyMd.fontSize,
  },
}));
