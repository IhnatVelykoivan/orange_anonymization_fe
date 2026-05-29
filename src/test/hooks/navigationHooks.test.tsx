import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { setJobAC, resetJobState } from '@/store/slices/jobsSlice';
import { JobStatus, type IJob } from '@/pages/DeIdentify/types';
import { ROUTES } from '@/constants';
import { useLanding } from '@/pages/Landing/useLanding';
import { useSidebar } from '@/components/layouts/Sidebar/useSidebar';
import { useHeader } from '@/components/layouts/Header/useHeader';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const wrapperAt =
  (path: string) =>
  ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </Provider>
  );

const makeJob = (id: string): IJob => ({
  id,
  status: JobStatus.DRAFT,
  userId: 'user-1',
  wizardState: null,
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

beforeEach(() => {
  navigateMock.mockClear();
  store.dispatch(resetJobState());
});

describe('useLanding', () => {
  it('handleGetStarted navigates to the login route', () => {
    const { result } = renderHook(() => useLanding(), { wrapper: wrapperAt('/') });
    act(() => result.current.handleGetStarted());
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.LOGIN);
  });
});

describe('useHeader', () => {
  it('returns page meta for a known route plus the user email', () => {
    const { result } = renderHook(() => useHeader('me@example.com'), {
      wrapper: wrapperAt(ROUTES.DE_IDENTIFY),
    });
    expect(result.current.title).toBe('header.deIdentify.title');
    expect(result.current.subtitle).toBe('header.deIdentify.subtitle');
    expect(result.current.userEmail).toBe('me@example.com');
  });

  it('falls back to the dashboard meta for an unknown route', () => {
    const { result } = renderHook(() => useHeader('me@example.com'), {
      wrapper: wrapperAt('/app/something-unknown'),
    });
    expect(result.current.title).toBe('header.dashboard.title');
  });
});

describe('useSidebar', () => {
  it('isActive matches the current location only', () => {
    const { result } = renderHook(() => useSidebar(), { wrapper: wrapperAt(ROUTES.DASHBOARD) });
    expect(result.current.isActive(ROUTES.DASHBOARD)).toBe(true);
    expect(result.current.isActive(ROUTES.DE_IDENTIFY)).toBe(false);
  });

  it('handleNavigate routes plainly when there is no current job', () => {
    const onNavigate = vi.fn();
    const { result } = renderHook(() => useSidebar(onNavigate), {
      wrapper: wrapperAt(ROUTES.DASHBOARD),
    });
    act(() => result.current.handleNavigate(ROUTES.DE_IDENTIFY));
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.DE_IDENTIFY);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('handleNavigate carries the current job id into synthetic-data deep link', () => {
    store.dispatch(setJobAC(makeJob('job 7')));
    const { result } = renderHook(() => useSidebar(), { wrapper: wrapperAt(ROUTES.DASHBOARD) });
    act(() => result.current.handleNavigate(ROUTES.SYNTHETIC_DATA));
    expect(navigateMock).toHaveBeenCalledWith(`${ROUTES.SYNTHETIC_DATA}?jobId=job%207#settings`);
  });

  it('handleSignOut dispatches logout and navigates to login', () => {
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    const { result } = renderHook(() => useSidebar(), { wrapper: wrapperAt(ROUTES.DASHBOARD) });
    act(() => result.current.handleSignOut());
    expect(dispatchSpy).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.LOGIN);
    dispatchSpy.mockRestore();
  });
});
