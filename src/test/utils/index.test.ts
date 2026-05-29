import type { EntityDetection } from '@/pages/DeIdentify/types';
import { theme } from '@/theme';
import {
  truncate,
  formatScore,
  entityColor,
  extractSpan,
  formatDate,
  downloadAsFile,
  toCSV,
  getUniqueEntities,
  presidioToHipaaMap,
} from '@/utils';

const entities = theme.palette.entities as unknown as Record<string, string>;

const makeEntity = (overrides: Partial<EntityDetection> = {}): EntityDetection => ({
  id: 'e1',
  start: 0,
  end: 1,
  score: 0.9,
  entity_type: 'PERSON',
  analysis_explanation: null,
  ...overrides,
});

describe('utils/truncate', () => {
  it('returns the text unchanged when shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the text unchanged when exactly maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and appends an ellipsis when longer than maxLength', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });
});

describe('utils/formatScore', () => {
  it('formats a fractional score as a one-decimal percentage', () => {
    expect(formatScore(0.957)).toBe('95.7%');
  });

  it('formats the bounds', () => {
    expect(formatScore(0)).toBe('0.0%');
    expect(formatScore(1)).toBe('100.0%');
  });
});

describe('utils/entityColor', () => {
  it('returns the palette color for every known entity type', () => {
    for (const [key, value] of Object.entries(entities)) {
      expect(entityColor(key)).toBe(value);
    }
  });

  it('falls back to the DEFAULT palette color for unknown types', () => {
    expect(entityColor('NOT_A_REAL_ENTITY')).toBe(entities.DEFAULT);
  });
});

describe('utils/extractSpan', () => {
  it('extracts the substring between start and end', () => {
    expect(extractSpan('hello world', 0, 5)).toBe('hello');
    expect(extractSpan('hello world', 6, 11)).toBe('world');
  });
});

describe('utils/formatDate', () => {
  it('formats an ISO string with the short month / numeric day / numeric year options', () => {
    const iso = '2023-03-15T12:00:00.000Z';
    const expected = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));

    expect(formatDate(iso)).toBe(expected);
    expect(formatDate(iso)).toContain('2023');
  });
});

describe('utils/toCSV', () => {
  it('returns an empty string for no rows', () => {
    expect(toCSV([])).toBe('');
  });

  it('builds a header row plus JSON-escaped value rows', () => {
    expect(toCSV([{ name: 'Al', age: 3 }])).toBe('name,age\n"Al",3');
  });

  it('serialises nullish values as empty quoted strings', () => {
    expect(toCSV([{ a: null, b: undefined }])).toBe('a,b\n"",""');
  });

  it('keeps the header order of the first row across multiple rows', () => {
    expect(
      toCSV([
        { name: 'Al', age: 3 },
        { name: 'Bo', age: 4 },
      ]),
    ).toBe('name,age\n"Al",3\n"Bo",4');
  });
});

describe('utils/getUniqueEntities', () => {
  it('deduplicates by entity_type, keeping the last occurrence', () => {
    const firstPerson = makeEntity({ id: 'a1', entity_type: 'PERSON' });
    const email = makeEntity({ id: 'b', entity_type: 'EMAIL_ADDRESS' });
    const lastPerson = makeEntity({ id: 'a2', entity_type: 'PERSON' });

    const result = getUniqueEntities([firstPerson, email, lastPerson]);

    expect(result).toHaveLength(2);
    expect(result.map((entity) => entity.entity_type)).toEqual(['PERSON', 'EMAIL_ADDRESS']);
    expect(result[0].id).toBe('a2');
  });

  it('returns an empty array for no entities', () => {
    expect(getUniqueEntities([])).toEqual([]);
  });
});

describe('utils/presidioToHipaaMap', () => {
  it('maps Presidio entity types to HIPAA identifier categories', () => {
    expect(presidioToHipaaMap.PERSON).toBe('BENEFICIARY');
    expect(presidioToHipaaMap.EMAIL_ADDRESS).toBe('EMAIL');
    expect(presidioToHipaaMap.MEDICAL_RECORD_NUMBER).toBe('MRN');
  });
});

describe('utils/downloadAsFile', () => {
  const clickSpy = vi.fn();
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let appendSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    appendSpy = vi.spyOn(document.body, 'appendChild');
    removeSpy = vi.spyOn(document.body, 'removeChild');

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

  it('creates an object URL, clicks a download link, then cleans up', () => {
    downloadAsFile('col1,col2', 'export.csv', 'text/csv');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy.mock.calls[0][0]).toBeInstanceOf(Blob);

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('export.csv');
    expect(anchor.href).toContain('blob:mock-url');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith(anchor);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });
});
