import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import IdentifiersIcon from '@/assets/icons/identifiersIcon.svg?react';
import type { IJob } from '@/pages/DeIdentify/types';
import { FONT_SIZES, IDENTIFIER_GROUPS, ITEM_TO_ENTITY_MAP } from '@/constants';

interface IProps {
  isExpertMode: boolean;
  updateJob: (jobId: string, updateData: Partial<IJob>) => Promise<void>;
  currentJob: IJob | null;
}

const IdentifiersAccordion: FC<IProps> = ({ isExpertMode, updateJob, currentJob }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<boolean>(false);

  const activeEntities = currentJob?.wizardState?.configSettings.entities || [];

  const toggleItem = async (itemLabel: string) => {
    if (!isExpertMode || !currentJob) return;

    const entityName = ITEM_TO_ENTITY_MAP[itemLabel];
    if (!entityName) return;

    const newEntities = activeEntities.includes(entityName)
      ? activeEntities.filter((e) => e !== entityName)
      : [...activeEntities, entityName];

    await updateJob(currentJob.id, {
      wizardState: {
        ...currentJob.wizardState!,
        configSettings: {
          ...currentJob.wizardState!.configSettings,
          entities: newEntities,
        },
      },
    });
  };

  return (
    <Box
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <Accordion
        data-testid="identifiers-accordion"
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        elevation={0}
        disableGutters
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: 'common.white',
            borderBottom: expanded ? '1px solid' : 'none',
            borderColor: 'divider',
            '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 2 },
          }}
        >
          <IdentifiersIcon />
          <Box>
            <Typography
              sx={{
                fontWeight: 'fontWeightSemiBold',
                color: 'primary.600',
                fontSize: FONT_SIZES.md,
              }}
            >
              {isExpertMode
                ? t('deIdentify.settings.identifiers.customize')
                : t('deIdentify.settings.identifiers.fixed')}
            </Typography>

            <Typography sx={{ color: 'neutral.400', fontSize: FONT_SIZES.sm }}>
              {isExpertMode
                ? t('deIdentify.settings.identifiers.customizeSubtitle')
                : t('deIdentify.settings.identifiers.fixedSubtitle')}
            </Typography>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ p: 0, backgroundColor: 'neutral.50' }}>
          {IDENTIFIER_GROUPS.map((group) => (
            <Box key={group.title}>
              <Box sx={{ px: 2, py: 1, backgroundColor: 'neutral.100' }}>
                <Typography
                  sx={{
                    fontSize: FONT_SIZES.xs,
                    fontWeight: 'fontWeightMedium',
                    color: 'neutral.700',
                  }}
                >
                  {t(group.title)}
                </Typography>
              </Box>
              <Box sx={{ p: 2, backgroundColor: 'common.white' }}>
                <Grid container spacing={1}>
                  {group.items.map((item) => {
                    const isChecked = activeEntities.includes(ITEM_TO_ENTITY_MAP[item]);

                    const control = (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleItem(item)}
                            disabled={!isExpertMode}
                            size="small"
                            sx={{
                              color: 'neutral.300',
                              '&.Mui-checked': {
                                color: isExpertMode ? 'primary.500' : 'primary.200',
                              },
                              '&.Mui-disabled': {
                                color: isChecked ? 'primary.100' : 'neutral.200',
                              },
                              '& .MuiSvgIcon-root': { fontSize: FONT_SIZES.xl },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: FONT_SIZES.sm,
                              fontWeight:
                                isChecked && isExpertMode
                                  ? 'fontWeightMedium'
                                  : 'fontWeightRegular',
                              color: isExpertMode
                                ? isChecked
                                  ? 'neutral.900'
                                  : 'neutral.600'
                                : 'neutral.400',
                              transition: 'color 0.2s',
                            }}
                          >
                            {t(item)}
                          </Typography>
                        }
                      />
                    );

                    return (
                      <Grid
                        size={{ xs: 12, sm: 6 }}
                        key={item}
                        data-testid={`identifier-${ITEM_TO_ENTITY_MAP[item]}`}
                        data-checked={isChecked}
                      >
                        {!isExpertMode ? (
                          <Tooltip title={t('deIdentify.settings.identifiers.expertTooltip')} arrow>
                            <Box sx={{ display: 'inline-block', width: '100%' }}>{control}</Box>
                          </Tooltip>
                        ) : (
                          control
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default IdentifiersAccordion;
