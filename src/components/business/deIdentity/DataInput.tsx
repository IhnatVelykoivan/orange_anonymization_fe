import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import Tabs, { Tab } from '@/components/UI/Tabs';
import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material';
import {
  Edit as EditIcon,
  ArrowCircleUpOutlined as ArrowCircleUpOutlinedIcon,
  Close as CloseIcon,
  PriorityHigh as PriorityHighIcon,
  ArrowCircleUp as ArrowCircleUpIcon,
  Check as CheckIcon,
  ArrowUpward as ArrowUpwardIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '@/store/store';
import { jobsService } from '@/services/jobsService';
import type { IJob, WizardState } from '@/pages/DeIdentify/types';
import { setJobAC, setLocalOriginalTextAC } from '@/store/slices/jobsSlice';
import { FONT_SIZES } from '@/constants';
import ReplaceTextPopup from '@/components/popups/ReplaceTextPopup';

const SUPPORTED_FILE_TYPES = ['text/plain', 'application/pdf'];
const SUPPORTED_FILE_EXTENSIONS = '.txt,.pdf';

type PendingUpload = {
  file: File;
  parsedText: string;
};

const schema = yup
  .string()
  .required('deIdentify.input.validation.required')
  .min(50, 'deIdentify.input.validation.minLength')
  .max(5000, 'deIdentify.input.validation.tooLong');

type DataInputContentProps = {
  currentJob: IJob | null;
  localOriginalText?: string;
};

const DataInput = ({ currentJob, localOriginalText }: DataInputContentProps) => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState(t('deIdentify.input.tabs.text'));
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);

  const [text, setText] = useState(localOriginalText || '');
  const [uploadedTextBaseline, setUploadedTextBaseline] = useState(() =>
    currentJob?.wizardState?.inputData?.fileName ? localOriginalText || '' : '',
  );

  const dispatch = useAppDispatch();

  const hasUnsavedManualChanges = useMemo(
    () => text !== uploadedTextBaseline,
    [text, uploadedTextBaseline],
  );

  const handleError = (defaultKey: string) => {
    setErrorMessage(t(defaultKey));
  };

  const updateJob = async (jobId: string, updateData: Partial<IJob>) => {
    const response = await jobsService.updateJob(jobId, updateData);
    dispatch(setJobAC(response));
  };

  useEffect(() => {
    if (text === localOriginalText) return;

    if (currentJob?.id) {
      dispatch(
        setLocalOriginalTextAC({
          jobId: currentJob.id,
          text: text,
        }),
      );
    }
  }, [text, currentJob?.id]);

  const validate = (value: string) => {
    try {
      schema.validateSync(value);
      setError(null);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setError(t(err.message));
      } else {
        setError(t('errors.generic'));
      }
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    validate(text);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    if (isTouched) {
      validate(value);
    }
  };

  const applyUploadedText = async (file: File, parsedText: string) => {
    if (!currentJob?.id) return;

    const response = await jobsService.uploadFile(currentJob.id, file);

    dispatch(
      setLocalOriginalTextAC({
        jobId: response.id,
        text: parsedText,
      }),
    );

    dispatch(setJobAC(response));
    setText(parsedText);
    setUploadedTextBaseline(parsedText);
    setIsTouched(false);
    validate(parsedText);
  };

  const handleFileUpload = async (file: File) => {
    setFileError(null);

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      setFileError(t('deIdentify.input.validation.unsupportedFormat'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError(t('deIdentify.input.validation.fileTooLarge'));
      return;
    }

    try {
      const textContent = await file.text();

      if (hasUnsavedManualChanges && text.length > 0) {
        setPendingUpload({ file, parsedText: textContent });
        setReplaceDialogOpen(true);
        return;
      }

      await applyUploadedText(file, textContent);
    } catch {
      handleError('deIdentify.input.validation.uploadFailed');
    }
  };

  const handleConfirmReplace = async () => {
    if (!pendingUpload) return;

    const { file, parsedText } = pendingUpload;
    setReplaceDialogOpen(false);
    setPendingUpload(null);

    try {
      await applyUploadedText(file, parsedText);
    } catch {
      handleError('deIdentify.input.validation.uploadFailed');
    }
  };

  const handleCloseReplaceDialog = () => {
    setReplaceDialogOpen(false);
    setPendingUpload(null);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onRemoveFile = async () => {
    const data: Partial<IJob> = {
      wizardState: {
        ...(currentJob?.wizardState as WizardState),
        inputData: null,
      },
    };
    await updateJob(currentJob?.id as string, data);
  };

  return (
    <Box sx={{ mx: '20px' }}>
      <Typography
        sx={{
          color: 'neutral.900',
          fontWeight: 'fontWeightSemiBold',
          fontSize: FONT_SIZES.xxl,
          mb: '8px',
        }}
      >
        {t('deIdentify.input.title')}
      </Typography>
      <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.sm, mb: '48px' }}>
        {t('deIdentify.input.subtitle')}
      </Typography>

      <Tabs active={currentTab} setActive={setCurrentTab}>
        <Tab name={t('deIdentify.input.tabs.text')} icon={<EditIcon />}>
          <Box data-testid="text-tab" sx={{ width: '100%' }}>
            <TextField
              fullWidth
              multiline
              rows={10}
              placeholder={t('deIdentify.input.placeholder')}
              value={text}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!error}
              helperText={error}
              slotProps={{ htmlInput: { 'data-testid': 'text-input' } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'common.white',
                  padding: '16px',
                  '& fieldset': {
                    borderColor: 'neutral.200',
                  },
                },
                '& .MuiFormHelperText-root': {
                  mx: 0,
                  mt: 1,
                  fontSize: FONT_SIZES.xs,
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Typography
                sx={{
                  fontSize: FONT_SIZES.xs,
                  color: text.length > 5000 ? 'error.main' : 'neutral.500',
                }}
              >
                {t('deIdentify.input.characterCount', { count: text.length.toLocaleString() })}
              </Typography>
            </Box>
          </Box>
        </Tab>

        <Tab name={t('deIdentify.input.tabs.file')} icon={<ArrowCircleUpOutlinedIcon />}>
          <Box
            data-testid="file-tab"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            sx={{
              width: '720px',
              minHeight: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed',
              borderColor: (theme) =>
                fileError
                  ? theme.palette.error.main
                  : currentJob?.wizardState?.inputData?.fileName
                    ? theme.palette.success.main
                    : theme.palette.neutral[300],
              borderRadius: '12px',
              backgroundColor: (theme) =>
                fileError
                  ? theme.palette.state?.errorBg
                  : currentJob?.wizardState?.inputData?.fileName
                    ? theme.palette.state?.successBg
                    : theme.palette.common.white,
              p: 3,
              marginX: 'auto',
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid',
                borderColor: fileError
                  ? 'error.main'
                  : currentJob?.wizardState?.inputData?.fileName
                    ? 'success.main'
                    : 'neutral.900',
                mb: 3,
              }}
            >
              {fileError ? (
                <PriorityHighIcon sx={{ fontSize: FONT_SIZES.xxxl, color: 'error.main' }} />
              ) : (
                <>
                  {currentJob?.wizardState?.inputData?.fileName ? (
                    <CheckIcon sx={{ fontSize: FONT_SIZES.xxxl, color: 'success.main' }} />
                  ) : (
                    <ArrowUpwardIcon sx={{ fontSize: FONT_SIZES.xxxl, color: 'primary.800' }} />
                  )}
                </>
              )}
            </Box>

            {!currentJob?.wizardState?.inputData?.fileName ? (
              <>
                <Typography
                  sx={{
                    fontSize: FONT_SIZES.xxl,
                    fontWeight: 'fontWeightMedium',
                    color: 'neutral.700',
                    mb: 1,
                  }}
                >
                  {t('deIdentify.input.upload.title')}
                </Typography>

                <Typography sx={{ fontSize: FONT_SIZES.md, color: 'neutral.500', mb: 3 }}>
                  {t('deIdentify.input.upload.dragDrop')}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '300px',
                    mb: 3,
                    '&::before, &::after': {
                      content: '""',
                      flex: 1,
                      borderBottom: '1px solid',
                      borderColor: 'neutral.100',
                    },
                  }}
                >
                  <Typography sx={{ px: 2, fontSize: FONT_SIZES.sm, color: 'neutral.400' }}>
                    {t('common.or')}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                {fileError ? (
                  <>
                    <Typography sx={{ color: 'error.main', mb: 3 }}>{fileError}</Typography>
                  </>
                ) : (
                  <>
                    <Box
                      data-testid="upload-success"
                      sx={{ display: 'flex', gap: '16px', alignItems: 'center' }}
                    >
                      <Typography sx={{ color: 'neutral.900', fontSize: FONT_SIZES.md }}>
                        {currentJob?.wizardState?.inputData.fileName}
                      </Typography>
                      <Button sx={{ color: 'neutral.500' }} onClick={onRemoveFile}>
                        <CloseIcon />
                      </Button>
                    </Box>
                    <Typography sx={{ mb: 3, color: 'neutral.500', fontSize: FONT_SIZES.xs }}>
                      {`${((currentJob?.wizardState?.inputData.fileSize ?? 0) / (1024 * 1024)).toFixed(1)} ${t('common.mb', { defaultValue: 'MB' })} - ${currentJob?.wizardState?.inputData.fileName?.split('.').pop()?.toUpperCase()}`}
                    </Typography>
                  </>
                )}
              </>
            )}

            {!fileError ? (
              <>
                <Button
                  variant="contained"
                  component="label"
                  sx={{
                    backgroundColor: (theme) => `${theme.palette.accent?.[400]}`,
                    color: 'primary.800',
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 4,
                    py: 1,
                    fontSize: FONT_SIZES.sm,
                    fontWeight: 'fontWeightMedium',
                    boxShadow: 'none',
                    backgroundImage: 'none',
                    '&:hover': {
                      backgroundImage: 'none',
                      backgroundColor: (theme) => `${theme.palette.accent?.[500]}`,
                      boxShadow: 'none',
                    },
                  }}
                >
                  {currentJob?.wizardState?.inputData?.fileName
                    ? t('deIdentify.input.upload.replace')
                    : t('deIdentify.input.upload.browse')}
                  <input
                    data-testid="file-upload-input"
                    type="file"
                    hidden
                    accept={SUPPORTED_FILE_EXTENSIONS}
                    onChange={onFileInputChange}
                  />
                </Button>

                <Typography sx={{ mt: 2, fontSize: FONT_SIZES.xs, color: 'neutral.400' }}>
                  {t('deIdentify.input.upload.supported')}
                </Typography>
              </>
            ) : (
              <>
                <Button
                  component="label"
                  sx={{
                    color: 'primary.800',
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 4,
                    py: 1,
                    fontSize: FONT_SIZES.sm,
                    fontWeight: 'fontWeightMedium',
                    boxShadow: 'none',
                  }}
                  endIcon={<ArrowCircleUpIcon />}
                >
                  {t('deIdentify.input.upload.replace')}
                  <input
                    data-testid="file-upload-input"
                    type="file"
                    hidden
                    accept={SUPPORTED_FILE_EXTENSIONS}
                    onChange={onFileInputChange}
                  />
                </Button>
              </>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 1,
              width: '720px',
              marginX: 'auto',
            }}
          >
            {fileError ? (
              <Typography
                data-testid="upload-error"
                sx={{ fontSize: FONT_SIZES.xs, color: 'error.main' }}
              >
                {fileError}
              </Typography>
            ) : (
              <>
                {!currentJob?.wizardState?.inputData?.fileName && (
                  <Typography sx={{ fontSize: FONT_SIZES.xs, color: 'neutral.400' }}>
                    {t('deIdentify.input.upload.required')}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Tab>
      </Tabs>

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

      <ReplaceTextPopup
        isVisible={replaceDialogOpen}
        onClose={handleCloseReplaceDialog}
        onConfirm={handleConfirmReplace}
      />
    </Box>
  );
};

export default DataInput;
