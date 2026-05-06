import { alpha, Box, Grid, Typography } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/store';
import {
  ComplianceFramework,
  type IComplianceFramework,
  type IJob,
  type WizardState,
} from '@/pages/DeIdentify/types';
import { jobsService } from '@/services/jobsService';
import { setJobAC } from '@/store/slices/jobsSlice';
import { FONT_SIZES } from '@/constants';

const complianceFrameworks: (Omit<IComplianceFramework, 'title' | 'description' | 'tag'> & {
  titleKey: string;
  descriptionKey: string;
  tagKey: string;
})[] = [
  {
    id: 1,
    slug: ComplianceFramework.HIPAA,
    titleKey: 'deIdentify.framework.hipaa.title',
    descriptionKey: 'deIdentify.framework.hipaa.description',
    tagKey: 'deIdentify.framework.hipaa.tag',
  },
  {
    id: 2,
    slug: ComplianceFramework.EU_GDPR,
    titleKey: 'deIdentify.framework.euGdpr.title',
    descriptionKey: 'deIdentify.framework.euGdpr.description',
    tagKey: 'deIdentify.framework.euGdpr.tag',
  },
  {
    id: 3,
    slug: ComplianceFramework.UK_GDPR,
    titleKey: 'deIdentify.framework.ukGdpr.title',
    descriptionKey: 'deIdentify.framework.ukGdpr.description',
    tagKey: 'deIdentify.framework.ukGdpr.tag',
  },
  {
    id: 4,
    slug: ComplianceFramework.SWISS_FADP,
    titleKey: 'deIdentify.framework.swissFadp.title',
    descriptionKey: 'deIdentify.framework.swissFadp.description',
    tagKey: 'deIdentify.framework.swissFadp.tag',
  },
];

const Compliance = () => {
  const { t } = useTranslation();
  const { currentJob } = useAppSelector((state) => state.jobs);
  const dispatch = useAppDispatch();

  const updateJob = async (jobId: string, updateData: Partial<IJob>) => {
    const response = await jobsService.updateJob(jobId, updateData);
    dispatch(setJobAC(response));
  };

  const selectFramework = async (framework: IComplianceFramework) => {
    const data: Partial<IJob> = {
      framework: framework.slug,
      wizardState: {
        ...(currentJob?.wizardState as WizardState),
        frameworkSelection: framework.slug,
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
        {t('deIdentify.framework.title')}
      </Typography>
      <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.sm, mb: '48px' }}>
        {t('deIdentify.framework.subtitle')}
      </Typography>

      <Grid container spacing={2}>
        {complianceFrameworks.map((framework) => {
          const isActive = currentJob?.wizardState?.frameworkSelection === framework.slug;

          return (
            <Grid size={{ xs: 12, md: 6 }} key={framework.id}>
              <Box
                data-testid={`framework-${framework.slug}`}
                data-active={isActive}
                onClick={() => selectFramework(framework as unknown as IComplianceFramework)}
                sx={{
                  border: `${isActive ? 2 : 1}px solid`,
                  borderColor: (theme) =>
                    isActive ? theme.palette.primary[500] : theme.palette.neutral[200],
                  borderRadius: '12px',
                  backgroundColor: (theme) =>
                    isActive ? theme.palette.primary[50] : theme.palette.common.white,
                  boxShadow: (theme) => `0px 1px 3px ${alpha(theme.palette.common.black, 0.08)}`,
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Typography sx={{ color: 'primary.500', fontWeight: 'fontWeightSemiBold' }}>
                    {t(framework.titleKey)}
                  </Typography>
                  {isActive && <CheckIcon sx={{ color: 'primary.500' }} />}
                </Box>
                <Typography sx={{ color: 'primary.500', fontSize: FONT_SIZES.xs, mb: '54px' }}>
                  {t(framework.descriptionKey)}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    backgroundColor: 'primary.50',
                    color: 'primary.500',
                    fontSize: FONT_SIZES.xs,
                    fontWeight: 'fontWeightMedium',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: `1px solid`,
                    borderColor: `${isActive ? 'primary.300' : 'primary.500'}`,
                  }}
                >
                  {t(framework.tagKey)}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Compliance;
