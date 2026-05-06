import { useAppSelector } from '@/store/store';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import HIPAAConfiguration from './HIPAAConfiguration';
import { FONT_SIZES } from '@/constants';

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
        {t('deIdentify.settings.subtitle')}
      </Typography>

      {currentJob?.wizardState?.frameworkSelection === 'hipaa' ? (
        <HIPAAConfiguration />
      ) : (
        <Box></Box>
      )}
    </Box>
  );
};

export default Configuration;
