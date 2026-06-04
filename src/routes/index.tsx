import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '@/constants';
import Auth from '@/pages/Auth';
import { ProtectedRoute, PublicRoute } from '@/routes/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import MainLayout from '@/components/layouts/MainLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { LandingLayout } from '@/components/layouts/LandingLayout';
import Contact from '@/pages/Contact';
import Landing from '@/pages/Landing';
import TokenPage from '@/pages/TokenPage';
import NotFound from '@/pages/NotFound';
import Inactivity from '@/pages/Inactivity';
import { PageLoader } from '@/components/common/PageLoader';
import SyntheticResults from '@/pages/SyntheticResults';
import { ScrollToTop } from '@/components/common/ScrollToTop';

const DeIdentify = lazy(() => import('@/pages/DeIdentify'));
const SyntheticData = lazy(() => import('@/pages/SyntheticData'));
const AnalysesPage = lazy(() => import('@/pages/Analyses'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />

      <Routes>
        <Route element={<LandingLayout />}>
          <Route path={ROUTES.CONTACT} element={<Contact />} />
          <Route path={ROUTES.LANDING} element={<Landing />} />
        </Route>

        <Route path={ROUTES.TOKEN} element={<TokenPage />} />
        <Route path={ROUTES.SESSION_EXPIRED} element={<Inactivity />} />

        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.AUTH} element={<Auth />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.ANALYSES} element={<AnalysesPage />} />
            <Route path={ROUTES.DE_IDENTIFY} element={<DeIdentify />} />
            <Route path={ROUTES.SYNTHETIC_DATA} element={<SyntheticData />} />
            <Route path={ROUTES.SYNTHETIC_RESULTS} element={<SyntheticResults />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
