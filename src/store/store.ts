import { configureStore, combineReducers } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import jobsSlice from './slices/jobsSlice';
import authSlice from './auth/auth.slice';
import dashboardSlice from './slices/dashboardSlice';
import analysesSlice from './slices/analysesSlice';
import syntheticResultSlice from './slices/syntheticResultSlice';
import { AUTH_THUNK_TYPES } from './auth/auth.constants';

const customSessionStorage = {
  getItem: (key: string) => {
    return Promise.resolve(sessionStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    sessionStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'jobs',
  storage: customSessionStorage,
  whitelist: ['localOriginalTexts'],
};

const rootReducer = combineReducers({
  jobs: persistReducer(persistConfig, jobsSlice),
  auth: authSlice,
  dashboard: dashboardSlice,
  analyses: analysesSlice,
  syntheticResult: syntheticResultSlice,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          `${AUTH_THUNK_TYPES.VERIFY_MAGIC_LINK}/fulfilled`,
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
        ],
      },
    }),
  devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
