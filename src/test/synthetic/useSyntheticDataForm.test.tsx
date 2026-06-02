import type { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '@/store/store';
import { setLocalOriginalTextAC } from '@/store/slices/jobsSlice';
import { useSyntheticDataForm } from '@/components/business/syntheticData/useSyntheticDataForm';
import { syntheticService } from '@/services/synthetic/syntheticService';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/synthetic/syntheticService', () => ({
  syntheticService: { generateSyntheticData: vi.fn() },
}));

const JOB_ID = 'job-x';

const wrapper = ({ children }: { children: ReactNode }) => (
  <Provider store={store}>
    <MemoryRouter>{children}</MemoryRouter>
  </Provider>
);

beforeEach(() => {
  vi.clearAllMocks();
  store.dispatch(setLocalOriginalTextAC({ jobId: JOB_ID, text: 'line one\nline two\nline three' }));
});

describe('useSyntheticDataForm', () => {
  it('builds a preview from the source text and is valid', async () => {
    const { result } = renderHook(() => useSyntheticDataForm(JOB_ID), { wrapper });

    await waitFor(() => expect(result.current.isValid).toBe(true));
    expect(result.current.deidentifiedPreview).toBe('line one\nline two');
  });

  it('is invalid without a source job', async () => {
    const { result } = renderHook(() => useSyntheticDataForm(undefined), { wrapper });

    await waitFor(() => expect(result.current.previewLoading).toBe(false));
    expect(result.current.isValid).toBe(false);
    expect(result.current.deidentifiedPreview).toBeNull();
  });

  it('is invalid when records fall outside the allowed range', async () => {
    const { result } = renderHook(() => useSyntheticDataForm(JOB_ID), { wrapper });
    await waitFor(() => expect(result.current.isValid).toBe(true));

    act(() => result.current.setRecords(0));
    await waitFor(() => expect(result.current.isValid).toBe(false));

    act(() => result.current.setRecords(999999999));
    await waitFor(() => expect(result.current.isValid).toBe(false));
  });

  it('submits and reports success', async () => {
    vi.mocked(syntheticService.generateSyntheticData).mockResolvedValue({
      dataset_id: 'ds-9',
    } as never);
    const { result } = renderHook(() => useSyntheticDataForm(JOB_ID), { wrapper });
    await waitFor(() => expect(result.current.isValid).toBe(true));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(syntheticService.generateSyntheticData).toHaveBeenCalled();
    expect(result.current.success).toBe('syntheticData.generatedSuccess');
  });

  it('surfaces a submission error', async () => {
    vi.mocked(syntheticService.generateSyntheticData).mockRejectedValue(new Error('rate limit'));
    const { result } = renderHook(() => useSyntheticDataForm(JOB_ID), { wrapper });
    await waitFor(() => expect(result.current.isValid).toBe(true));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe('rate limit');
  });

  it('updates framework and output format setters', async () => {
    const { result } = renderHook(() => useSyntheticDataForm(JOB_ID), { wrapper });
    await waitFor(() => expect(result.current.isValid).toBe(true));

    act(() => {
      result.current.setFramework('eu-gdpr');
      result.current.setOutputFormat('JSON');
    });

    expect(result.current.framework).toBe('eu-gdpr');
    expect(result.current.outputFormat).toBe('JSON');
  });
});
