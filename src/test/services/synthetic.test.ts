import { syntheticService } from '@/services/synthetic/syntheticService';
import { syntheticDataService } from '@/services/syntheticDataService';
import { SyntheticOutputFormats, type GenerateSyntheticData } from '@/services/synthetic/types';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/services/api', () => ({ api: { get, post } }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('syntheticService', () => {
  it('generateSyntheticData POSTs the payload to /synthetic-data/generate', async () => {
    const payload: GenerateSyntheticData = {
      raw_text: 'source',
      dataset_type: 'clinical',
      num_records: 5,
      compliance_framework: 'HIPAA',
      output_format: SyntheticOutputFormats.CSV,
    };
    post.mockResolvedValue({ data: { dataset_id: 'ds-1', task_id: 't-1', status: 'queued' } });

    const result = await syntheticService.generateSyntheticData(payload);

    expect(post).toHaveBeenCalledWith('/synthetic-data/generate', payload);
    expect(result.dataset_id).toBe('ds-1');
  });

  it('getGeneratedData GETs /synthetic-data/generated-data/:id', async () => {
    get.mockResolvedValue({ data: { dataset_id: 'ds-1', status: 'processing' } });
    const result = await syntheticService.getGeneratedData('ds-1');
    expect(get).toHaveBeenCalledWith('/synthetic-data/generated-data/ds-1');
    expect(result.status).toBe('processing');
  });

  it('downloadSyntheticData GETs a blob from the download endpoint', async () => {
    const blob = new Blob(['data']);
    get.mockResolvedValue({ data: blob });
    const result = await syntheticService.downloadSyntheticData('ds-1');
    expect(get).toHaveBeenCalledWith('/synthetic-data/download/ds-1', { responseType: 'blob' });
    expect(result).toBe(blob);
  });
});

describe('syntheticDataService.generate', () => {
  const payload = {
    records: 10,
    framework: 'HIPAA',
    outputFormat: 'CSV',
  };

  it('POSTs JSON payload as a blob when no file is supplied', async () => {
    post.mockResolvedValue({ data: new Blob(['csv']) });

    await syntheticDataService.generate(payload);

    expect(post).toHaveBeenCalledWith('/synthetic-data/generate', payload, {
      responseType: 'blob',
    });
  });

  it('POSTs multipart form-data when a file is supplied', async () => {
    const file = new File(['raw'], 'source.txt', { type: 'text/plain' });
    post.mockResolvedValue({ data: new Blob(['csv']) });

    await syntheticDataService.generate(payload, file);

    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/synthetic-data/generate');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect((body as FormData).get('records')).toBe('10');
    expect((body as FormData).get('framework')).toBe('HIPAA');
    expect(config).toMatchObject({
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
  });
});
