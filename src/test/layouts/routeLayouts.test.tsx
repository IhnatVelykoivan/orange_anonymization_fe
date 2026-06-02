import type { ComponentType } from 'react';
import { screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import AuthLayout from '@/components/layouts/AuthLayout';
import { LandingLayout } from '@/components/layouts/LandingLayout';
import MainLayout from '@/components/layouts/MainLayout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

const renderLayout = (Layout: ComponentType) =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/app" element={<div data-testid="outlet-child">child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('route layouts render their outlet', () => {
  it('AuthLayout', () => {
    renderLayout(AuthLayout);
    expect(screen.getByTestId('outlet-child')).toBeTruthy();
  });

  it('LandingLayout', () => {
    renderLayout(LandingLayout);
    expect(screen.getByTestId('outlet-child')).toBeTruthy();
  });

  it('MainLayout', () => {
    renderLayout(MainLayout);
    expect(screen.getByTestId('outlet-child')).toBeTruthy();
  });
});
