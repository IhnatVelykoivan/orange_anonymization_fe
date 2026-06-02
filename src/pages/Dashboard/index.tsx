import React, { useState } from 'react';

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import AddIcon from '@/assets/icons/dashboard/add.svg?react';
import DeIdentificationIcon from '@/assets/icons/dashboard/EmptyStateCard/de-identification.svg?react';
import EntityIcon from '@/assets/icons/dashboard/EmptyStateCard/entity.svg?react';
import FrameworkIcon from '@/assets/icons/dashboard/EmptyStateCard/framework.svg?react';
import InfoIcon from '@/assets/icons/dashboard/info.svg?react';
import AnalyticsIcon from '@/assets/icons/dashboard/MetricCard/analytics.svg?react';
import DescriptionIcon from '@/assets/icons/dashboard/MetricCard/description.svg?react';
import ManageSearchIcon from '@/assets/icons/dashboard/MetricCard/manage_search.svg?react';
import VerifiedIcon from '@/assets/icons/dashboard/MetricCard/verified.svg?react';
import { ROUTES } from '@/constants';
import { EmptyStateCard } from '@/pages/Dashboard/components/EmptyStateCard';
import { MetricCard } from '@/pages/Dashboard/components/MetricCard';
import { RecentActivityTable } from '@/pages/Dashboard/components/RecentActivityTable';

import { ActivityChart } from './components/ActivityChart';
import { ChartControls } from './components/ActivityChart/ChartControls';
import {
  CHART_RANGES,
  CHART_TYPES,
  type ChartType,
  type Range,
} from './components/ActivityChart/types';
import { DashboardFilters } from './components/DashboardFilters';
import { FRAMEWORK_VALUES, type FrameworkValue } from './components/DashboardFilters/types';
import { ComplianceChart } from './components/DistributionCharts/ComplianceChart';
import { DeIdentificationChart } from './components/DistributionCharts/DeIdentificationChart';
import { EntityTypesChart } from './components/DistributionCharts/EntityTypesChart';
import {
  BottomGrid,
  Card,
  ChartHeaderRow,
  MetricsRow,
  NewAnalysisButton,
  PageWrapper,
  RecentActivityCard,
  RecentActivityTableWrapper,
  SectionDivider,
  SectionSubtitle,
  SectionTitle,
  ViewAllButton,
  WelcomeBanner,
  WelcomeSubtitle,
  WelcomeText,
  WelcomeTitle,
} from './styled';
import { useDashboard } from './useDashboard';

const Dashboard: React.FC = () => {
  const [chartType, setChartType] = useState<ChartType>(CHART_TYPES.DOCUMENTS);
  const [range, setRange] = useState<Range>(CHART_RANGES.DAYS_7);
  const [framework, setFramework] = useState<FrameworkValue>(FRAMEWORK_VALUES.ALL);

  const {
    metrics,
    chartData,
    strategiesDistribution,
    frameworksDistribution,
    entitiesDistribution,
    recentActivity,
    state,
    startDate,
    endDate,
  } = useDashboard({ range, framework });

  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageWrapper>
      {state === 'empty' ? (
        <WelcomeBanner>
          <WelcomeText>
            <InfoIcon />

            <Box>
              <WelcomeTitle>{t('dashboard.welcomeTitle')}</WelcomeTitle>
              <WelcomeSubtitle>{t('dashboard.welcomeSubtitle')}</WelcomeSubtitle>
            </Box>
          </WelcomeText>

          <NewAnalysisButton startIcon={<AddIcon />} onClick={() => navigate(ROUTES.DE_IDENTIFY)}>
            {t('dashboard.newAnalysis')}
          </NewAnalysisButton>
        </WelcomeBanner>
      ) : (
        <DashboardFilters
          range={range}
          framework={framework}
          setRange={setRange}
          setFramework={setFramework}
        />
      )}

      <MetricsRow>
        <MetricCard
          icon={<DescriptionIcon />}
          label={t('dashboard.metrics.totalDocuments')}
          value={metrics?.totalDocuments ?? 0}
          state={state}
        />
        <MetricCard
          icon={<ManageSearchIcon />}
          label={t('dashboard.metrics.entitiesDetected')}
          value={metrics?.entitiesDetected ?? 0}
          state={state}
        />
        <MetricCard
          icon={<VerifiedIcon />}
          label={t('dashboard.metrics.anonymizationRate')}
          value={`${metrics?.anonymizationRate ?? 0}${t('common.percent')}`}
          state={state}
        />
        <MetricCard
          icon={<AnalyticsIcon />}
          label={t('dashboard.metrics.syntheticRecords')}
          value={metrics?.syntheticRecords ?? 0}
          state={state}
        />
      </MetricsRow>

      <Card>
        <ChartHeaderRow>
          <Box>
            <SectionTitle>{t('dashboard.chart.activityTitle')}</SectionTitle>
            <SectionSubtitle>{t('dashboard.chart.activitySubtitle')}</SectionSubtitle>
          </Box>

          <ChartControls chartType={chartType} setChartType={setChartType} />
        </ChartHeaderRow>

        <SectionDivider />

        <ActivityChart
          chartData={chartData}
          chartType={chartType}
          startDate={startDate}
          endDate={endDate}
          state={state}
        />
      </Card>

      <BottomGrid>
        <EmptyStateCard
          icon={<DeIdentificationIcon />}
          title={t('dashboard.emptyState.deIdentification.title')}
          subtitle={t('dashboard.emptyState.deIdentification.subtitle')}
          contentSubtitle={t('dashboard.emptyState.deIdentification.contentSubtitle')}
          state={state}
          hasData={strategiesDistribution.length > 0}
        >
          <DeIdentificationChart data={strategiesDistribution} />
        </EmptyStateCard>

        <EmptyStateCard
          icon={<FrameworkIcon />}
          title={t('dashboard.emptyState.compliance.title')}
          subtitle={t('dashboard.emptyState.compliance.subtitle')}
          contentSubtitle={t('dashboard.emptyState.compliance.contentSubtitle')}
          state={state}
          hasData={frameworksDistribution.length > 0}
        >
          <ComplianceChart data={frameworksDistribution} />
        </EmptyStateCard>

        <EmptyStateCard
          icon={<EntityIcon />}
          title={t('dashboard.emptyState.entityTypes.title')}
          subtitle={t('dashboard.emptyState.entityTypes.subtitle')}
          contentSubtitle={t('dashboard.emptyState.entityTypes.contentSubtitle')}
          state={state}
          hasData={entitiesDistribution.length > 0}
        >
          <EntityTypesChart data={entitiesDistribution} />
        </EmptyStateCard>
      </BottomGrid>

      <RecentActivityCard>
        <ChartHeaderRow>
          <Box>
            <SectionTitle>{t('dashboard.recentActivity.title')}</SectionTitle>
            <SectionSubtitle>{t('dashboard.recentActivity.subtitle')}</SectionSubtitle>
          </Box>

          <Link to={ROUTES.ANALYSES} style={{ textDecoration: 'none' }}>
            <ViewAllButton>{t('dashboard.recentActivity.viewAll')}</ViewAllButton>
          </Link>
        </ChartHeaderRow>

        <RecentActivityTableWrapper>
          <RecentActivityTable rows={recentActivity} state={state} />
        </RecentActivityTableWrapper>
      </RecentActivityCard>
    </PageWrapper>
  );
};

export default Dashboard;
