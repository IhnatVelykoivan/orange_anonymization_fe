import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { useMediaQuery, useTheme } from '@mui/material';

import type { DistributionData } from '@/services/dashboard/types';
import { formatFramework } from '@/features/analyses/utils/formatters';

import {
  ChartContainer,
  ChartArea,
  LegendContainer,
  LegendItem,
  LegendDot,
  LegendText,
} from './styled';

interface Props {
  data: DistributionData[];
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
  index?: number;
}

const RADIAN = Math.PI / 180;
const OFFSET = 22;
const LABEL_FONT_WEIGHT = 600;
const PERCENT_FONT_WEIGHT = 700;
const LABEL_STROKE_WIDTH = 1.5;
const TOP_RIGHT_MIN_ANGLE = 20;
const TOP_RIGHT_MAX_ANGLE = 90;
const TOP_OFFSET_MIN_ANGLE = 60;
const TOP_OFFSET_MAX_ANGLE = 120;
const BOTTOM_LINE_MIN_ANGLE = 240;
const BOTTOM_LINE_MAX_ANGLE = 320;
const TOP_RIGHT_X_OFFSET = 8;
const TOP_RIGHT_Y_OFFSET = 8;
const BOTTOM_EXTRA_LINE_LENGTH = 30;
const TEXT_GAP = 4;

const PIE_CHART_MARGIN = {
  top: 20,
  right: 20,
  bottom: 0,
  left: 0,
};

const getSmartYOffset = (angle: number) => {
  if (angle > TOP_OFFSET_MIN_ANGLE && angle < TOP_OFFSET_MAX_ANGLE) {
    return -14;
  }

  if (angle > 240 && angle < 300) {
    return 14;
  }

  return 0;
};

export const ComplianceChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const formattedData = useMemo(() => {
    return data.map((item) => ({
      key: item.key,
      name: formatFramework(item.key),
      count: item.count,
    }));
  }, [data]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const sortedData = useMemo(() => {
    const cloned = [...formattedData];
    const swissIndex = cloned.findIndex((i) => i.key === 'swiss-fadp');
    const ukIndex = cloned.findIndex((i) => i.key === 'uk-gdpr');

    if (swissIndex !== -1 && ukIndex !== -1) {
      [cloned[swissIndex], cloned[ukIndex]] = [cloned[ukIndex], cloned[swissIndex]];
    }

    return cloned;
  }, [formattedData]);

  const isSingleItem = sortedData.length === 1;
  const chartConfig = useMemo(() => {
    const safeWidth = Math.max(containerWidth, 240);
    const reservedSpace = isMobile ? 120 : 170;
    const calculatedRadius = (safeWidth - reservedSpace) / 2;

    const outerRadius = isSingleItem
      ? Math.max(36, Math.min(isTablet ? 56 : 80, calculatedRadius))
      : Math.max(38, Math.min(isTablet ? 72 : 100, calculatedRadius));

    return {
      outerRadius,
      innerRadius: outerRadius * 0.72,
      lineLength: isSingleItem ? (isMobile ? 40 : 58) : isMobile ? 26 : isTablet ? 42 : 60,
      fontSize: isMobile ? 9 : isTablet ? 11 : 13,
      lineGap: isMobile ? 12 : 16,
      percentYOffset: isMobile ? 2 : 4,
    };
  }, [containerWidth, isSingleItem, isMobile, isTablet]);

  const colors = useMemo<string[]>(
    () => [
      theme.palette.charts.compliance.hipaa ?? '',
      theme.palette.charts.compliance.gdpr ?? '',
      theme.palette.charts.compliance.ukDpi ?? '',
      theme.palette.charts.compliance.swissFadp ?? '',
    ],
    [theme],
  );

  const renderLabel = useCallback(
    (props: PieLabelProps) => {
      const {
        cx = 0,
        cy = 0,
        midAngle = 0,
        outerRadius = 0,
        percent = 0,
        name = '',
        index = 0,
      } = props;

      const color = colors[index % colors.length] ?? '';
      const label = formatFramework(name);

      if (isSingleItem) {
        const sx = cx + outerRadius;
        const sy = cy;
        const mx = sx + OFFSET;
        const my = sy;
        const ex = mx + chartConfig.lineLength;

        return (
          <g>
            <path
              d={`M ${sx},${sy} L ${mx},${my} L ${ex},${my}`}
              stroke={color}
              strokeWidth={LABEL_STROKE_WIDTH}
              fill="none"
            />
            <text
              x={ex}
              y={my - chartConfig.lineGap - TEXT_GAP}
              textAnchor="end"
              fontWeight={LABEL_FONT_WEIGHT}
              fontSize={chartConfig.fontSize}
              fill={color}
            >
              {label}
            </text>
            <text
              x={ex}
              y={my - chartConfig.percentYOffset}
              textAnchor="end"
              fontWeight={PERCENT_FONT_WEIGHT}
              fontSize={chartConfig.fontSize}
              fill={color}
            >
              {Math.round(percent * 100)}%
            </text>
          </g>
        );
      }

      const angle = ((midAngle % 360) + 360) % 360;
      const yOffset = getSmartYOffset(angle);
      const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
      const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
      const isTopRight = angle > TOP_RIGHT_MIN_ANGLE && angle < TOP_RIGHT_MAX_ANGLE;

      const mx = isTopRight
        ? sx + TOP_RIGHT_X_OFFSET
        : cx + (outerRadius + OFFSET) * Math.cos(-midAngle * RADIAN);

      const my = isTopRight
        ? sy - TOP_RIGHT_Y_OFFSET
        : cy + (outerRadius + OFFSET) * Math.sin(-midAngle * RADIAN) + yOffset;

      const isRight = mx > cx;
      const isBottom = angle > BOTTOM_LINE_MIN_ANGLE && angle < BOTTOM_LINE_MAX_ANGLE;
      const extraLineLength = isBottom ? BOTTOM_EXTRA_LINE_LENGTH : 0;

      const ex = isRight
        ? mx + chartConfig.lineLength + extraLineLength
        : mx - chartConfig.lineLength - extraLineLength;

      const lineStart = isRight ? mx : ex;
      const lineEnd = isRight ? ex : mx;
      const percentX = isRight ? lineEnd : lineStart;
      const percentAnchor = isRight ? 'end' : 'start';
      const labelX = isRight ? lineEnd : lineStart;
      const labelAnchor = isRight ? 'end' : 'start';

      return (
        <g>
          <path
            d={`M ${sx},${sy} L ${mx},${my} L ${ex},${my}`}
            stroke={color}
            strokeWidth={LABEL_STROKE_WIDTH}
            fill="none"
          />
          <text
            x={labelX}
            y={my - chartConfig.lineGap - TEXT_GAP}
            textAnchor={labelAnchor}
            fontWeight={LABEL_FONT_WEIGHT}
            fontSize={chartConfig.fontSize}
            fill={color}
          >
            {label}
          </text>
          <text
            x={percentX}
            y={my - chartConfig.percentYOffset}
            textAnchor={percentAnchor}
            fontWeight={PERCENT_FONT_WEIGHT}
            fontSize={chartConfig.fontSize}
            fill={color}
          >
            {Math.round(percent * 100)}%
          </text>
        </g>
      );
    },
    [chartConfig, colors, isSingleItem],
  );

  return (
    <ChartContainer ref={containerRef}>
      <ChartArea>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={PIE_CHART_MARGIN}>
            <Pie
              data={sortedData}
              dataKey="count"
              cx="50%"
              cy="50%"
              innerRadius={chartConfig.innerRadius}
              outerRadius={chartConfig.outerRadius}
              stroke="none"
              labelLine={false}
              label={renderLabel}
            >
              {sortedData.map((entry, index) => (
                <Cell key={entry.key} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartArea>

      <LegendContainer>
        {sortedData.map((item, index) => (
          <LegendItem key={item.name}>
            <LegendDot color={colors[index % colors.length]} />
            <LegendText color={theme.palette.neutral[500] ?? ''}>
              {formatFramework(item.key)}
            </LegendText>
          </LegendItem>
        ))}
      </LegendContainer>
    </ChartContainer>
  );
};
