import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/pages/Auth/useAuthForm';
import { login } from '@/services/auth/auth.api';

vi.mock('@/services/auth/auth.api', () => ({ login: vi.fn() }));

const mockedLogin = vi.mocked(login);

beforeEach(() => {
  vi.clearAllMocks();
});

// react-hook-form's `formState` is a lazily-subscribed proxy: reading
// `errors` inside the render callback registers the subscription so later
// setError() updates are reflected in `result.current`.
const renderAuthForm = () =>
  renderHook(() => {
    const form = useAuthForm();
    void form.formState.errors;
    return form;
  });

describe('useAuthForm.onSubmit', () => {
  it('calls login and returns true on success', async () => {
    mockedLogin.mockResolvedValue({ message: 'sent' });
    const { result } = renderAuthForm();

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.onSubmit({ email: 'jane@example.com' });
    });

    expect(mockedLogin).toHaveBeenCalledWith('jane@example.com');
    expect(success).toBe(true);
    expect(result.current.formState.errors.email).toBeUndefined();
  });

  it('returns false and sets a manual email error on failure', async () => {
    mockedLogin.mockRejectedValue(new Error('Email service unavailable'));
    const { result } = renderAuthForm();

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.onSubmit({ email: 'jane@example.com' });
    });

    expect(success).toBe(false);
    expect(result.current.formState.errors.email?.message).toBe('Email service unavailable');
  });
});
