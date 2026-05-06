import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/store';
import { Box, Typography } from '@mui/material';
import { FONT_SIZES } from '@/constants';
import { ComplianceFramework } from '@/pages/DeIdentify/types';
import StandardComplianceConfiguration from './StandardComplianceConfiguration';
import HIPAAConfiguration from './HIPAAConfiguration';

const Configuration = () => {
  const { t } = useTranslation();
  const { currentJob } = useAppSelector((state) => state.jobs);

  return (
    <Box data-testid="step-configuration" sx={{ mx: '20px' }}>
      <Typography
        sx={{
          color: 'neutral.900',
          fontWeight: 'fontWeightSemiBold',
          fontSize: FONT_SIZES.xxl,
          mb: '8px',
        }}
      >
        {t('deIdentify.settings.title')}
      </Typography>
      <Typography sx={{ color: 'neutral.500', fontSize: FONT_SIZES.sm, mb: '48px' }}>
        {currentJob?.wizardState?.frameworkSelection === ComplianceFramework.HIPAA
          ? t('deIdentify.settings.subtitle')
          : t('deIdentify.settings.subtitleStandard')}
      </Typography>

      {currentJob?.wizardState?.frameworkSelection === ComplianceFramework.HIPAA ? (
        <HIPAAConfiguration />
      ) : (
        <StandardComplianceConfiguration />
      )}
    </Box>
  );
};

export default Configuration;
