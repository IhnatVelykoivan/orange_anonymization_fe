import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';

import { useTheme } from '@mui/material';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import type { DistributionData } from '@/services/dashboard/types';

import { Wrapper, ShowMoreButton, ShowMoreContainer, AnimatedChartContainer } from './styled';

interface Props {
  data: DistributionData[];
}

const COLLAPSED_ITEMS_COUNT = 7;
const BAR_SIZE = 16;
const BAR_GAP = 24;
const GRID_DASH_ARRAY = '3 3';
const Y_AXIS_WIDTH = 110;
const ROW_HEIGHT = 32;
const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0];

const CHART_MARGIN = {
  top: 0,
  right: 0,
  left: -20,
  bottom: 0,
};

const generateHorizontalCoordinates = (height: number, itemsCount: number, topOffset: number) => {
  const step = height / itemsCount;

  return Array.from({ length: itemsCount + 1 }, (_, index) => topOffset + step * index);
};

export const EntityTypesChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animatedContainerRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);
  const hasData = data.length > 0;

  const showAllLabel = t('dashboard.entityTypesChart.showAll', {
    count: data.length,
  });

  const showLessLabel = t('dashboard.entityTypesChart.showLess');

  const normalizedData = useMemo(() => {
    return data.map((item) => ({
      key: item.key,
      name: t(`dashboard.entityTypesChart.labels.${item.key}`, item.key),
      count: item.count ?? 0,
    }));
  }, [data, t]);

  const domainMax = useMemo(() => {
    const max = Math.max(...normalizedData.map((d) => d.count), 0);
    const rounded = Math.ceil(max / 50) * 50;
    return Math.max(rounded, 50);
  }, [normalizedData]);

  const ticks = useMemo(() => {
    const step = domainMax / 5;
    return Array.from({ length: 6 }, (_, i) => Math.round(i * step));
  }, [domainMax]);

  const visibleData = useMemo(() => {
    return expanded ? normalizedData : normalizedData.slice(0, COLLAPSED_ITEMS_COUNT);
  }, [expanded, normalizedData]);

  const chartHeight = useMemo(() => visibleData.length * ROW_HEIGHT + 40, [visibleData.length]);

  const scrollWrapperBottomToViewport = () => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrollAmount = rect.bottom - window.innerHeight + 24;

    window.scrollBy({
      top: scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleToggle = () => {
    pendingScrollRef.current = true;
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    const el = animatedContainerRef.current;
    if (!el) return;

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'height') return;
      if (!pendingScrollRef.current) return;

      pendingScrollRef.current = false;
      scrollWrapperBottomToViewport();
    };

    el.addEventListener('transitionend', onTransitionEnd);

    return () => {
      el.removeEventListener('transitionend', onTransitionEnd);
    };
  }, []);

  if (!hasData) return null;

  return (
    <Wrapper ref={wrapperRef}>
      <AnimatedChartContainer ref={animatedContainerRef} height={chartHeight}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={visibleData}
            layout="vertical"
            margin={CHART_MARGIN}
            barCategoryGap={BAR_GAP}
          >
            <CartesianGrid
              vertical
              stroke={theme.palette.charts.grid}
              strokeDasharray={GRID_DASH_ARRAY}
              horizontalCoordinatesGenerator={({ offset }) =>
                generateHorizontalCoordinates(offset.height, visibleData.length, offset.top)
              }
            />

            <XAxis
              type="number"
              orientation="top"
              domain={[0, domainMax]}
              ticks={ticks}
              tickLine={false}
              axisLine={{ stroke: theme.palette.charts.grid }}
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
              axisLine={{ stroke: theme.palette.charts.grid }}
              tick={{
                fontWeight: theme.typography.labelSm.fontWeight,
                fontSize: theme.typography.labelSm.fontSize,
                fill: theme.palette.neutral[500],
              }}
            />

            <Bar
              dataKey="count"
              fill={theme.palette.charts.entityBar}
              radius={BAR_RADIUS}
              barSize={BAR_SIZE}
            />
          </BarChart>
        </ResponsiveContainer>
      </AnimatedChartContainer>

      {normalizedData.length > COLLAPSED_ITEMS_COUNT && (
        <ShowMoreContainer>
          <ShowMoreButton onClick={handleToggle}>
            {expanded ? (
              <>
                {showLessLabel}
                <KeyboardArrowUpIcon />
              </>
            ) : (
              <>
                {showAllLabel}
                <KeyboardArrowDownIcon />
              </>
            )}
          </ShowMoreButton>
        </ShowMoreContainer>
      )}
    </Wrapper>
  );
};
