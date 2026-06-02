import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import Compliance from '@/components/business/deIdentity/Compliance';
import Configuration from '@/components/business/deIdentity/Configuration';
import HIPAAConfiguration from '@/components/business/deIdentity/HIPAAConfiguration';
import DataInput from '@/components/business/deIdentity/DataInput';
import IdentifiersAccordion from '@/components/business/deIdentity/IdentifiersAccordion';
import { JobStatus, type IJob } from '@/pages/DeIdentify/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));
vi.mock('@/services/jobsService', () => ({
  jobsService: { updateJob: vi.fn(), uploadFile: vi.fn() },
}));

const job: IJob = {
  id: 'job-1',
  status: JobStatus.DRAFT,
  userId: 'u1',
  wizardState: { currentStep: 1, frameworkSelection: null, inputData: null, configSettings: {} },
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('De-Identify wizard step components', () => {
  it('Compliance renders the framework choices', () => {
    renderWithProviders(<Compliance />);
    expect(screen.getByTestId('framework-hipaa')).toBeTruthy();
  });

  it('Configuration renders its step container', () => {
    renderWithProviders(<Configuration />);
    expect(screen.getByTestId('step-configuration')).toBeTruthy();
  });

  it('HIPAAConfiguration renders the method options', () => {
    renderWithProviders(<HIPAAConfiguration />);
    expect(screen.getByTestId('method-safe-harbor')).toBeTruthy();
  });

  it('DataInput renders the text input tab', () => {
    renderWithProviders(<DataInput currentJob={job} localOriginalText="" />);
    expect(screen.getByTestId('text-tab')).toBeTruthy();
  });

  it('IdentifiersAccordion renders the accordion', () => {
    renderWithProviders(<IdentifiersAccordion isExpertMode updateJob={vi.fn()} currentJob={job} />);
    expect(screen.getByTestId('identifiers-accordion')).toBeTruthy();
  });
});
