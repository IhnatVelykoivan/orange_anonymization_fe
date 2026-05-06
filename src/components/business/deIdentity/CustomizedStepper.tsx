import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { alpha, styled } from '@mui/material/styles';
import {
  Stack,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  StepConnector,
  stepConnectorClasses,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Check as CheckIcon,
  Tune as TuneIcon,
  PostAdd as PostAddIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { type StepIconProps } from '@mui/material/StepIcon';
import { StepContent } from './StepContent';
import DataInputIcon from '@/assets/icons/dataInputIcon.svg?react';
import PreviewIcon from '@/assets/icons/preview.svg?react';
import ReviewAndRun from './ReviewAndRun';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { jobsService } from '@/services/jobsService';
import { setJobAC } from '@/store/slices/jobsSlice';
import { ComplianceFramework, type IJob } from '@/pages/DeIdentify/types';
import GoBackSettingsPopup from '@/components/popups/GoBackSettingsPopup';
import { FONT_SIZES } from '@/constants';

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 30,
    left: 'calc(-50% + 20px)',
    right: 'calc(50% + 20px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary[500],
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary[500],
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.divider,
    borderRadius: 1,
    margin: '0 30px',
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  zIndex: 1,
  color: theme.palette.accent[400],
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active
    ? {
        backgroundColor: theme.palette.primary[500],
        width: 60,
        height: 60,
        boxShadow: `0 4px 10px ${alpha(theme.palette.common.black, 0.25)}`,
      }
    : {
        margin: 14,
        backgroundColor: theme.palette.neutral[300],
        width: 36,
        height: 36,
      }),
  ...(ownerState.completed && {
    backgroundColor: theme.palette.primary[500],
    color: theme.palette.common.white,
    ...(!ownerState.active && { margin: 14 }),
  }),
  ...(!ownerState.active &&
    !ownerState.completed && {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.neutral[400],
    }),
}));

function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className, icon } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <PostAddIcon />,
    2: <DataInputIcon />,
    3: <TuneIcon />,
    4: <PreviewIcon />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <CheckIcon /> : icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

export default function CustomizedSteppers() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobIdFromUrl = searchParams.get('jobId');
  const { currentJob } = useAppSelector((state) => state.jobs);
  const localOriginalText = useAppSelector(
    (state) => state.jobs.localOriginalTexts[currentJob?.id as string],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGoBackPopup, setShowGoBackPopup] = useState(false);
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);

  const steps = useMemo(
    () => [
      t('deIdentify.steps.compliance'),
      t('deIdentify.steps.dataInput'),
      t('deIdentify.steps.configuration'),
      t('deIdentify.steps.reviewAndRun'),
    ],
    [t],
  );

  const activeStep = useMemo(() => (currentJob?.wizardState?.currentStep ?? 1) - 1, [currentJob]);
  const selectedFramework = useMemo(
    () => currentJob?.wizardState?.frameworkSelection ?? null,
    [currentJob],
  );
  const text = useMemo(() => localOriginalText, [localOriginalText]);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const handleError = useCallback(
    (defaultKey: string) => {
      setErrorMessage(t(defaultKey));
    },
    [t],
  );

  const syncJobIdInUrl = useCallback(
    (jobId?: string) => {
      setSearchParams(
        (params) => {
          const nextParams = new URLSearchParams(params);

          if (jobId) {
            nextParams.set('jobId', jobId);
          } else {
            nextParams.delete('jobId');
          }

          return nextParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const createJob = useCallback(async () => {
    const response = await jobsService.createJob();
    dispatch(setJobAC(response));
    syncJobIdInUrl(response.id);
  }, [dispatch, syncJobIdInUrl]);

  const getLatestDraft = useCallback(async () => {
    try {
      const response = await jobsService.getLatestDraft();

      if (!response) {
        await createJob();
      } else {
        dispatch(setJobAC(response));
        syncJobIdInUrl(response.id);
      }
    } catch {
      handleError('errors.fetchFailed');
    }
  }, [createJob, dispatch, handleError, syncJobIdInUrl]);

  useEffect(() => {
    const init = async () => {
      if (jobIdFromUrl) {
        try {
          const job = await jobsService.getJobById(jobIdFromUrl);
          dispatch(setJobAC(job));
          syncJobIdInUrl(job.id);
          return;
        } catch {
          handleError('errors.notFound');
          syncJobIdInUrl();
        }
      }

      await getLatestDraft();
    };
    init();
  }, [dispatch, getLatestDraft, handleError, jobIdFromUrl, syncJobIdInUrl]);

  useEffect(() => {
    if (currentJob?.id) {
      syncJobIdInUrl(currentJob.id);
    }
  }, [currentJob?.id, syncJobIdInUrl]);

  const updateJob = async (jobId: string, updateData: Partial<IJob>) => {
    const response = await jobsService.updateJob(jobId, updateData);
    dispatch(setJobAC(response));
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      navigate(`/app/synthetic-data?jobId=${currentJob?.id}`);
      return;
    }

    try {
      const data: Partial<IJob> = {
        wizardState: {
          currentStep: activeStep + 2,
          frameworkSelection: currentJob?.wizardState?.frameworkSelection || null,
          inputData: currentJob?.wizardState?.inputData || null,
          configSettings: currentJob?.wizardState?.configSettings || {},
        },
      };
      await updateJob(currentJob?.id as string, data);
    } catch {
      handleError('errors.updateFailed');
    }

    if (activeStep === 2) {
      try {
        await jobsService.runAnalysis(currentJob?.id as string, localOriginalText);
      } catch {
        handleError('errors.updateFailed');
      }
    }
  };

  const handleBack = async () => {
    try {
      const data: Partial<IJob> = {
        wizardState: {
          currentStep: activeStep,
          frameworkSelection: currentJob?.wizardState?.frameworkSelection || null,
          inputData: currentJob?.wizardState?.inputData || null,
          configSettings: currentJob?.wizardState?.configSettings || {},
        },
      };
      await updateJob(currentJob?.id as string, data);
    } catch {
      handleError('errors.updateFailed');
    }
  };

  const handleStepClick = async (index: number) => {
    if (activeStep === steps.length - 1 && index < activeStep) {
      setPendingStepIndex(index);
      setShowGoBackPopup(true);
      return;
    }

    try {
      const data: Partial<IJob> = {
        wizardState: {
          currentStep: index + 1,
          frameworkSelection: currentJob?.wizardState?.frameworkSelection || null,
          inputData: currentJob?.wizardState?.inputData || null,
          configSettings: currentJob?.wizardState?.configSettings || {},
        },
      };

      await updateJob(currentJob?.id as string, data);
    } catch {
      handleError('errors.updateFailed');
    }
  };

  return (
    <Stack
      data-testid="wizard-stepper"
      sx={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
      }}
      spacing={4}
    >
      <Stepper
        alternativeLabel
        activeStep={activeStep}
        connector={<ColorlibConnector />}
        sx={{
          flexShrink: 0,
          '& .MuiStepLabel-label': {
            color: 'neutral.400',
            mt: 1,
            fontWeight: 'fontWeightSemiBold',
            fontSize: FONT_SIZES.sm,
          },
          '& .MuiStepLabel-label.Mui-active': {
            color: 'primary.500',
            fontWeight: 'fontWeightSemiBold',
            fontSize: FONT_SIZES.md,
          },
          '& .MuiStepLabel-label.Mui-completed': {
            color: 'primary.500',
            fontWeight: 'fontWeightSemiBold',
            fontSize: FONT_SIZES.sm,
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label} onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
            <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box
        sx={{
          mt: 2,
          mb: 1,
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {activeStep === steps.length ? (
          <ReviewAndRun jobId={currentJob?.id as string} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              height: '100%',
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <StepContent step={activeStep} jobId={currentJob?.id as string} />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                mt: 'auto',
                zIndex: 10,
              }}
            >
              {activeStep === steps.length - 1 ? (
                <Button
                  color="inherit"
                  onClick={createJob}
                  sx={{ mr: 1, color: (theme) => theme.palette.accent[500] }}
                  startIcon={<AddIcon />}
                >
                  {t('common.newAnalysis')}
                </Button>
              ) : (
                <Button
                  data-testid="step-back-btn"
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1, color: (theme) => theme.palette.neutral[700] }}
                  startIcon={<ArrowBackIcon />}
                >
                  {t('common.back')}
                </Button>
              )}

              <Box sx={{ flex: '1 1 auto' }} />
              <Button
                data-testid="step-next-btn"
                variant="contained"
                disabled={
                  (activeStep === 0 && !selectedFramework) ||
                  (activeStep === 1 && (!text || text.length < 50 || text.length > 5000)) ||
                  (activeStep === 2 &&
                    ((!currentJob?.wizardState?.configSettings.method &&
                      currentJob?.wizardState?.frameworkSelection === ComplianceFramework.HIPAA) ||
                      !currentJob?.wizardState?.configSettings.strategies ||
                      !currentJob?.wizardState?.configSettings.language ||
                      !currentJob?.wizardState?.configSettings.threshold))
                }
                onClick={handleNext}
                sx={{
                  background: (theme) => theme.palette.primary[500],
                  '&:hover': { opacity: 0.9 },
                }}
                endIcon={activeStep === steps.length - 1 ? <StarIcon /> : <ArrowForwardIcon />}
              >
                {activeStep === steps.length - 1
                  ? t('common.generateSyntheticData')
                  : activeStep === 2
                    ? t('common.analyze')
                    : t('common.continue')}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

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
      <GoBackSettingsPopup
        isVisible={showGoBackPopup}
        onClose={() => {
          setShowGoBackPopup(false);
          setPendingStepIndex(null);
        }}
        onConfirm={async () => {
          setShowGoBackPopup(false);
          try {
            if (pendingStepIndex !== null) {
              const data: Partial<IJob> = {
                wizardState: {
                  currentStep: pendingStepIndex + 1,
                  frameworkSelection: currentJob?.wizardState?.frameworkSelection || null,
                  inputData: currentJob?.wizardState?.inputData || null,
                  configSettings: currentJob?.wizardState?.configSettings || {},
                },
              };

              await updateJob(currentJob?.id as string, data);
            } else {
              await handleBack();
            }
          } catch {
            handleError('errors.updateFailed');
          } finally {
            setPendingStepIndex(null);
          }
        }}
      />
    </Stack>
  );
}
