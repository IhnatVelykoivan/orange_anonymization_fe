import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe('Header', () => {
  it('renders the page title and the user email', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/app']}>
        <Header userEmail="jane@example.com" isMobile={false} onMenuOpen={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText('header.dashboard.title')).toBeTruthy();
    expect(screen.getByText('jane@example.com')).toBeTruthy();
  });
});

describe('Sidebar', () => {
  it('renders the primary navigation items', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/app']}>
        <Sidebar isMobile={false} drawerOpen={false} onDrawerClose={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText('nav.dashboard')).toBeTruthy();
    expect(screen.getByText('nav.deIdentify')).toBeTruthy();
    expect(screen.getByText('nav.syntheticData')).toBeTruthy();
  });
});
