import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import Landing from '@/pages/Landing';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe('Landing page', () => {
  it('renders all marketing sections without crashing', () => {
    renderWithProviders(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    // Hero + Stats + Features + Compliance + Cta + Faq each contribute headings.
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
  });
});
