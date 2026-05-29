import { JobStatus, type IJob } from '@/pages/DeIdentify/types';
import { jobsService } from '@/services/jobsService';

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/services/api', () => ({ api: { get, post, patch } }));

const job: IJob = {
  id: 'job-1',
  status: JobStatus.DRAFT,
  userId: 'user-1',
  wizardState: null,
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('jobsService', () => {
  it('createJob POSTs /jobs and returns the job', async () => {
    post.mockResolvedValue({ data: job });
    const result = await jobsService.createJob();
    expect(post).toHaveBeenCalledWith('/jobs');
    expect(result).toEqual(job);
  });

  it('getLatestDraft GETs /jobs/latest-draft', async () => {
    get.mockResolvedValue({ data: job });
    const result = await jobsService.getLatestDraft();
    expect(get).toHaveBeenCalledWith('/jobs/latest-draft');
    expect(result).toEqual(job);
  });

  it('getLatestDraft returns null when there is no draft', async () => {
    get.mockResolvedValue({ data: null });
    await expect(jobsService.getLatestDraft()).resolves.toBeNull();
  });

  it('updateJob PATCHes /jobs/:id with the partial payload', async () => {
    const patchData = { status: JobStatus.CONFIGURED };
    patch.mockResolvedValue({ data: { ...job, ...patchData } });
    const result = await jobsService.updateJob('job-1', patchData);
    expect(patch).toHaveBeenCalledWith('/jobs/job-1', patchData);
    expect(result.status).toBe(JobStatus.CONFIGURED);
  });

  it('uploadFile POSTs multipart form-data with the file', async () => {
    const file = new File(['hello'], 'note.txt', { type: 'text/plain' });
    post.mockResolvedValue({ data: job });

    await jobsService.uploadFile('job-1', file);

    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/jobs/job-1/upload');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } });
  });

  it('runAnalysis POSTs the original text to /jobs/:id/run', async () => {
    post.mockResolvedValue({ data: job });
    await jobsService.runAnalysis('job-1', 'patient text');
    expect(post).toHaveBeenCalledWith('/jobs/job-1/run', { originalText: 'patient text' });
  });

  it('getJobById GETs /jobs/:id', async () => {
    get.mockResolvedValue({ data: job });
    const result = await jobsService.getJobById('job-1');
    expect(get).toHaveBeenCalledWith('/jobs/job-1');
    expect(result).toEqual(job);
  });

  it('toggleEntity PATCHes the entity toggle endpoint with original text', async () => {
    patch.mockResolvedValue({ data: job });
    await jobsService.toggleEntity('job-1', 'entity-9', 'patient text');
    expect(patch).toHaveBeenCalledWith('/jobs/job-1/entities/entity-9/toggle', {
      originalText: 'patient text',
    });
  });

  it('propagates errors from the api layer', async () => {
    post.mockRejectedValue(new Error('Network down'));
    await expect(jobsService.createJob()).rejects.toThrow('Network down');
  });
});
