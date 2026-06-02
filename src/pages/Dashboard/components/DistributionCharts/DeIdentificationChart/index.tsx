import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';

import { useTheme } from '@mui/material';

import type { DistributionData } from '@/services/dashboard/types';

import { ChartWrapper } from './styled';

interface Props {
  data: DistributionData[];
}

const CHART_HEIGHT = 323;
const BAR_SIZE = 16;
const BAR_GAP = 24;
const GRID_DASH_ARRAY = '3 3';
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];
const Y_AXIS_WIDTH = 110;

const CHART_MARGIN = {
  top: 0,
  right: 0,
  left: -20,
  bottom: 0,
};

const ALL_STRATEGIES = [
  'Redact',
  'Replace',
  'Mask',
  'Hash',
  'Synthetic',
  'Generalise',
  'Pseudonymise',
  'NLP',
] as const;

const generateHorizontalCoordinates = (height: number, itemsCount: number, topOffset: number) => {
  const step = height / itemsCount;

  return Array.from({ length: itemsCount + 1 }, (_, index) => topOffset + step * index);
};

export const DeIdentificationChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  const STRATEGY_LABELS: Record<string, string> = {
    Redact: t('dashboard.deIdentificationChart.strategies.redact'),
    Replace: t('dashboard.deIdentificationChart.strategies.replace'),
    Mask: t('dashboard.deIdentificationChart.strategies.mask'),
    Hash: t('dashboard.deIdentificationChart.strategies.hash'),
    Synthetic: t('dashboard.deIdentificationChart.strategies.synthetic'),
    Generalise: t('dashboard.deIdentificationChart.strategies.generalise'),
    Pseudonymise: t('dashboard.deIdentificationChart.strategies.pseudonymise'),
    NLP: t('dashboard.deIdentificationChart.strategies.nlp'),
  };

  const normalizedData = ALL_STRATEGIES.map((key) => {
    const found = data.find((d) => d.key === key);

    return {
      name: STRATEGY_LABELS[key],
      count: found?.count ?? 0,
    };
  });

  const domainMax = useMemo(() => {
    const max = Math.max(...normalizedData.map((d) => d.count), 0);
    const rounded = Math.ceil(max / 50) * 50;
    return Math.max(rounded, 50);
  }, [normalizedData]);

  const ticks = useMemo(() => {
    const step = domainMax / 5;
    return Array.from({ length: 6 }, (_, i) => Math.round(i * step));
  }, [domainMax]);

  return (
    <ChartWrapper>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart
          data={normalizedData}
          layout="vertical"
          margin={CHART_MARGIN}
          barCategoryGap={BAR_GAP}
        >
          <CartesianGrid
            vertical
            stroke={theme.palette.charts.grid}
            strokeDasharray={GRID_DASH_ARRAY}
            horizontalCoordinatesGenerator={({ offset }) =>
              generateHorizontalCoordinates(offset.height, normalizedData.length, offset.top)
            }
          />

          <XAxis
            type="number"
            orientation="top"
            domain={[0, domainMax]}
            ticks={ticks}
            tickLine={false}
            axisLine={{
              stroke: theme.palette.charts.grid,
            }}
            tick={{
              fontWeight: theme.typography.labelSm.fontWeight,
              fontSize: theme.typography.labelSm.fontSize,
              fill: theme.palette.neutral[500],
            }}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={Y_AXIS_WIDTH}
            tickLine={false}
            axisLine={{
              stroke: theme.palette.charts.grid,
            }}
            tick={{
              fontWeight: theme.typography.labelSm.fontWeight,
              fontSize: theme.typography.labelSm.fontSize,
              fill: theme.palette.neutral[500],
            }}
          />

          <Bar
            dataKey="count"
            fill={theme.palette.charts.deIdentification}
            radius={BAR_RADIUS}
            barSize={BAR_SIZE}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
};
