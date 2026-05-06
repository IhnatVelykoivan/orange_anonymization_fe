import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RadioButtonCheckedOutlined as RadioButtonCheckedOutlinedIcon,
  RadioButtonUncheckedOutlined as RadioButtonUncheckedOutlinedIcon,
  ReportProblemOutlined as ReportProblemOutlinedIcon,
  Check as CheckIcon,
  Search as SearchIcon,
  Block as RedactIcon,
  Cached as ReplaceIcon,
  AutoAwesome as SyntheticIcon,
  VisibilityOff as MaskIcon,
  LockClock as HashIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  alpha,
  type Theme,
  type SxProps,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setJobAC } from '@/store/slices/jobsSlice';
import { jobsService } from '@/services/jobsService';
import { FONT_SIZES, ALL_LANGUAGES, RECENTLY_USED } from '@/constants';
import {
  Threshold,
  type HIPAAMethodUI,
  type IJob,
  type RedactOption,
} from '@/pages/DeIdentify/types';
import IdentifiersAccordion from './IdentifiersAccordion';
import Dropdown from '@/components/UI/Dropdown';

const sectionHeaderStyle = (isEnabled = true): SxProps<Theme> => ({
  color: isEnabled ? 'neutral.900' : 'neutral.400',
  fontWeight: 'fontWeightMedium',
  mb: '10px',
  fontSize: FONT_SIZES.xxl,
});

const sectionWrapperStyle: SxProps<Theme> = {
  borderLeft: '4px solid',
  borderColor: 'accent.100',
  pl: 2,
};

const cardContainerStyle = (isActive: boolean): SxProps<Theme> => ({
  border: `${isActive ? 2 : 1}px solid`,
  borderColor: isActive ? 'primary.500' : 'neutral.200',
  borderRadius: '12px',
  backgroundColor: isActive ? 'primary.50' : 'common.white',
  boxShadow: (theme: Theme) => `0px 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
  padding: '20px',
  cursor: 'pointer',
  transition: 'transform 0.3s',
  '&:hover': {
    transform: 'scale(1.02)',
  },
});

const cardHeaderStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const iconTitleGroupStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: '24px',
};

const recommendedBadgeStyle: SxProps<Theme> = {
  padding: '4px 12px',
  borderRadius: '999px',
  bgcolor: 'accent.100',
  color: 'accent.500',
  border: '1px solid',
  borderColor: 'accent.500',
  fontSize: FONT_SIZES.xs,
  fontWeight: 'fontWeightMedium',
};

const HIPAAMethods: (HIPAAMethodUI & { slug: string })[] = [
  {
    id: 1,
    slug: 'safe-harbor',
    title: 'Safe Harbor',
    titleKey: 'deIdentify.settings.method.safeHarbor.title',
    descKey: 'deIdentify.settings.method.safeHarbor.description',
    commentKey: 'deIdentify.settings.method.safeHarbor.comment',
  },
  {
    id: 2,
    slug: 'expert-determination',
    title: 'Expert Determination',
    titleKey: 'deIdentify.settings.method.expertDetermination.title',
    descKey: 'deIdentify.settings.method.expertDetermination.description',
    commentKey: 'deIdentify.settings.method.expertDetermination.comment',
  },
];

const thresholds = [
  {
    id: 1,
    slug: 'conservative',
    titleKey: 'deIdentify.settings.detection.thresholds.conservative.title',
    descKey: 'deIdentify.settings.detection.thresholds.conservative.description',
    score: Threshold.LOW,
  },
  {
    id: 2,
    slug: 'balanced',
    titleKey: 'deIdentify.settings.detection.thresholds.balanced.title',
    descKey: 'deIdentify.settings.detection.thresholds.balanced.description',
    score: Threshold.MIDDLE,
  },
  {
    id: 3,
    slug: 'aggressive',
    titleKey: 'deIdentify.settings.detection.thresholds.aggressive.title',
    descKey: 'deIdentify.settings.detection.thresholds.aggressive.description',
    score: Threshold.HIGH,
  },
];

const STRATEGY_OPTIONS: RedactOption[] = [
  {
    id: 'Redact',
    category: 'REMOVE',
    categoryLabel: 'deIdentify.settings.strategies.categories.remove',
    titleKey: 'deIdentify.settings.strategies.redact.title',
    descKey: 'deIdentify.settings.strategies.redact.description',
    icon: <RedactIcon />,
  },
  {
    id: 'Replace',
    category: 'REPLACE',
    categoryLabel: 'deIdentify.settings.strategies.categories.replace',
    titleKey: 'deIdentify.settings.strategies.replace.title',
    descKey: 'deIdentify.settings.strategies.replace.description',
    icon: <ReplaceIcon />,
  },
  {
    id: 'Synthetic',
    category: 'REPLACE',
    categoryLabel: 'deIdentify.settings.strategies.categories.replace',
    titleKey: 'deIdentify.settings.strategies.synthetic.title',
    descKey: 'deIdentify.settings.strategies.synthetic.description',
    icon: <SyntheticIcon />,
  },
  {
    id: 'Mask',
    category: 'PROTECT',
    categoryLabel: 'deIdentify.settings.strategies.categories.protect',
    titleKey: 'deIdentify.settings.strategies.mask.title',
    descKey: 'deIdentify.settings.strategies.mask.description',
    icon: <MaskIcon />,
  },
  {
    id: 'Hash',
    category: 'PROTECT',
    categoryLabel: 'deIdentify.settings.strategies.categories.protect',
    titleKey: 'deIdentify.settings.strategies.hash.title',
    descKey: 'deIdentify.settings.strategies.hash.description',
    icon: <HashIcon />,
  },
];

const HIPAAConfiguration = () => {
  const { t } = useTranslation();
  const { currentJob } = useAppSelector((state) => state.jobs);
  const dispatch = useAppDispatch();
  const [langSearch, setLangSearch] = useState('');

  const updateJob = async (jobId: string, updateData: Partial<IJob>) => {
    const response = await jobsService.updateJob(jobId, updateData);
    dispatch(setJobAC(response));
  };

  const config = currentJob?.wizardState?.configSettings;
  const firstEntity = config?.entities?.[0];
  const strategies = (config?.strategies as Record<string, string>) || {};
  const selectedStrategyId = (firstEntity && strategies[firstEntity]) || 'Redact';
  const currentLangCode = config?.language || t('languages.english');

  const strategyOptions = useMemo(
    () =>
      STRATEGY_OPTIONS.map((opt) => ({
        id: opt.id,
        title: t(opt.titleKey),
        description: t(opt.descKey),
        icon: opt.icon,
        category: t(opt.categoryLabel),
      })),
    [t],
  );

  const languageOptions = useMemo(() => {
    interface LanguageOption {
      id: string;
      title: string;
      category: string;
      rightElement: React.ReactNode;
    }
    const options: LanguageOption[] = [];
    const searchLower = langSearch.toLowerCase();

    if (!langSearch && config?.isAutoDetected) {
      const currentLang = ALL_LANGUAGES.find((l) => l.code === currentLangCode);
      options.push({
        id: currentLangCode,
        title: currentLang
          ? t(currentLang.name)
          : t('deIdentify.languageSelect.autoDetectedUnknown'),
        category: '',
        rightElement: (
          <Chip
            label={t('deIdentify.languageSelect.autoDetected')}
            size="small"
            sx={{
              bgcolor: (theme: Theme) => alpha(theme.palette.accent[400]!, 0.1),
              color: 'accent.400',
              height: 20,
              fontSize: FONT_SIZES.xs,
            }}
          />
        ),
      });
    }

    if (!langSearch) {
      RECENTLY_USED.forEach((l) => {
        options.push({
          id: l.code,
          title: t(l.name),
          category: t('deIdentify.languageSelect.recentlyUsed'),
          rightElement:
            l.code === currentLangCode ? (
              <CheckIcon sx={{ fontSize: FONT_SIZES.lg, color: 'primary.500' }} />
            ) : null,
        });
      });
    }

    ALL_LANGUAGES.map((l) => ({ ...l, translatedName: t(l.name) }))
      .filter((l) => l.translatedName.toLowerCase().includes(searchLower))
      .forEach((l) => {
        options.push({
          id: l.code,
          title: l.translatedName,
          category: langSearch ? '' : t('deIdentify.languageSelect.allLanguages'),
          rightElement:
            l.code === currentLangCode ? (
              <CheckIcon sx={{ fontSize: FONT_SIZES.lg, color: 'primary.500' }} />
            ) : null,
        });
      });

    return options;
  }, [langSearch, currentLangCode, config, t]);

  const handleStrategyChange = async (id: string) => {
    if (!currentJob?.wizardState) return;
    const entities = config?.entities || [];
    const newStrategies = Object.fromEntries(entities.map((e) => [e, id]));
    await updateJob(currentJob.id, {
      wizardState: {
        ...currentJob.wizardState,
        configSettings: { ...config!, strategies: newStrategies },
      },
    });
  };

  const handleLanguageChange = async (code: string) => {
    if (!currentJob?.wizardState) return;
    await updateJob(currentJob.id, {
      wizardState: { ...currentJob.wizardState, configSettings: { ...config!, language: code } },
    });
  };

  const selectMethod = async (method: HIPAAMethodUI) => {
    if (!currentJob?.wizardState || !currentJob.id) return;
    const entities = [
      'NAME',
      'DATE',
      'SSN',
      'PHONE',
      'FAX',
      'EMAIL',
      'ADDRESS',
      'ACCOUNT',
      'LICENSE',
      'VEHICLE',
      'URL',
      'IP',
      'BIOMETRIC',
      'PHOTO',
      'DEVICE',
      'MRN',
      'BENEFICIARY',
      'CERTIFICATE',
    ];
    await updateJob(currentJob.id, {
      wizardState: {
        ...currentJob.wizardState,
        configSettings: {
          ...config!,
          method: method.title,
          strategies: method.id === 1 ? Object.fromEntries(entities.map((e) => [e, 'Redact'])) : {},
          entities,
          language: currentJob?.wizardState?.configSettings.language || 'en',
        },
      },
    });
  };

  const selectThreshold = async (threshold: number) => {
    if (!currentJob?.wizardState || !currentJob.id) return;
    await updateJob(currentJob.id, {
      wizardState: { ...currentJob.wizardState, configSettings: { ...config!, threshold } },
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: '48px' }}>
        <Typography sx={sectionHeaderStyle()}>
          {t('deIdentify.settings.sections.method')}
        </Typography>
        <Grid container spacing={2} sx={sectionWrapperStyle}>
          {HIPAAMethods.map((method) => {
            const isActive = config?.method === method.title;
            return (
              <Grid size={{ xs: 12, md: 6 }} key={method.id}>
                <Box
                  data-testid={`method-${method.slug}`}
                  data-active={isActive}
                  onClick={() => selectMethod(method)}
                  sx={cardContainerStyle(isActive)}
                >
                  <Box sx={cardHeaderStyle}>
                    <Box sx={iconTitleGroupStyle}>
                      {isActive ? (
                        <RadioButtonCheckedOutlinedIcon />
                      ) : (
                        <RadioButtonUncheckedOutlinedIcon sx={{ color: 'neutral.400' }} />
                      )}
                      <Typography
                        sx={{
                          color: 'primary.500',
                          fontWeight: 'fontWeightSemiBold',
                          fontSize: FONT_SIZES.lg,
                        }}
                      >
                        {t(method.titleKey)}
                      </Typography>
                    </Box>
                    {method.id === 1 && (
                      <Box sx={recommendedBadgeStyle}>
                        {t('deIdentify.settings.method.recommended')}
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{ color: 'neutral.700', fontSize: FONT_SIZES.md }}>
                    {t(method.descKey)}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      mt: 1,
                      color: method.id === 1 ? 'neutral.500' : 'warning.main',
                    }}
                  >
                    {method.id !== 1 && (
                      <ReportProblemOutlinedIcon sx={{ width: 16, height: 16 }} />
                    )}
                    <Typography sx={{ fontSize: FONT_SIZES.sm }}>{t(method.commentKey)}</Typography>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Box sx={{ mb: '48px' }}>
        <Typography sx={sectionHeaderStyle(!!config?.method)}>
          {t('deIdentify.settings.sections.identifiers')}
        </Typography>
        <Box sx={sectionWrapperStyle}>
          <IdentifiersAccordion
            isExpertMode={config?.method === 'Expert Determination'}
            updateJob={updateJob}
            currentJob={currentJob}
          />
        </Box>
      </Box>

      <Box sx={{ mb: '48px' }}>
        <Typography sx={sectionHeaderStyle()}>
          {t('deIdentify.settings.sections.output')}
        </Typography>
        <Box sx={sectionWrapperStyle}>
          <Typography sx={{ fontWeight: 'fontWeightMedium', fontSize: FONT_SIZES.md }}>
            {t('deIdentify.settings.strategies.title')}
          </Typography>
          <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.sm, mb: 2 }}>
            {t('deIdentify.settings.subtitle')}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, mb: 4 }}>
            <Box
              data-testid="strategy-select"
              data-value={selectedStrategyId}
              sx={{ flex: 2, width: '100%' }}
            >
              <Dropdown
                options={strategyOptions}
                value={selectedStrategyId}
                onChange={handleStrategyChange}
                showIcons
              />
            </Box>
            <Box sx={{ flex: 1, width: '100%' }}>
              <Dropdown
                options={languageOptions}
                value={currentLangCode}
                onChange={handleLanguageChange}
                startIcon={<LanguageIcon />}
                renderSearch={
                  <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField
                      fullWidth
                      size="small"
                      autoFocus
                      placeholder={t('deIdentify.languageSelect.search')}
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      variant="standard"
                      onClick={(e) => e.stopPropagation()}
                      InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'neutral.400', ml: 1 }} />
                          </InputAdornment>
                        ),
                        sx: { px: 1, py: 1, fontSize: FONT_SIZES.sm },
                      }}
                    />
                  </Box>
                }
              />
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 'fontWeightMedium', fontSize: FONT_SIZES.md, mb: 1 }}>
            {t('deIdentify.settings.detection.title')}
          </Typography>
          <Grid container spacing={2}>
            {thresholds.map((threshold) => {
              const isActive = config?.threshold === threshold.score;
              return (
                <Grid size={{ xs: 12, md: 6, lg: 12, xl: 4 }} key={threshold.id}>
                  <Box
                    data-testid={`threshold-${threshold.slug}`}
                    data-active={isActive}
                    data-score={threshold.score}
                    onClick={() => selectThreshold(threshold.score)}
                    sx={cardContainerStyle(isActive)}
                  >
                    <Box sx={cardHeaderStyle}>
                      <Box sx={iconTitleGroupStyle}>
                        {isActive ? (
                          <RadioButtonCheckedOutlinedIcon />
                        ) : (
                          <RadioButtonUncheckedOutlinedIcon sx={{ color: 'neutral.400' }} />
                        )}
                        <Typography
                          sx={{
                            color: 'primary.500',
                            fontWeight: 'fontWeightSemiBold',
                            fontSize: FONT_SIZES.lg,
                          }}
                        >
                          {t(threshold.titleKey)}
                        </Typography>
                      </Box>
                      {threshold.id === 2 && (
                        <Box sx={recommendedBadgeStyle}>
                          {t('deIdentify.settings.detection.recommended')}
                        </Box>
                      )}
                    </Box>
                    <Typography sx={{ color: 'neutral.700', fontSize: FONT_SIZES.md }}>
                      {t(threshold.descKey)}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {config?.threshold === Threshold.MIDDLE && (
            <Typography sx={{ color: 'neutral.700', fontSize: FONT_SIZES.md, mt: 2 }}>
              {t('deIdentify.settings.detection.recommendedNote')}
            </Typography>
          )}

          <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.xs, mt: 1 }}>
            {config?.threshold === Threshold.MIDDLE &&
              t('deIdentify.settings.detection.thresholds.balanced.info')}
            {config?.threshold === Threshold.LOW &&
              t('deIdentify.settings.detection.thresholds.conservative.info')}
            {config?.threshold === Threshold.HIGH &&
              t('deIdentify.settings.detection.thresholds.aggressive.info')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default HIPAAConfiguration;
