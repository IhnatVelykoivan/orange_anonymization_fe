import type { SyntheticDataSummary } from '@/services/synthetic/types';
import reducer, { setDataAC } from '@/store/slices/syntheticResultSlice';

const makeSummary = (): SyntheticDataSummary => ({
  dataset_id: 'ds-1',
  status: 'completed',
  compliance: {
    framework: 'HIPAA',
    risk_level: 'low',
    direct_identifiers_detected: '0',
  },
  data_quality: {
    quality: 'high',
    consistency: 'high',
    warnings: [],
  },
  export_summary: {
    format: 'CSV',
    records_count: 10,
    fields_count: 4,
  },
  compliance_validation_checks: {
    dates_transformed: true,
    free_text_fields_checked: true,
    export_format_validated: true,
    synthetic_identifiers_generated: true,
    direct_identifiers_removed: true,
  },
  available_fields: {
    default_selected: ['name'],
    additional_fields: ['email'],
  },
  preview_records: [{ name: 'Synthetic Person' }],
});

describe('syntheticResultSlice', () => {
  it('starts with null data', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ data: null });
  });

  it('setDataAC stores the synthetic data summary', () => {
    const summary = makeSummary();
    const state = reducer(undefined, setDataAC(summary));
    expect(state.data).toEqual(summary);
  });

  it('setDataAC replaces previously stored data', () => {
    const first = makeSummary();
    const second = { ...makeSummary(), dataset_id: 'ds-2' };
    const state = reducer({ data: first }, setDataAC(second));
    expect(state.data?.dataset_id).toBe('ds-2');
  });
});
