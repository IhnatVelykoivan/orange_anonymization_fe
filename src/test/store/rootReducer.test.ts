import { store } from '@/store/store';

/**
 * Regression guard for the #48 build-breaker: a feature slice (`dashboard`) was
 * imported and selected via `state.dashboard` but accidentally dropped from
 * `combineReducers`, which broke `tsc -b` and crashed the Dashboard page at
 * runtime. This asserts every feature slice the app selects from is actually
 * registered in the root reducer.
 */
const EXPECTED_SLICES = ['jobs', 'auth', 'dashboard', 'analyses', 'syntheticResult'] as const;

describe('redux root reducer', () => {
  it('registers every expected feature slice', () => {
    const state = store.getState();
    expect(Object.keys(state)).toEqual(expect.arrayContaining([...EXPECTED_SLICES]));
  });

  it.each(EXPECTED_SLICES)('exposes a defined "%s" slice in state', (slice) => {
    expect(store.getState()[slice]).toBeDefined();
  });
});
