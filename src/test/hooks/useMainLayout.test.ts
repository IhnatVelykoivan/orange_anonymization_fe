import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { theme } from '@/theme';
import { useMainLayout } from '@/components/layouts/useMainLayout';

vi.mock('@mui/material/useMediaQuery', () => ({ default: vi.fn() }));

const mockedMediaQuery = vi.mocked(useMediaQuery);

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(ThemeProvider, { theme, children });

beforeEach(() => {
  mockedMediaQuery.mockReturnValue(false);
});

describe('useMainLayout', () => {
  it('starts with the drawer closed and not mobile on wide screens', () => {
    const { result } = renderHook(() => useMainLayout(), { wrapper });
    expect(result.current.isMobile).toBe(false);
    expect(result.current.drawerOpen).toBe(false);
  });

  it('reports mobile when a media query matches', () => {
    mockedMediaQuery.mockReturnValue(true);
    const { result } = renderHook(() => useMainLayout(), { wrapper });
    expect(result.current.isMobile).toBe(true);
  });

  it('opens, closes and toggles the drawer', () => {
    const { result } = renderHook(() => useMainLayout(), { wrapper });

    act(() => result.current.handleDrawerOpen());
    expect(result.current.drawerOpen).toBe(true);

    act(() => result.current.handleDrawerClose());
    expect(result.current.drawerOpen).toBe(false);

    act(() => result.current.handleDrawerToggle());
    expect(result.current.drawerOpen).toBe(true);

    act(() => result.current.handleDrawerToggle());
    expect(result.current.drawerOpen).toBe(false);
  });
});
