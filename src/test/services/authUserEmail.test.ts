import { login, verify } from '@/services/auth/auth.api';
import { getCurrentUser } from '@/services/user/user.api';
import { emailService } from '@/services/emailService';
import { API_ROUTES } from '@/constants/api-routes';
import type { ContactFormData } from '@/pages/Contact/types';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/services/api', () => ({ api: { get, post } }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('auth.api', () => {
  it('login POSTs the email to the login route', async () => {
    post.mockResolvedValue({ data: { message: 'sent' } });
    const result = await login('jane@example.com');
    expect(post).toHaveBeenCalledWith(API_ROUTES.AUTH_LOGIN, { email: 'jane@example.com' });
    expect(result.message).toBe('sent');
  });

  it('verify GETs the verify route with the token as a query param', async () => {
    post.mockClear();
    get.mockResolvedValue({ data: { accessToken: 'jwt-123' } });
    const result = await verify('magic-token');
    expect(get).toHaveBeenCalledWith(API_ROUTES.AUTH_VERIFY, { params: { token: 'magic-token' } });
    expect(result.accessToken).toBe('jwt-123');
  });
});

describe('user.api.getCurrentUser', () => {
  it('GETs /users/me and returns the user', async () => {
    const user = { id: 'u1', email: 'jane@example.com' };
    get.mockResolvedValue({ data: user });
    const result = await getCurrentUser();
    expect(get).toHaveBeenCalledWith(API_ROUTES.USERS_ME);
    expect(result).toEqual(user);
  });
});

describe('emailService.sendContactUsEmail', () => {
  it('POSTs the contact form payload to /email/contact', async () => {
    post.mockResolvedValue({ data: {} });
    const form: ContactFormData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      message: 'Hello there',
    };

    await emailService.sendContactUsEmail(form);

    expect(post).toHaveBeenCalledWith('/email/contact', form);
  });
});
