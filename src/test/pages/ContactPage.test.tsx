import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import Contact from '@/pages/Contact';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe('Contact page', () => {
  it('renders the contact header and the contact form', () => {
    renderWithProviders(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>,
    );

    expect(screen.getByText('landing.contact.title')).toBeTruthy();
    expect(screen.getByText('landing.contact.form.title')).toBeTruthy();
  });
});
