import {
  JobStatus,
  type EntityDetection,
  type IJob,
  type JobResults,
} from '@/pages/DeIdentify/types';
import { jobsService } from '@/services/jobsService';
import { resultsService } from '@/services/resultsService';
import {
  ContentCopy,
  Download,
  AccountCircleOutlined as AccountCircleOutlinedIcon,
  ArrowForwardOutlined as ArrowForwardOutlinedIcon,
  CheckOutlined as CheckOutlinedIcon,
  WarningAmberOutlined as WarningAmberOutlinedIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Stack,
  alpha,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from '@mui/material';
import { useEffect, useState, type FC, useRef, type JSX, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FONT_SIZES } from '@/constants';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setJobAC } from '@/store/slices/jobsSlice';
import { getUniqueEntities, presidioToHipaaMap } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';

const getEntityColor = (type: string) => {
  const map: Record<string, string> = {
    PERSON: 'PERSON',
    EMAIL_ADDRESS: 'EMAIL_ADDRESS',
    PHONE_NUMBER: 'PHONE_NUMBER',
    FAX: 'PHONE_NUMBER',
    US_SSN: 'US_SSN',
    LOCATION: 'LOCATION',
    DATE_TIME: 'DATE_TIME',
    URL: 'URL',
    IP_ADDRESS: 'IP_ADDRESS',
    MEDICAL_LICENSE: 'MEDICAL_LICENSE',
    CREDIT_CARD: 'CREDIT_CARD',
    ACCOUNT: 'IBAN_CODE',
    LICENSE: 'US_DRIVER_LICENSE',
    MRN: 'MEDICAL_RECORD_NUMBER',
    ZIP: 'US_ZIP_CODE',
    VEHICLE: 'US_PASSPORT',
    IBAN_CODE: 'IBAN_CODE',
    US_DRIVER_LICENSE: 'US_DRIVER_LICENSE',
    MEDICAL_RECORD_NUMBER: 'MEDICAL_RECORD_NUMBER',
  };

  const paletteKey = map[type] || 'DEFAULT';

  return `entities.${paletteKey}`;
};

interface IProps {
  jobId: string;
}

const ReviewAndRun: FC<IProps> = ({ jobId }) => {
  const { t } = useTranslation();

  const sortOptions = useMemo(
    () => [
      { id: 'confidence_desc', title: t('deIdentify.results.sortOptions.orderInDocument') },
      { id: 'confidence_asc', title: t('deIdentify.results.sortOptions.confidence') },
      { id: 'position_asc', title: t('deIdentify.results.sortOptions.type') },
    ],
    [t],
  );

  const [isProcessing, setIsProcessing] = useState(true);
  const [isError, setIsError] = useState(false);
  const [results, setResults] = useState<JobResults | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('original');
  const [selectedOptionId, setSelectedOptionId] = useState('confidence_asc');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);
  const [isToggling, setIsToggling] = useState(false);

  const localOriginalText = useAppSelector((state) => state.jobs.localOriginalTexts[jobId]);
  const { currentJob } = useAppSelector((state) => state.jobs);
  const dispatch = useAppDispatch();

  const textToDisplay = localOriginalText || '';

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredEntities =
    results?.entityTable.filter((entity) => {
      if (selectedEntityTypes.length === 0) return true;
      return selectedEntityTypes.includes(entity.entity_type);
    }) || [];

  const sortedEntities = [...filteredEntities].sort((a, b) => {
    switch (selectedOptionId) {
      case 'confidence_asc':
        return b.score - a.score;

      case 'position_asc':
        return a.entity_type.localeCompare(b.entity_type);

      case 'confidence_desc':
      default:
        return a.start - b.start;
    }
  });

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleError = (defaultKey: string) => {
    setErrorMessage(t(defaultKey));
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getResults = async () => {
    try {
      const response = await resultsService.getResults(jobId);
      setResults(response);
      setIsProcessing(false);
      stopPolling();
    } catch {
      setIsError(true);
      stopPolling();
    }
  };

  const checkStatus = async () => {
    try {
      const job = await jobsService.getJobById(jobId);

      if (job.status === JobStatus.SUCCEEDED) {
        await getResults();
        dispatch(setJobAC(job));
      } else if (job.status === JobStatus.FAILED) {
        setIsError(true);
        stopPolling();
      }
    } catch {
      handleError('errors.network');
    }
  };

  useEffect(() => {
    const startPolling = () => {
      checkStatus();

      intervalRef.current = setInterval(checkStatus, 2000);
    };

    startPolling();

    return () => stopPolling();
  }, [jobId]);

  const handleSelectOption = (event: SelectChangeEvent<string>) => {
    setSelectedOptionId(event.target.value);
  };

  const handleToggleEntityType = (entityType: string) => {
    setSelectedEntityTypes((prev) =>
      prev.includes(entityType)
        ? prev.filter((type) => type !== entityType)
        : [...prev, entityType],
    );
  };

  const updateJob = async (jobId: string, updateData: Partial<IJob>) => {
    const response = await jobsService.updateJob(jobId, updateData);
    dispatch(setJobAC(response));
  };

  const onAdjustSettings = async () => {
    if (!currentJob?.wizardState) return;
    await updateJob(currentJob.id, {
      wizardState: {
        ...currentJob.wizardState,
        currentStep: 3,
      },
    });
  };

  if (isProcessing) {
    return (
      <Box data-testid="review-and-run" data-state="processing" sx={{ textAlign: 'center', p: 10 }}>
        <CircularProgress sx={{ mb: 2, color: 'primary.500' }} />
        <Typography sx={{ color: 'neutral.500' }}>{t('deIdentify.results.analyzing')}</Typography>
      </Box>
    );
  }

  const onDownload = async () => {
    await resultsService.exportPdf(jobId);
  };

  const onCopy = () => {
    if (results?.mainContent.anonymizedText) {
      navigator.clipboard.writeText(results.mainContent.anonymizedText);
      setSnackbarOpen(true);
    }
  };

  const toggleEntity = async (entityId: string) => {
    setIsToggling(true);
    try {
      await jobsService.toggleEntity(jobId, entityId, textToDisplay);
      await getResults();
    } catch (error) {
      console.error('Error toggling entity:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleCloseSnackbar = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const renderHighlightedText = (text: string, entities: EntityDetection[]) => {
    if (!entities.length) return text;

    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

    const result: JSX.Element[] = [];
    let lastIndex = 0;

    sortedEntities.forEach((entity, index) => {
      result.push(<span key={`text-${index}`}>{text.substring(lastIndex, entity.start)}</span>);

      result.push(
        <Box
          component="span"
          key={`entity-${index}`}
          sx={{
            backgroundColor: (theme) => {
              const colorPath = getEntityColor(entity.entity_type);
              return entity.isExcluded
                ? 'transparent'
                : alpha(theme.palette.entities[colorPath.split('.')[1]] || 'neutral.100', 0.15);
            },
            padding: '2px 4px',
            borderRadius: '4px',
            mx: '2px',
            fontSize: FONT_SIZES.xs,
          }}
        >
          {text.substring(entity.start, entity.end)}
        </Box>,
      );
      lastIndex = entity.end;
    });

    result.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    return result;
  };

  if (isError) {
    return (
      <Box data-testid="review-and-run" data-state="error" sx={{ textAlign: 'center', p: 5 }}>
        <Typography color="error" variant="h6">
          {t('deIdentify.results.failed')}
        </Typography>
        <Typography sx={{ mb: 2 }}>{t('errors.network')}</Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box data-testid="review-and-run" data-state="success" sx={{ mx: '20px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography
            sx={{
              color: 'neutral.900',
              fontWeight: 'fontWeightSemiBold',
              fontSize: FONT_SIZES.xxl,
            }}
          >
            {t('deIdentify.results.titleReview')}
          </Typography>
          {currentJob?.wizardState?.inputData?.fileName && (
            <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.sm, mb: '16px' }}>
              {currentJob?.wizardState?.inputData?.fileName} · {t('deIdentify.results.analyzedAt')}{' '}
              {currentJob.updatedAt && new Date(currentJob.updatedAt).toLocaleString()}
            </Typography>
          )}
        </Box>

        <Button
          sx={{
            bgcolor: 'accent.400',
            fontWeight: 'fontWeightMedium',
            fontSize: FONT_SIZES.sm,
            color: 'primary.800',
            '&:hover': {
              bgcolor: 'accent.500',
            },
          }}
          size="small"
          onClick={onAdjustSettings}
          startIcon={<SettingsOutlinedIcon />}
        >
          {t('deIdentify.results.adjustSettings')}
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          py: '16px',
          px: '24px',
          mb: '16px',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'neutral.200',
          boxShadow: (theme) => `0px 1px 3px 0px ${alpha(theme.palette.common.black, 0.14)}`,
        }}
      >
        <Box sx={{ borderLeft: '1px solid', borderColor: 'neutral.200', flexGrow: 1, px: '24px' }}>
          <Typography
            sx={{
              fontWeight: 'fontWeightSemiBold',
              fontSize: FONT_SIZES.xxl,
              color: 'neutral.900',
            }}
          >
            {results?.stats.detected}
          </Typography>
          <Typography sx={{ fontSize: FONT_SIZES.sm, color: 'neutral.500' }}>
            {t('deIdentify.results.entitiesDetected')}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: '1px solid', borderColor: 'neutral.200', flexGrow: 1, px: '24px' }}>
          <Typography
            sx={{
              fontWeight: 'fontWeightSemiBold',
              fontSize: FONT_SIZES.xxl,
              color: 'neutral.900',
            }}
          >
            {results?.stats.processed}
          </Typography>
          <Typography sx={{ fontSize: FONT_SIZES.sm, color: 'neutral.500' }}>
            {t('deIdentify.results.entitiesProcessed')}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: '1px solid', borderColor: 'neutral.200', flexGrow: 1, px: '24px' }}>
          <Typography
            sx={{
              fontWeight: 'fontWeightSemiBold',
              fontSize: FONT_SIZES.xxl,
              color: 'neutral.900',
            }}
          >
            {typeof results?.stats.avgConfidence === 'number'
              ? `${(results?.stats.avgConfidence * 100).toFixed(2)}%`
              : t('common.na')}
          </Typography>
          <Typography sx={{ fontSize: FONT_SIZES.sm, color: 'neutral.500' }}>
            {t('deIdentify.results.avgConfidence')}
          </Typography>
        </Box>
        <Box sx={{ borderLeft: '1px solid', borderColor: 'neutral.200', flexGrow: 1, px: '24px' }}>
          <Typography
            sx={{
              fontWeight: 'fontWeightSemiBold',
              fontSize: FONT_SIZES.xxl,
              color: 'neutral.900',
            }}
          >
            {results?.auditTrail.processingTime.toFixed(2)}s
          </Typography>
          <Typography sx={{ fontSize: FONT_SIZES.sm, color: 'neutral.500' }}>
            {t('deIdentify.results.processingTimeLabel')}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: '16px',
          pb: '24px',
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: 2 },
            width: '100%',
            border: '1px solid',
            borderColor: 'neutral.200',
            borderRadius: '8px',
            boxShadow: (theme) => `0px 2px 12px 0px ${alpha(theme.palette.common.black, 0.14)}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'common.white',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: 'neutral.500',
                  fontWeight: 'fontWeightMedium',
                },
              }}
            >
              <Tab
                label={t('deIdentify.results.originalTab')}
                value="original"
                sx={{
                  '&.Mui-selected': {
                    color: 'primary.500',
                  },
                }}
              />
              <Tab
                label={t('deIdentify.results.deIdentifiedTab')}
                value="de-identified"
                sx={{
                  '&.Mui-selected': {
                    color: 'primary.500',
                  },
                }}
              />
            </Tabs>

            <Stack direction="row">
              <Button startIcon={<ContentCopy />} onClick={onCopy} sx={{ color: 'accent.400' }}>
                {t('common.copy')}
              </Button>
              <Button startIcon={<Download />} onClick={onDownload} sx={{ color: 'accent.400' }}>
                {t('common.download')}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ p: '24px', bgcolor: 'neutral.50' }}>
            <Box
              sx={{ height: '400px', overflowY: 'auto', bgcolor: 'common.white', p: '40px' }}
              className="scrollbar-md"
            >
              {activeTab === 'original'
                ? renderHighlightedText(textToDisplay, results?.entityTable ?? [])
                : results?.mainContent.anonymizedText}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: { xs: '1 1 auto', md: 1 },
            width: '100%',
            border: '1px solid',
            borderColor: 'neutral.200',
            borderRadius: '8px',
            boxShadow: (theme) => `0px 2px 12px 0px ${alpha(theme.palette.common.black, 0.14)}`,
            p: '16px',
          }}
        >
          <Box
            sx={{
              mb: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              sx={{
                fontWeight: 'fontWeightSemiBold',
                fontSize: FONT_SIZES.lg,
                color: 'neutral.900',
              }}
            >
              {t('deIdentify.results.entitiesDetected')}
            </Typography>
            <Box
              sx={{
                width: '30px',
                height: '30px',
                bgcolor: 'neutral.100',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                fontSize: FONT_SIZES.xs,
                color: 'neutral.500',
                fontWeight: 'fontWeightMedium',
              }}
            >
              {results?.entityTable.length}
            </Box>
          </Box>

          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">{t('deIdentify.results.sortBy')}</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={sortOptions.find((option) => option.id === selectedOptionId)?.id || ''}
              label={t('deIdentify.results.sortBy')}
              size="small"
              sx={{ color: 'primary.500' }}
              onChange={handleSelectOption}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box
            sx={{ my: '16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
          >
            {getUniqueEntities(results?.entityTable ?? []).map((entity, index) => (
              <Box
                key={index}
                sx={{
                  padding: '4px 10px',
                  borderRadius: '99px',
                  bgcolor: selectedEntityTypes.includes(entity.entity_type)
                    ? 'primary.50'
                    : 'neutral.100',
                  fontSize: FONT_SIZES.xs,
                  color: 'neutral.700',
                  fontWeight: 'fontWeightMedium',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'neutral.200',
                  },
                }}
                onClick={() => handleToggleEntityType(entity.entity_type)}
              >
                {entity.entity_type}
              </Box>
            ))}
          </Box>

          <Box sx={{ maxHeight: '400px', overflowY: 'auto' }} className="scrollbar-md">
            <AnimatePresence mode="popLayout">
              {sortedEntities.map((entity) => (
                <motion.div
                  key={entity.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 40,
                    mass: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: (theme) =>
                        entity.score > 0.6
                          ? 'common.white'
                          : alpha(theme.palette.warning[100] || 'common.white', 0.3),
                      p: '12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: 'neutral.200',
                      mb: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: (theme) =>
                        `0px 1px 3px 0px ${alpha(theme.palette.common.black, 0.14)}`,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <AccountCircleOutlinedIcon
                        sx={{ fontSize: FONT_SIZES.xl, color: 'neutral.400' }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 'fontWeightMedium',
                          fontSize: FONT_SIZES.xs,
                          color: 'neutral.500',
                        }}
                      >
                        {entity.entity_type}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: FONT_SIZES.sm, color: 'neutral.700' }} noWrap>
                        {localOriginalText.slice(entity.start, entity.end)}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: FONT_SIZES.xs,
                          fontWeight: 'fontWeightBold',
                          color: 'primary.500',
                          textTransform: 'uppercase',
                        }}
                      >
                        <ArrowForwardOutlinedIcon
                          sx={{ fontSize: FONT_SIZES.xs, color: 'neutral.300', mr: '4px' }}
                        />
                        [
                        {currentJob?.wizardState?.configSettings.strategies?.[
                          presidioToHipaaMap[entity.entity_type]
                        ] || 'REDACTED'}
                        ]
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, textAlign: 'right', minWidth: 0 }}>
                      <Button
                        sx={{
                          fontSize: FONT_SIZES.xs,
                          color: entity.isExcluded ? 'neutral.500' : 'primary.500',
                          fontWeight: 'fontWeightMedium',
                          border: entity.isExcluded ? 'none' : '1px solid',
                          borderColor: 'primary.500',
                          borderRadius: '16px',
                          px: '12px',
                          py: '4px',
                          mb: '4px',
                        }}
                        size="small"
                        startIcon={
                          entity.isExcluded ? (
                            <RemoveIcon sx={{ fontSize: FONT_SIZES.sm }} />
                          ) : (
                            <CheckOutlinedIcon sx={{ fontSize: FONT_SIZES.sm }} />
                          )
                        }
                        onClick={() => toggleEntity(entity.id)}
                      >
                        {isToggling
                          ? t('deIdentify.results.toggling')
                          : entity.isExcluded
                            ? t('deIdentify.results.excluded')
                            : t('deIdentify.results.included')}
                      </Button>
                      <Typography
                        sx={{
                          fontSize: FONT_SIZES.xs,
                          color: 'neutral.400',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px',
                        }}
                      >
                        {(entity.score * 100).toFixed(0)}%
                        {entity.score <= 0.6 && (
                          <WarningAmberOutlinedIcon
                            sx={{ fontSize: FONT_SIZES.xs, color: 'warning.main' }}
                          />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>

            {sortedEntities.length === 0 && (
              <Typography sx={{ textAlign: 'center', mt: 2, color: 'neutral.400' }}>
                {t('deIdentify.results.noEntitiesFound')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {t('common.copied')}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReviewAndRun;
