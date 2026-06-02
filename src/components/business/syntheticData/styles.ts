import type { Theme } from '@mui/material/styles';
import { BORDERS } from '@/theme';

const LOCAL_RADIUS = 2;

export const layout = {
  cardWidth: 1040,
  contentPadding: 2,
  gap: 4,
  fieldGap: 1.5,
};

export const synthetic = {
  root: (theme: Theme) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
  }),

  pageInner: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(3, 4),
    gap: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    overflowY: 'auto',
    flex: 1,
  }),

  container: () => ({
    width: '100%',
    maxWidth: layout.cardWidth,
    display: 'flex',
    flexDirection: 'column',
    gap: layout.gap,
  }),

  titleGroup: (theme: Theme) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),

  paper: (theme: Theme) => ({
    width: '100%',
    padding: theme.spacing(layout.contentPadding),
    backgroundColor: theme.palette.background.paper,
    border: `${BORDERS.card}px solid ${theme.palette.divider}`,
    boxShadow: theme.customShadows?.card ?? 'none',
    borderRadius: LOCAL_RADIUS,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(layout.gap),
  }),

  headerRow: (theme: Theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    mb: theme.spacing(1),
  }),

  dividerLine: (theme: Theme) => ({
    flex: 1,
    height: theme.spacing(0.125),
    backgroundColor: theme.palette.grey[100],
  }),

  fieldLabel: (theme: Theme) => ({
    ...theme.typography.labelSm,
    fontWeight: theme.typography.fontWeightMedium,
    mb: theme.spacing(layout.fieldGap),
    color: theme.palette.text.secondary,
  }),

  textField: (theme: Theme) => ({
    '& .MuiOutlinedInput-root': { backgroundColor: theme.palette.background.default },
  }),

  twoColumnRow: (theme: Theme) => ({
    display: 'flex',
    gap: theme.spacing(layout.gap),
    alignItems: 'flex-end',
  }),

  previewSection: (theme: Theme) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    border: `1px solid ${theme.palette.grey[100]}`,
    boxShadow: theme.customShadows?.sm ?? 'none',
    borderRadius: LOCAL_RADIUS,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),

  previewBox: (theme: Theme) => ({
    padding: theme.spacing(1.5),
    minHeight: theme.spacing(9),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: LOCAL_RADIUS,
    display: 'flex',
    alignItems: 'flex-start',
  }),

  previewText: (theme: Theme) => ({
    width: '100%',
    ...theme.typography.labelSm,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical' as unknown as string,
    WebkitLineClamp: 2 as unknown as number,
    textOverflow: 'ellipsis',
  }),

  title: (theme: Theme) => ({
    ...theme.typography.h6,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.palette.text.primary,
  }),

  subtitle: (theme: Theme) => ({
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    fontWeight: theme.typography.fontWeightRegular,
  }),

  headerTitle: (theme: Theme) => ({
    ...theme.typography.bodyMd,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.secondary,
  }),

  numberLabel: (theme: Theme) => ({
    ...theme.typography.labelSm,
    fontWeight: theme.typography.fontWeightMedium,
    mb: theme.spacing(layout.fieldGap),
    color: theme.palette.text.secondary,
  }),

  helperText: (theme: Theme) => ({
    display: 'block',
    mt: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    ...theme.typography.labelSm,
  }),

  requiredAsterisk: (theme: Theme) => ({ color: theme.palette.error.main }),

  frameworkLabel: (theme: Theme) => ({ ...theme.typography.bodyMd }),

  frameworkDesc: (theme: Theme) => ({
    color: theme.palette.text.secondary,
    ...theme.typography.labelSm,
  }),

  formatLabel: (theme: Theme) => ({
    ...theme.typography.labelSm,
    fontWeight: theme.typography.fontWeightMedium,
    mb: theme.spacing(layout.fieldGap),
    color: theme.palette.text.secondary,
  }),

  previewTitle: (theme: Theme) => ({
    ...theme.typography.body2,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.primary,
  }),

  previewSubtitle: (theme: Theme) => ({
    color: theme.palette.text.secondary,
    mt: theme.spacing(0.5),
    ...theme.typography.labelSm,
  }),

  footerLabel: (theme: Theme) => ({
    color: theme.palette.text.secondary,
    ...theme.typography.labelSm,
  }),

  footerValue: (theme: Theme) => ({
    ...theme.typography.labelSm,
    fontWeight: theme.typography.fontWeightSemiBold,
    color: theme.palette.text.secondary,
  }),

  footerRow: (theme: Theme) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
  }),

  actionRow: (theme: Theme) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    pt: theme.spacing(2),
  }),

  generateButton: (theme: Theme) => ({
    width: theme.spacing(31),
    height: theme.spacing(5),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.paper,
    border: `2px solid ${theme.palette.primary.main}`,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark ?? theme.palette.primary.main,
      borderColor: theme.palette.primary.dark ?? theme.palette.primary.main,
    },
    '&:disabled': {
      backgroundColor: theme.palette.grey[300],
      color: theme.palette.grey[400],
      borderColor: theme.palette.grey[300],
    },
    ...theme.typography.button,
    lineHeight: '20px',
    textTransform: 'none',
  }),

  warningText: (theme: Theme) => ({
    color: theme.palette.warning.main,
    ...theme.typography.labelSm,
    textAlign: 'right',
  }),
};

export default synthetic;
