import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Popover,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';

import { BORDERS } from '@/theme';

const SEARCH_INPUT_HEIGHT = 36;
const DATE_POPOVER_WIDTH = 680;

const DATE_POPOVER_SHADOW =
  '0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)';

const DATE_INPUT_WIDTH = 316;
const DATE_INPUT_HEIGHT = 56;
const CALENDAR_DAY_SIZE = 40;
const CALENDAR_DAY_SIZE_PX = `${CALENDAR_DAY_SIZE}px`;
const ICON_SIZE = 24;
const CIRCLE_BORDER_RADIUS = '999px';
const CAPTION_SELECT_MIN_WIDTH = 74;
const CAPTION_SELECT_HEIGHT = 40;
const CHECK_ICON_CONTAINER_WIDTH = 20;

const CALENDAR_DAY_DIMENSIONS = {
  width: `${CALENDAR_DAY_SIZE}px !important`,
  height: `${CALENDAR_DAY_SIZE}px !important`,
  minWidth: `${CALENDAR_DAY_SIZE}px !important`,
  maxWidth: `${CALENDAR_DAY_SIZE}px !important`,
};

export const DateFilterButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  ...theme.typography.bodyMd,
  height: SEARCH_INPUT_HEIGHT,
  border: `${BORDERS.card}px solid ${open ? theme.palette.primary[500] : theme.palette.neutral[200]}`,
  textTransform: 'none',
  borderRadius: theme.shape.sm,
  justifyContent: 'space-between',
  paddingInline: theme.spacing(1.5),
  backgroundColor: theme.palette.common.white,
  color: theme.palette.neutral[700],
  whiteSpace: 'nowrap',
  padding: theme.spacing(0.75, 1.5),
  flex: 1,
  minWidth: 180,

  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: 'unset',
  },

  ...(open && {
    boxShadow: `0 0 0 1px ${theme.palette.primary[500]}`,
  }),

  '&:hover': {
    borderColor: open ? theme.palette.primary[500] : theme.palette.primary[500],
    backgroundColor: theme.palette.common.white,
  },

  '&.Mui-focusVisible': {
    borderColor: theme.palette.primary[500],
  },

  '& .MuiButton-endIcon svg': {
    color: theme.palette.neutral[700],
    fontSize: ICON_SIZE,
  },
}));

export const DatePopoverContent = styled(Box)(({ theme }) => ({
  ...theme.typography.h5,
  width: DATE_POPOVER_WIDTH,
  marginBottom: 0,
  padding: theme.spacing(2),
  boxSizing: 'border-box',
}));

export const DatePopoverTitle = styled(Typography)(({ theme }) => ({
  ...theme.typography.h5,
  paddingBottom: theme.spacing(1),
  borderBottom: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,
  color: theme.palette.neutral[900],
  marginBottom: theme.spacing(2),
}));

export const DateFilterPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    marginTop: theme.spacing(1),
    overflow: 'visible',
    borderRadius: theme.shape.lg,
    border: `${BORDERS.card}px solid ${theme.palette.neutral[200]}`,
    boxShadow: DATE_POPOVER_SHADOW,
  },
}));

export const DateInputsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),

  '& .MuiFormControl-root': {
    flex: 1,
  },
}));

export const DateInput = styled(TextField, {
  shouldForwardProp: (prop) => prop !== '$hasValue',
})<{ $hasValue?: boolean }>(({ theme, $hasValue }) => ({
  '& .MuiOutlinedInput-root': {
    width: DATE_INPUT_WIDTH,
    height: DATE_INPUT_HEIGHT,
    borderRadius: theme.shape.sm,

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.neutral[300],
    },

    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.neutral[300],
    },
  },

  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.neutral[900],
  },

  '& .MuiInputLabel-root': {
    top: '50%',
    transform: 'translate(14px, -50%)',
    color: theme.palette.neutral[500],
  },

  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.neutral[500],
  },

  '& .MuiInputLabel-shrink': {
    top: 0,
    transform: 'translate(14px, -9px) scale(0.75)',
  },

  '& .MuiInputBase-input': {
    ...theme.typography.labelMd,
    color: theme.palette.neutral[900],
  },

  '& .MuiInputAdornment-root svg': {
    color: $hasValue ? theme.palette.neutral[900] : theme.palette.neutral[500],
    fontSize: ICON_SIZE,
  },

  '& .MuiOutlinedInput-root.Mui-focused .MuiInputAdornment-root svg': {
    color: theme.palette.neutral[900],
  },
}));

export const CalendarsWrapper = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  alignItems: 'start',
  columnGap: theme.spacing(2),

  '& .rdp': {
    '--rdp-cell-size': CALENDAR_DAY_SIZE_PX,
    '--rdp-day_button-size': CALENDAR_DAY_SIZE_PX,
    '--rdp-accent-color': 'transparent',
    '--rdp-accent-background-color': 'transparent',
    '--rdp-background-color': 'transparent',
    '--rdp-selected-border': 'none',
    '--rdp-range_start-color': theme.palette.common.white,
    '--rdp-range_start-background': theme.palette.primary[500],
    '--rdp-range_start-date-background-color': theme.palette.primary[500],
    '--rdp-range_end-color': theme.palette.common.white,
    '--rdp-range_end-background': theme.palette.primary[500],
    '--rdp-range_end-date-background-color': theme.palette.primary[500],
    '--rdp-range_middle-background-color': theme.palette.primary[50],
    margin: '0 auto',
  },

  '& .rdp-button_previous, & .rdp-button_next': {
    display: 'none',
  },

  '& .rdp-month': {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  '& .rdp-month_caption': {
    width: '100%',
  },

  '& .rdp-weekdays': {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },

  '& .rdp-weekday': {
    ...theme.typography.bodyMd,
    ...CALENDAR_DAY_DIMENSIONS,
    color: theme.palette.neutral[700],
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },

  '& .rdp-week': {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },

  '& .rdp-weeks': {
    width: '100%',
  },

  '& .rdp-month_grid': {
    width: '100%',
    borderCollapse: 'collapse',
  },

  '& .rdp-day': {
    ...CALENDAR_DAY_DIMENSIONS,
    padding: 0,
    margin: 0,
    background: 'transparent !important',
    backgroundColor: 'transparent !important',
    position: 'relative',
  },

  '& .rdp-range_start::before, & .rdp-range_end::before': {
    display: 'none !important',
  },
  '& .rdp-range_start::after, & .rdp-range_end::after': {
    display: 'none !important',
  },

  '& .rdp-day_button': {
    ...theme.typography.bodyMd,
    ...CALENDAR_DAY_DIMENSIONS,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 !important',
    margin: '0 !important',
    border: 'none !important',
    borderRadius: `${CIRCLE_BORDER_RADIUS} !important`,
    backgroundColor: 'transparent !important',
    background: 'transparent !important',
    color: theme.palette.neutral[900],
    outline: 'none !important',
    boxShadow: 'none !important',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  },

  '& .rdp-day_button:hover': {
    backgroundColor: `${theme.palette.primary[50]} !important`,
    background: `${theme.palette.primary[50]} !important`,
  },

  '& .rdp-day_button:focus, & .rdp-day_button:focus-visible, & .rdp-day_button:active': {
    outline: 'none !important',
    boxShadow: 'none !important',
  },

  '& .rdp-day_button::before, & .rdp-day_button::after': {
    display: 'none !important',
  },

  '& .rdp-selected': {
    background: 'transparent !important',
    backgroundColor: 'transparent !important',
  },

  '& .rdp-day_outside .rdp-day_button, & .rdp-outside .rdp-day_button': {
    color: `${theme.palette.neutral[300]} !important`,
  },

  '& .rdp-day_outside .rdp-day_button:hover, & .rdp-outside .rdp-day_button:hover': {
    color: `${theme.palette.neutral[300]} !important`,
    backgroundColor: `${theme.palette.primary[50]} !important`,
    background: `${theme.palette.primary[50]} !important`,
  },

  '& .rdp-range_middle': {
    backgroundColor: `${theme.palette.primary[50]} !important`,
    background: `${theme.palette.primary[50]} !important`,
    borderRadius: '0 !important',
  },

  '& .rdp-range_middle .rdp-day_button': {
    backgroundColor: 'transparent !important',
    background: 'transparent !important',
    color: `${theme.palette.neutral[900]} !important`,
    borderRadius: '0 !important',
    border: 'none !important',
  },

  '& .rdp-range_middle .rdp-day_button:hover': {
    backgroundColor: 'transparent !important',
    background: 'transparent !important',
  },

  '& .rdp-range_middle.rdp-day_outside .rdp-day_button, & .rdp-range_middle.rdp-outside .rdp-day_button':
    {
      color: `${theme.palette.neutral[300]} !important`,
    },

  '& .rdp-range_start': {
    background: `linear-gradient(to right, transparent 50%, ${theme.palette.primary[50]} 50%) !important`,
    backgroundColor: 'transparent !important',
    borderRadius: '0 !important',
  },

  '& .rdp-range_start .rdp-day_button': {
    backgroundColor: `${theme.palette.primary[500]} !important`,
    background: `${theme.palette.primary[500]} !important`,
    color: `${theme.palette.common.white} !important`,
    borderRadius: `${CIRCLE_BORDER_RADIUS} !important`,
    border: 'none !important',
    position: 'relative',
    zIndex: 1,
  },

  '& .rdp-range_start .rdp-day_button:hover': {
    backgroundColor: `${theme.palette.primary[500]} !important`,
    background: `${theme.palette.primary[500]} !important`,
    color: `${theme.palette.common.white} !important`,
  },

  '& .rdp-range_end': {
    background: `linear-gradient(to left, transparent 50%, ${theme.palette.primary[50]} 50%) !important`,
    backgroundColor: 'transparent !important',
    borderRadius: '0 !important',
  },

  '& .rdp-range_end .rdp-day_button': {
    backgroundColor: `${theme.palette.primary[500]} !important`,
    background: `${theme.palette.primary[500]} !important`,
    color: `${theme.palette.common.white} !important`,
    borderRadius: `${CIRCLE_BORDER_RADIUS} !important`,
    border: 'none !important',
    position: 'relative',
    zIndex: 1,
  },

  '& .rdp-range_end .rdp-day_button:hover': {
    backgroundColor: `${theme.palette.primary[500]} !important`,
    background: `${theme.palette.primary[500]} !important`,
    color: `${theme.palette.common.white} !important`,
  },

  '& .rdp-range_start.rdp-range_end': {
    background: 'transparent !important',
    backgroundColor: 'transparent !important',
  },

  '& .rdp-range_start.rdp-range_middle': {
    background: `linear-gradient(to right, transparent 50%, ${theme.palette.primary[50]} 50%) !important`,
  },

  '& .rdp-range_end.rdp-range_middle': {
    background: `linear-gradient(to left, transparent 50%, ${theme.palette.primary[50]} 50%) !important`,
  },

  '& .rdp-today .rdp-day_button, & .rdp-day_today .rdp-day_button': {
    backgroundColor: `${theme.palette.common.white} !important`,
    background: `${theme.palette.common.white} !important`,
    color: `${theme.palette.primary[500]} !important`,
    border: `${BORDERS.card}px solid ${theme.palette.primary[500]} !important`,
    borderRadius: `${CIRCLE_BORDER_RADIUS} !important`,
    fontWeight: theme.typography.fontWeightBold,
  },

  '& .rdp-range_middle .rdp-today .rdp-day_button, & .rdp-range_middle.rdp-today .rdp-day_button': {
    backgroundColor: `${theme.palette.common.white} !important`,
    background: `${theme.palette.common.white} !important`,
    color: `${theme.palette.primary[500]} !important`,
    border: `${BORDERS.card}px solid ${theme.palette.primary[500]} !important`,
  },

  '& .rdp-range_start .rdp-today .rdp-day_button, & .rdp-range_start.rdp-today .rdp-day_button': {
    backgroundColor: `${theme.palette.primary[500]} !important`,
    background: `${theme.palette.primary[500]} !important`,
    color: `${theme.palette.common.white} !important`,
    border: 'none !important',
  },

  '& .rdp-range_end .rdp-today .rdp-day_button, & .rdp-range_end.rdp-today .rdp-day_button': {
    backgroundColor: `${theme.palette.primary[500]} !important`,
    background: `${theme.palette.primary[500]} !important`,
    color: `${theme.palette.common.white} !important`,
    border: 'none !important',
  },
}));

export const ActionsRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  ...theme.typography.labelMd,
  textTransform: 'none',
  color: theme.palette.neutral[500],
}));

export const ApplyButton = styled(Button)(({ theme }) => ({
  ...theme.typography.labelMd,
  textTransform: 'none',
  color: theme.palette.accent[400],
}));

export const CaptionContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  marginBottom: theme.spacing(1),
}));

export const CaptionGroup = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
}));

export const CaptionArrowButton = styled(IconButton)(({ theme }) => ({
  width: CALENDAR_DAY_SIZE,
  height: CALENDAR_DAY_SIZE,
  borderRadius: theme.shape.sm,
  color: theme.palette.neutral[500],

  '&:hover': {
    backgroundColor: theme.palette.neutral[200],
  },

  '& svg': {
    fontSize: ICON_SIZE,
    color: theme.palette.neutral[500],
  },
}));

export const CaptionSelect = styled(Select)(({ theme }) => ({
  minWidth: CAPTION_SELECT_MIN_WIDTH,
  height: CAPTION_SELECT_HEIGHT,

  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },

  '&.MuiOutlinedInput-root': {
    border: 'none',
  },

  '&.MuiInputBase-root': {
    border: 'none',
  },

  '&:before, &:after': {
    display: 'none',
  },

  '& .MuiSelect-select': {
    display: 'flex',
    alignItems: 'center',
    ...theme.typography.labelMd,
    color: theme.palette.neutral[700],
  },

  '& .MuiSvgIcon-root': {
    fontSize: ICON_SIZE,
    color: theme.palette.neutral[500],
  },

  '&:hover': {
    backgroundColor: theme.palette.neutral[200],
  },

  '&.Mui-focused': {
    backgroundColor: theme.palette.neutral[200],
  },
}));

export const CaptionMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

export const CaptionCheckIconContainer = styled(Box)(() => ({
  width: CHECK_ICON_CONTAINER_WIDTH,
  display: 'flex',
  justifyContent: 'center',
  flexShrink: 0,
}));

export const CaptionCheckIcon = styled(CheckIcon)(({ theme }) => ({
  fontSize: ICON_SIZE,
  color: theme.palette.primary[500],
}));
