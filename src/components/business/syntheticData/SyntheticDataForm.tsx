import {
  Box,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import StarIcon from '@mui/icons-material/Star';
import { useSyntheticDataForm } from './useSyntheticDataForm';
import synthetic from './styles';
import type { SyntheticOutputFormat } from '@/services/synthetic/types';
import { useMemo, useState } from 'react';
import SyntheticWarningPopup from '@/components/popups/SyntheticWarningPopup';

interface SyntheticDataFormProps {
  sourceJobId?: string;
}

const metrics = {
  estimateMultiplier: 2.3,
  kb: 1024,
  mbDivider: 1000,
};

const limits = {
  maxRecords: 100000,
};

const OUTPUT_FORMATS: { value: SyntheticOutputFormat }[] = [
  { value: 'CSV' },
  { value: 'JSON' },
  { value: 'XLSX' },
];

export default function SyntheticDataForm({ sourceJobId }: SyntheticDataFormProps) {
  const { t } = useTranslation();
  const {
    records,
    framework,
    outputFormat,
    loading,
    previewLoading,
    error,
    success,
    deidentifiedPreview,
    frameworks,
    isValid,
    setRecords,
    setFramework,
    setOutputFormat,
    handleSubmit,
    setError,
    setSuccess,
  } = useSyntheticDataForm(sourceJobId);

  const [, setIsWarningVisible] = useState<boolean>(!deidentifiedPreview);

  const showWarning = useMemo(() => {
    if (deidentifiedPreview === null) {
      return true;
    }
    return false;
  }, [deidentifiedPreview]);

  return (
    <Box sx={synthetic.root}>
      <Box sx={synthetic.pageInner}>
        <Box sx={synthetic.container}>
          <Box sx={synthetic.titleGroup}>
            <Typography sx={synthetic.title}>{t('syntheticData.generationSettings')}</Typography>
            <Typography sx={synthetic.subtitle}>
              {t('syntheticData.configureParameters')}
            </Typography>
          </Box>

          <Paper sx={synthetic.paper}>
            <Box>
              <Box sx={synthetic.headerRow}>
                <Typography sx={synthetic.headerTitle}>
                  {t('syntheticData.configuration')}
                </Typography>
                <Box sx={synthetic.dividerLine} />
              </Box>
            </Box>

            <Box>
              <Typography sx={synthetic.numberLabel}>
                {t('syntheticData.numberOfRecords')}
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={records}
                onChange={(e) => setRecords(Number(e.target.value))}
                size="small"
                inputProps={{ min: 1, max: limits.maxRecords }}
                sx={synthetic.textField}
              />
              <Typography sx={synthetic.helperText}>{t('syntheticData.maxRecords')}</Typography>
            </Box>

            <Box sx={synthetic.twoColumnRow}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={synthetic.numberLabel}>
                  {t('syntheticData.chooseFramework')}
                  <Typography component="span" sx={synthetic.requiredAsterisk}>
                    *
                  </Typography>
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={framework}
                    onChange={(e) => setFramework(String(e.target.value))}
                    sx={(theme) => ({
                      height: 60,
                      backgroundColor: theme.palette.background.default,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider,
                      },
                    })}
                  >
                    {frameworks.map((f) => (
                      <MenuItem key={f.value} value={f.value}>
                        <Box>
                          <Typography sx={synthetic.frameworkLabel}>
                            {t(`syntheticData.frameworks.${f.value}.label`, String(f.value))}
                          </Typography>
                          <Typography sx={synthetic.frameworkDesc}>
                            {t(`syntheticData.frameworks.${f.value}.desc`)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography sx={synthetic.formatLabel}>
                  {t('syntheticData.chooseFormat')}
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value as SyntheticOutputFormat)}
                    sx={(theme) => ({
                      height: 60,
                      backgroundColor: theme.palette.background.default,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.divider,
                      },
                    })}
                  >
                    {OUTPUT_FORMATS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {t(`syntheticData.outputFormats.${o.value.toLowerCase()}`, o.value)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={synthetic.previewSection}>
              <Box>
                <Typography sx={synthetic.previewTitle}>
                  {t('syntheticData.useDeidentified')}
                </Typography>
                <Typography sx={synthetic.previewSubtitle}>
                  {t('syntheticData.usePreviouslyDeidentified')}
                </Typography>
              </Box>

              <Box sx={synthetic.previewBox}>
                <Typography
                  title={previewLoading ? t('common.loading') : (deidentifiedPreview ?? '')}
                  sx={(theme) => ({
                    ...synthetic.previewText(theme),
                    color: theme.palette.text.secondary,
                  })}
                >
                  {previewLoading
                    ? t('common.loading')
                    : (deidentifiedPreview ?? t('syntheticData.passedFromCurrentSession'))}
                </Typography>
              </Box>
            </Box>

            <Box sx={synthetic.footerRow}>
              <Typography sx={synthetic.footerLabel}>
                {t('syntheticData.estimatedOutput')}
              </Typography>
              <Typography sx={synthetic.footerValue}>
                {((records * metrics.estimateMultiplier) / metrics.mbDivider).toFixed(2)}{' '}
                {t('common.mb')}
              </Typography>
            </Box>

            {!isValid && (
              <Typography sx={synthetic.warningText}>
                {t('syntheticData.completeRequiredFields')}
              </Typography>
            )}
          </Paper>

          <Box sx={synthetic.actionRow}>
            <Button
              variant="contained"
              disabled={!isValid || loading}
              onClick={handleSubmit}
              startIcon={<StarIcon />}
              sx={synthetic.generateButton}
            >
              {loading ? (
                <>
                  <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                  {t('syntheticData.generating')}
                </>
              ) : (
                t('syntheticData.generate')
              )}
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" variant="filled">
          {success}
        </Alert>
      </Snackbar>

      <SyntheticWarningPopup isVisible={showWarning} onClose={() => setIsWarningVisible(false)} />
    </Box>
  );
}
