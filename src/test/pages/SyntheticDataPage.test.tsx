import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import SyntheticData from '@/pages/SyntheticData';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('SyntheticData page', () => {
  it('renders the synthetic data generation form', () => {
    renderWithProviders(
      <MemoryRouter>
        <SyntheticData />
      </MemoryRouter>,
    );

    expect(screen.getByText('syntheticData.generationSettings')).toBeTruthy();
    expect(screen.getByText('syntheticData.numberOfRecords')).toBeTruthy();
  });
});
