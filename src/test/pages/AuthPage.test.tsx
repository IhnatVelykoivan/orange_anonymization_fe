import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import AuthForm from '@/pages/Auth';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe('Auth page', () => {
  it('renders the magic-link request form', () => {
    renderWithProviders(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>,
    );

    expect(screen.getByText('auth.title')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'auth.requestLink' })).toBeTruthy();
  });
});
