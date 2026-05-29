import { resultsService } from '@/services/resultsService';
import type { JobResults } from '@/pages/DeIdentify/types';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/services/api', () => ({ api: { get } }));

const results: JobResults = {
  mainContent: { anonymizedText: '[REDACTED]' },
  entityTable: [],
  auditTrail: {
    jobId: 'job-1',
    framework: 'hipaa',
    timestamps: { started: '2024-01-01T00:00:00Z', finished: '2024-01-01T00:01:00Z' },
    processingTime: 60,
  },
  stats: { detected: 0, processed: 0, avgConfidence: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resultsService.getResults', () => {
  it('GETs /app/results/:id and returns the results', async () => {
    get.mockResolvedValue({ data: results });
    const result = await resultsService.getResults('job-1');
    expect(get).toHaveBeenCalledWith('/app/results/job-1');
    expect(result).toEqual(results);
  });
});

describe('resultsService export helpers', () => {
  const clickSpy = vi.fn();

  beforeEach(() => {
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(document.body, 'appendChild');

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = realCreateElement(tagName);
      if (tagName === 'a') {
        element.click = clickSpy;
      }
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clickSpy.mockClear();
  });

  it.each([
    ['exportJson', '/app/results/job-1/export/json', 'result-job-1.json'],
    ['exportCsv', '/app/results/job-1/export/csv', 'result-job-1.csv'],
    ['exportPdf', '/app/results/job-1/export/pdf', 'Compliance_Report_job-1.pdf'],
  ] as const)('%s GETs a blob and triggers a named download', async (method, url, filename) => {
    get.mockResolvedValue({ data: new Blob(['file-bytes']) });

    await resultsService[method]('job-1');

    expect(get).toHaveBeenCalledWith(url, { responseType: 'blob' });
    const anchor = vi.mocked(document.body.appendChild).mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.getAttribute('download')).toBe(filename);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
