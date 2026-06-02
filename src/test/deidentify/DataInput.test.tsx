import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import DataInput from '@/components/business/deIdentity/DataInput';
import { jobsService } from '@/services/jobsService';
import { JobStatus, type IJob } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
vi.mock('@/services/jobsService', () => ({
  jobsService: { updateJob: vi.fn(), uploadFile: vi.fn() },
}));

const baseJob: IJob = {
  id: 'job-1',
  status: JobStatus.DRAFT,
  userId: 'u1',
  wizardState: { currentStep: 1, frameworkSelection: null, inputData: null, configSettings: {} },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const jobWithFile: IJob = {
  ...baseJob,
  wizardState: {
    currentStep: 1,
    frameworkSelection: null,
    inputData: { fileName: 'report.txt', fileSize: 2 * 1024 * 1024 },
    configSettings: {},
  },
};

const longText = 'a'.repeat(60);

const switchToFileTab = () =>
  fireEvent.click(screen.getByRole('tab', { name: 'deIdentify.input.tabs.file' }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DataInput — text tab', () => {
  it('shows a min-length validation error after blurring a short value', () => {
    renderWithProviders(<DataInput currentJob={baseJob} localOriginalText="" />);

    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: 'too short' } });
    fireEvent.blur(input);

    expect(screen.getByText('deIdentify.input.validation.minLength')).toBeTruthy();
  });

  it('clears the error once a valid-length value is entered', () => {
    renderWithProviders(<DataInput currentJob={baseJob} localOriginalText="" />);

    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.blur(input);
    expect(screen.getByText('deIdentify.input.validation.minLength')).toBeTruthy();

    fireEvent.change(input, { target: { value: longText } });
    expect(screen.queryByText('deIdentify.input.validation.minLength')).toBeNull();
  });
});

describe('DataInput — file tab', () => {
  it('rejects an unsupported file type with an inline error', async () => {
    renderWithProviders(<DataInput currentJob={baseJob} localOriginalText="" />);
    switchToFileTab();

    const file = new File(['binary'], 'image.png', { type: 'image/png' });
    fireEvent.change(screen.getByTestId('file-upload-input'), { target: { files: [file] } });

    expect(await screen.findByTestId('upload-error')).toBeTruthy();
    expect(jobsService.uploadFile).not.toHaveBeenCalled();
  });

  it('uploads a supported .txt file through the service', async () => {
    vi.mocked(jobsService.uploadFile).mockResolvedValue({
      ...baseJob,
      wizardState: {
        currentStep: 1,
        frameworkSelection: null,
        inputData: { fileName: 'doc.txt', fileSize: 100 },
        configSettings: {},
      },
    });

    renderWithProviders(<DataInput currentJob={baseJob} localOriginalText="" />);
    switchToFileTab();

    const file = new File([longText], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('file-upload-input'), { target: { files: [file] } });

    await waitFor(() => expect(jobsService.uploadFile).toHaveBeenCalledWith('job-1', file));
  });

  it('removes the uploaded file via updateJob', async () => {
    vi.mocked(jobsService.updateJob).mockResolvedValue(jobWithFile);

    renderWithProviders(<DataInput currentJob={jobWithFile} localOriginalText={longText} />);
    switchToFileTab();

    const removeBtn = within(screen.getByTestId('upload-success')).getByRole('button');
    fireEvent.click(removeBtn);

    await waitFor(() => expect(jobsService.updateJob).toHaveBeenCalled());
  });

  it('opens the replace dialog when there are unsaved manual edits', async () => {
    renderWithProviders(<DataInput currentJob={jobWithFile} localOriginalText={longText} />);

    const input = screen.getByTestId('text-input');
    fireEvent.change(input, { target: { value: `${longText} edited` } });

    switchToFileTab();
    const file = new File([`${longText} new`], 'doc2.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByTestId('file-upload-input'), { target: { files: [file] } });

    expect(await screen.findByText('deIdentify.input.replaceDialog.confirm')).toBeTruthy();
  });
});
