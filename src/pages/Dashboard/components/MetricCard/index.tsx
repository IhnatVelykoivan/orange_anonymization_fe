import React from 'react';

import { Box, Skeleton } from '@mui/material';

import type { DashboardState } from '@/pages/Dashboard/types';

import { CardWrapper, IconWrapper, Label, TopBar, Value } from './styled';

const SKELETON_WIDTH = 60;
const SKELETON_HEIGHT = 36;

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  state: DashboardState;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, state }) => {
  const hasData = typeof value === 'number' ? value > 0 : parseFloat(String(value)) > 0;

  const renderValue = () => {
    if (state === 'loading') {
      return (
        <Skeleton width={SKELETON_WIDTH} height={SKELETON_HEIGHT} sx={{ bgcolor: 'primary.300' }} />
      );
    }

    if (state === 'error') {
      return <Value isError>—</Value>;
    }

    return <Value>{value}</Value>;
  };

  return (
    <CardWrapper>
      <TopBar />

      <IconWrapper hasData={hasData}>{icon}</IconWrapper>

      <Box>
        <Label>{label}</Label>
        {renderValue()}
      </Box>
    </CardWrapper>
  );
};
