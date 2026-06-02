import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '@/store/store';
import { initializeAuth, verifyMagicLink, logout, clearUser } from '@/store/auth';
import { AUTH_TOKEN_KEY, AUTH_SESSION_STARTED_AT_KEY, AUTH_SESSION_MAX_AGE_MS } from '@/constants';
import * as userApi from '@/services/user/user.api';
import * as authApi from '@/services/auth/auth.api';

vi.mock('@/services/user/user.api', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/services/auth/auth.api', () => ({ verify: vi.fn(), login: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  store.dispatch(clearUser());
});

describe('initializeAuth branches', () => {
  it('clears an expired session', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'token');
    localStorage.setItem(
      AUTH_SESSION_STARTED_AT_KEY,
      String(Date.now() - AUTH_SESSION_MAX_AGE_MS - 1000),
    );

    await store.dispatch(initializeAuth());

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.initialized).toBe(true);
  });

  it('initializes anonymously when there is no token', async () => {
    await store.dispatch(initializeAuth());

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.initialized).toBe(true);
    expect(userApi.getCurrentUser).not.toHaveBeenCalled();
  });

  it('clears the session when fetching the user fails', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'token');
    localStorage.setItem(AUTH_SESSION_STARTED_AT_KEY, Date.now().toString());
    vi.mocked(userApi.getCurrentUser).mockRejectedValue(new Error('401'));

    await store.dispatch(initializeAuth());

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });
});

describe('verifyMagicLink error branch', () => {
  it('clears storage and user when verification fails', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'stale');
    vi.mocked(authApi.verify).mockRejectedValue(new Error('invalid'));

    await store.dispatch(verifyMagicLink('bad-token'));

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.initialized).toBe(true);
  });
});

describe('logout', () => {
  it('removes the token and clears the user', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'token');
    localStorage.setItem(AUTH_SESSION_STARTED_AT_KEY, Date.now().toString());

    await store.dispatch(logout());

    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STARTED_AT_KEY)).toBeNull();
    expect(store.getState().auth.user).toBeNull();
  });
});
