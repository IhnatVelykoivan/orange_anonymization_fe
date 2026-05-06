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
  ErrorOutline as ErrorOutlineIcon,
  Refresh as RefreshIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LocationOnOutlined as LocationIcon,
  CalendarTodayOutlined as CalendarIcon,
  LanguageOutlined as UrlIcon,
  CreditCardOutlined as CreditCardIcon,
  LocalHospitalOutlined as MedicalIcon,
  DescriptionOutlined as DefaultEntityIcon,
  Fingerprint as FingerprintIcon,
  Paid as PaidIcon,
  Security as SecurityIcon,
  BadgeOutlined as IdIcon,
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
  type SvgIconProps,
} from '@mui/material';
import { useCallback, useEffect, useState, type FC, useRef, type JSX, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FONT_SIZES } from '@/constants';
import { REVIEW_RESULTS_POLL_INTERVAL_MS } from '@/constants/api-config';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setJobAC } from '@/store/slices/jobsSlice';
import { getUniqueEntities, presidioToHipaaMap } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { REVIEW_AND_RUN_CONSTANTS } from './reviewAndRunConstants';
import noEntitiesIcon from '@/assets/icons/noEntities.png';
import { useSessionExpiration } from '@/components/layouts/useSessionExpiration';

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

const getEntityIcon = (type: string): React.ComponentType<SvgIconProps> => {
  const iconMap: Record<string, React.ComponentType<SvgIconProps>> = {
    PERSON: AccountCircleOutlinedIcon,
    EMAIL_ADDRESS: EmailIcon,
    PHONE_NUMBER: PhoneIcon,
    FAX: PhoneIcon,
    LOCATION: LocationIcon,
    DATE_TIME: CalendarIcon,
    URL: UrlIcon,
    IP_ADDRESS: LocationIcon,
    AGE: FingerprintIcon,
    GENDER: AccountCircleOutlinedIcon,
    NATIONALITY: IdIcon,
    RELIGION: AccountCircleOutlinedIcon,
    CREDIT_CARD: CreditCardIcon,
    CRYPTO: CreditCardIcon,
    IBAN_CODE: PaidIcon,
    ACCOUNT: PaidIcon,
    BANK_ACCOUNT: PaidIcon,
    SWIFT_CODE: PaidIcon,
    TAX_ID: IdIcon,
    US_SSN: IdIcon,
    US_DRIVER_LICENSE: IdIcon,
    LICENSE: IdIcon,
    US_PASSPORT: IdIcon,
    PASSPORT: IdIcon,
    NATIONAL_ID: IdIcon,
    NIF: IdIcon,
    NIE: IdIcon,
    CPF: IdIcon,
    AHV_NUMBER: IdIcon,
    UID_NUMBER: IdIcon,
    MEDICAL_LICENSE: MedicalIcon,
    MRN: MedicalIcon,
    MEDICAL_RECORD_NUMBER: MedicalIcon,
    HEALTH_INSURANCE: MedicalIcon,
    HEALTH_INFO: MedicalIcon,
    BIOMETRIC: FingerprintIcon,
    GENETIC_DATA: FingerprintIcon,
    PASSWORD: SecurityIcon,
    ENCRYPTION_KEY: SecurityIcon,
    VEHICLE: IdIcon,
  };

  return iconMap[type] || DefaultEntityIcon;
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
  const [hasFailedGeneration, setHasFailedGeneration] = useState(false);
  const [results, setResults] = useState<JobResults | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('original');
  const [selectedOptionId, setSelectedOptionId] = useState('confidence_asc');
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>([]);
  const [isToggling, setIsToggling] = useState(false);
  const [isWarningBannerDismissed, setIsWarningBannerDismissed] = useState(false);
  const [isCriticalBannerDismissed, setIsCriticalBannerDismissed] = useState(false);

  const localOriginalText = useAppSelector((state) => state.jobs.localOriginalTexts[jobId]);
  const { currentJob } = useAppSelector((state) => state.jobs);
  const dispatch = useAppDispatch();
  const { isWarning, isCritical } = useSessionExpiration(true);

  const textToDisplay = localOriginalText || '';
  const detectedEntities = results?.entityTable ?? [];
  const detectedCount = results?.stats.detected ?? detectedEntities.length ?? 0;
  const noIdentifiersDetected = Boolean(results) && detectedCount === 0;
  const processedCount = noIdentifiersDetected ? 0 : (results?.stats.processed ?? 0);
  const allEntitiesExcluded =
    detectedEntities.length > 0 && detectedEntities.every((entity) => entity.isExcluded);
  const showWarningBanner = isWarning && !isWarningBannerDismissed;
  const showCriticalBanner = isCritical && !isCriticalBannerDismissed;
  const activeSessionBanner = showCriticalBanner
    ? 'critical'
    : showWarningBanner
      ? 'warning'
      : null;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredEntities =
    detectedEntities.filter((entity) => {
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

  const handleError = useCallback(
    (defaultKey: string) => {
      setErrorMessage(t(defaultKey));
    },
    [t],
  );

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const getResults = useCallback(async () => {
    try {
      const response = await resultsService.getResults(jobId);
      setResults(response);
      setIsProcessing(false);
      stopPolling();
    } catch (err) {
      console.error('ReviewAndRun.getResults failed for jobId:', jobId, err);
      setIsError(true);
      stopPolling();
    }
  }, [jobId]);

  const checkStatus = useCallback(async () => {
    try {
      const job = await jobsService.getJobById(jobId);

      if (job.status === JobStatus.SUCCEEDED) {
        await getResults();
        dispatch(setJobAC(job));
      } else if (job.status === JobStatus.FAILED) {
        try {
          const partial = await resultsService.getResults(jobId);
          setResults(partial);
        } catch {
          // Silent catch
        }

        setHasFailedGeneration(true);
        setIsProcessing(false);
        stopPolling();
      }
    } catch (err) {
      console.error('ReviewAndRun.checkStatus failed for jobId:', jobId, err);
      handleError('errors.network');
    }
  }, [dispatch, getResults, handleError, jobId]);

  useEffect(() => {
    checkStatus();

    intervalRef.current = setInterval(checkStatus, REVIEW_RESULTS_POLL_INTERVAL_MS);

    return () => stopPolling();
  }, [checkStatus]);

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
    try {
      await updateJob(currentJob.id, {
        wizardState: {
          ...currentJob.wizardState,
          currentStep: 3,
        },
      });
    } catch (err) {
      console.error('onAdjustSettings failed:', err);
      handleError('errors.network');
    }
  };

  if (isProcessing) {
    return (
      <Box
        data-testid="review-and-run"
        data-state="processing"
        sx={{ textAlign: 'center', p: REVIEW_AND_RUN_CONSTANTS.spacing.xl }}
      >
        <CircularProgress sx={{ mb: REVIEW_AND_RUN_CONSTANTS.spacing.sm, color: 'primary.500' }} />
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

  const handleRetry = async () => {
    try {
      setIsProcessing(true);
      setHasFailedGeneration(false);
      await jobsService.runAnalysis(jobId, localOriginalText || '');
      stopPolling();
      intervalRef.current = setInterval(checkStatus, REVIEW_RESULTS_POLL_INTERVAL_MS);
      await checkStatus();
    } catch (e) {
      console.error('ReviewAndRun.handleRetry failed for jobId:', jobId, e);
      handleError('errors.network');
    }
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
      <Box
        data-testid="review-and-run"
        data-state="error"
        sx={{ textAlign: 'center', p: REVIEW_AND_RUN_CONSTANTS.spacing.lg }}
      >
        <Typography color="error" variant="h6">
          {t('deIdentify.results.failed')}
        </Typography>
        <Typography sx={{ mb: REVIEW_AND_RUN_CONSTANTS.spacing.sm }}>
          {t('errors.network')}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      data-testid="review-and-run"
      data-state="success"
      sx={{ mx: REVIEW_AND_RUN_CONSTANTS.spacing.md }}
    >
      {activeSessionBanner && (
        <Alert
          severity={activeSessionBanner === 'critical' ? 'error' : 'warning'}
          variant="outlined"
          sx={{ mb: '16px', alignItems: 'center' }}
          closeText={t('common.close')}
          onClose={() => {
            if (activeSessionBanner === 'critical') {
              setIsCriticalBannerDismissed(true);
            } else {
              setIsWarningBannerDismissed(true);
            }
          }}
        >
          {activeSessionBanner === 'critical'
            ? t('deIdentify.results.sessionCritical')
            : t('deIdentify.results.sessionWarning')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ mb: '24px' }}>
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
            <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.sm }}>
              {currentJob?.wizardState?.inputData?.fileName} · {t('deIdentify.results.analyzedAt')}{' '}
              {currentJob.updatedAt && new Date(currentJob.updatedAt).toLocaleString()}
            </Typography>
          )}
        </Box>

        <Button
          sx={{
            bgcolor: 'primary.500',
            fontWeight: 'fontWeightMedium',
            fontSize: FONT_SIZES.sm,
            color: 'common.white',
            '&:hover': {
              bgcolor: 'primary.400',
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
            {detectedCount}
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
            {processedCount}
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
            {noIdentifiersDetected || typeof results?.stats.avgConfidence !== 'number'
              ? t('common.na')
              : `${(results.stats.avgConfidence * 100).toFixed(2)}%`}
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
            {results?.auditTrail.processingTime.toFixed(2)}
            {t('common.s')}
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
                value={REVIEW_AND_RUN_CONSTANTS.tabs.original}
                sx={{
                  '&.Mui-selected': {
                    color: 'primary.500',
                  },
                }}
              />
              <Tab
                label={t('deIdentify.results.deIdentifiedTab')}
                value={REVIEW_AND_RUN_CONSTANTS.tabs.deIdentified}
                sx={{
                  '&.Mui-selected': {
                    color: 'primary.500',
                  },
                }}
              />
            </Tabs>

            <Stack direction="row">
              <Button startIcon={<ContentCopy />} onClick={onCopy} sx={{ color: 'primary.500' }}>
                {t('common.copy')}
              </Button>
              <Button startIcon={<Download />} onClick={onDownload} sx={{ color: 'primary.500' }}>
                {t('common.download')}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ p: '24px', bgcolor: 'neutral.50' }}>
            <Box
              sx={{
                minHeight: '400px',
                overflowY: 'auto',
                bgcolor: 'common.white',
                p: '40px',
              }}
              className="scrollbar-md"
            >
              {activeTab === REVIEW_AND_RUN_CONSTANTS.tabs.original ? (
                renderHighlightedText(textToDisplay, results?.entityTable ?? [])
              ) : results?.mainContent?.anonymizedText ? (
                results?.mainContent.anonymizedText
              ) : hasFailedGeneration ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main', mb: 3 }} />
                  <Typography
                    sx={{
                      fontWeight: 'fontWeightBold',
                      fontSize: FONT_SIZES.xxl,
                      color: 'neutral.900',
                      mb: 2,
                    }}
                  >
                    {t('deIdentify.results.failed')}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: FONT_SIZES.md,
                      color: 'neutral.500',
                      mb: 4,
                      maxWidth: '400px',
                    }}
                  >
                    {t('deIdentify.results.failedToGenerate')}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleRetry}
                    sx={{
                      bgcolor: 'primary.900',
                      color: 'common.white',
                      fontWeight: 'fontWeightMedium',
                      fontSize: FONT_SIZES.sm,
                      px: 3,
                      py: 1.2,
                      borderRadius: '8px',
                      '&:hover': {
                        bgcolor: 'primary.800',
                      },
                    }}
                    startIcon={<RefreshIcon />}
                  >
                    {t('deIdentify.results.tryAgain')}
                  </Button>
                </Box>
              ) : (
                <Typography sx={{ color: 'neutral.400' }}>
                  {t('deIdentify.results.noPreview')}
                </Typography>
              )}
            </Box>

            {noIdentifiersDetected && (
              <Alert
                severity="info"
                variant="outlined"
                sx={{ mt: '16px', alignItems: 'flex-start', borderRadius: '12px' }}
              >
                {t('deIdentify.results.noIdentifiersDetected')}
              </Alert>
            )}

            {allEntitiesExcluded && (
              <Alert
                severity="warning"
                variant="outlined"
                sx={{ mt: '16px', alignItems: 'flex-start', borderRadius: '12px' }}
              >
                {t('deIdentify.results.allEntitiesExcluded')}
              </Alert>
            )}
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
              {detectedEntities.length}
            </Box>
          </Box>

          {noIdentifiersDetected ? (
            <Box
              sx={{
                mt: '16px',
                minHeight: '320px',
                borderRadius: '16px',
                border: '1px dashed',
                borderColor: 'neutral.200',
                bgcolor: 'neutral.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: '24px',
                pt: 0,
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  maxWidth: '280px',
                  textAlign: 'center',
                }}
              >
                <Box
                  sx={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    bgcolor: 'common.white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: (theme) =>
                      `0px 1px 8px 0px ${alpha(theme.palette.common.black, 0.08)}`,
                  }}
                >
                  <Box
                    component="img"
                    src={noEntitiesIcon}
                    alt={t('deIdentify.results.noIdentifiersDetectedPanel')}
                    sx={{ width: '64px', height: '64px', objectFit: 'contain' }}
                  />
                </Box>
                <Box sx={{ maxWidth: '320px' }}>
                  <Typography
                    sx={{ color: 'neutral.700', fontWeight: 'fontWeightMedium', mb: '4px' }}
                  >
                    {t('deIdentify.results.noIdentifiersDetectedPanel')}
                  </Typography>
                  <Typography sx={{ color: 'neutral.500' }}>
                    {t('deIdentify.results.noIdentifiersDetectedPanelDetail')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  {t('deIdentify.results.sortBy')}
                </InputLabel>
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
                sx={{
                  my: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {getUniqueEntities(detectedEntities).map((entity, index) => (
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
                          {(() => {
                            const EntityIconComponent = getEntityIcon(entity.entity_type);
                            return (
                              <EntityIconComponent
                                sx={{ fontSize: FONT_SIZES.xl, color: 'neutral.400' }}
                              />
                            );
                          })()}
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
                            ] || t('deIdentify.results.redacted')}
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
            </>
          )}
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
