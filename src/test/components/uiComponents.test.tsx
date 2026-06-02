import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import Dropdown from '@/components/UI/Dropdown';
import LogoutPopup from '@/components/popups/LogoutPopup';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe('Dropdown', () => {
  const options = [
    { id: 'a', title: 'Option A' },
    { id: 'b', title: 'Option B' },
  ];

  it('opens on click and emits the chosen option id', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Dropdown options={options} value="a" onChange={onChange} />);

    fireEvent.click(screen.getByTestId('dropdown-toggle'));
    fireEvent.click(await screen.findByTestId('dropdown-option-b'));

    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('LogoutPopup', () => {
  it('fires onLogout on confirm and onClose on cancel', () => {
    const onClose = vi.fn();
    const onLogout = vi.fn();
    renderWithProviders(<LogoutPopup isVisible onClose={onClose} onLogout={onLogout} />);

    fireEvent.click(screen.getByText('nav.logoutDialog.confirm'));
    expect(onLogout).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('nav.logoutDialog.cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render its content when hidden', () => {
    const { queryByText } = renderWithProviders(
      <LogoutPopup isVisible={false} onClose={vi.fn()} onLogout={vi.fn()} />,
    );
    expect(queryByText('nav.logoutDialog.confirm')).toBeNull();
  });
});
