import React from 'react';
import { useTranslation } from 'react-i18next';
import { CircularProgress } from '@mui/material';

import type { DashboardState } from '@/pages/Dashboard/types';

import {
  CardWrapper,
  Title,
  Subtitle,
  EmptyBody,
  EmptyLabel,
  SectionDivider,
  ErrorLabel,
} from './styled';

interface EmptyStateCardProps {
  state: DashboardState;
  hasData?: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  contentSubtitle?: string;
  children?: React.ReactNode;
}

const LOADER_SIZE = 28;

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  subtitle,
  state,
  hasData = false,
  contentSubtitle,
  children,
}) => {
  const { t } = useTranslation();

  const showEmpty = state === 'empty' || (state === 'content' && !hasData);

  const finalSubtitle =
    state === 'content' && hasData && contentSubtitle ? contentSubtitle : subtitle;

  return (
    <CardWrapper>
      <Title>{title}</Title>
      <Subtitle>{finalSubtitle}</Subtitle>
      <SectionDivider />

      {state === 'loading' && (
        <EmptyBody>
          <CircularProgress size={LOADER_SIZE} />
        </EmptyBody>
      )}

      {state === 'error' && (
        <EmptyBody>
          <ErrorLabel>{t('dashboard.errors.failedToLoadAnalysesActivity')}</ErrorLabel>
        </EmptyBody>
      )}

      {showEmpty && (
        <EmptyBody>
          {icon}
          <EmptyLabel>{t('dashboard.emptyState.noAnalysesFound')}</EmptyLabel>
        </EmptyBody>
      )}

      {state === 'content' && hasData && children}
    </CardWrapper>
  );
};
