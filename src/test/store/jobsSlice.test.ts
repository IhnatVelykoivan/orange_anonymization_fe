import { JobStatus, type IJob } from '@/pages/DeIdentify/types';
import reducer, {
  setJobsAC,
  setJobAC,
  removeJobsAC,
  removeJobAC,
  resetJobState,
  setLocalOriginalTextAC,
} from '@/store/slices/jobsSlice';

const makeJob = (id: string): IJob => ({
  id,
  status: JobStatus.DRAFT,
  userId: 'user-1',
  wizardState: null,
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const initialState = {
  items: [],
  currentJob: null,
  localOriginalTexts: {},
};

describe('jobsSlice', () => {
  it('returns the initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('setJobsAC replaces the items list', () => {
    const jobs = [makeJob('1'), makeJob('2')];
    const state = reducer(undefined, setJobsAC(jobs));
    expect(state.items).toEqual(jobs);
  });

  it('setJobAC sets the current job', () => {
    const job = makeJob('1');
    const state = reducer(undefined, setJobAC(job));
    expect(state.currentJob).toEqual(job);
  });

  it('removeJobsAC clears the items list', () => {
    const seeded = { ...initialState, items: [makeJob('1')] };
    const state = reducer(seeded, removeJobsAC());
    expect(state.items).toEqual([]);
  });

  it('removeJobAC clears the current job', () => {
    const seeded = { ...initialState, currentJob: makeJob('1') };
    const state = reducer(seeded, removeJobAC());
    expect(state.currentJob).toBeNull();
  });

  it('resetJobState clears items, currentJob and localOriginalTexts', () => {
    const seeded = {
      items: [makeJob('1')],
      currentJob: makeJob('1'),
      localOriginalTexts: { '1': 'secret text' },
    };
    expect(reducer(seeded, resetJobState())).toEqual(initialState);
  });

  it('setLocalOriginalTextAC stores text keyed by jobId', () => {
    const state = reducer(undefined, setLocalOriginalTextAC({ jobId: 'job-1', text: 'hello' }));
    expect(state.localOriginalTexts).toEqual({ 'job-1': 'hello' });
  });

  it('setLocalOriginalTextAC overwrites text for an existing jobId without touching others', () => {
    const seeded = { ...initialState, localOriginalTexts: { 'job-1': 'old', 'job-2': 'keep' } };
    const state = reducer(seeded, setLocalOriginalTextAC({ jobId: 'job-1', text: 'new' }));
    expect(state.localOriginalTexts).toEqual({ 'job-1': 'new', 'job-2': 'keep' });
  });
});
