import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { DateRangeFilter } from '@/pages/Analyses/components/DateRangeFilter';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const noop = () => {};

describe('DateRangeFilter label', () => {
  it('shows the default label with no range', () => {
    renderWithProviders(
      <DateRangeFilter dateRange={{ start: null, end: null }} setDateRange={noop} />,
    );
    expect(screen.getByText('dashboard.analyses.filters.date')).toBeTruthy();
  });

  it('shows a "from" label with only a start date', () => {
    renderWithProviders(
      <DateRangeFilter
        dateRange={{ start: new Date('2024-01-01'), end: null }}
        setDateRange={noop}
      />,
    );
    expect(screen.getByText(/dashboard\.analyses\.filters\.from/)).toBeTruthy();
  });

  it('shows a "to" label with only an end date', () => {
    renderWithProviders(
      <DateRangeFilter
        dateRange={{ start: null, end: new Date('2024-02-01') }}
        setDateRange={noop}
      />,
    );
    expect(screen.getByText(/dashboard\.analyses\.filters\.to/)).toBeTruthy();
  });

  it('shows a combined range label with both dates', () => {
    renderWithProviders(
      <DateRangeFilter
        dateRange={{ start: new Date('2024-01-01'), end: new Date('2024-02-01') }}
        setDateRange={noop}
      />,
    );
    expect(screen.getByText(/ - /)).toBeTruthy();
  });
});

describe('DateRangeFilter interactions', () => {
  it('opens the calendar popover and renders the month caption', () => {
    renderWithProviders(
      <DateRangeFilter dateRange={{ start: null, end: null }} setDateRange={noop} />,
    );

    fireEvent.click(screen.getByText('dashboard.analyses.filters.date'));

    expect(screen.getByText('dashboard.analyses.filters.selectDateRange')).toBeTruthy();
    expect(screen.getAllByTestId('KeyboardArrowRightIcon').length).toBeGreaterThan(0);
  });

  it('navigates months/years via the caption arrows', () => {
    renderWithProviders(
      <DateRangeFilter dateRange={{ start: null, end: null }} setDateRange={noop} />,
    );
    fireEvent.click(screen.getByText('dashboard.analyses.filters.date'));

    fireEvent.click(screen.getAllByTestId('KeyboardArrowRightIcon')[0]);
    fireEvent.click(screen.getAllByTestId('KeyboardArrowLeftIcon')[0]);

    expect(screen.getByText('dashboard.analyses.filters.apply')).toBeTruthy();
  });

  it('selects days and applies the range', () => {
    const setDateRange = vi.fn();
    renderWithProviders(
      <DateRangeFilter dateRange={{ start: null, end: null }} setDateRange={setDateRange} />,
    );
    fireEvent.click(screen.getByText('dashboard.analyses.filters.date'));

    const grids = screen.getAllByRole('grid');
    const startDay = within(grids[0])
      .getAllByRole('button')
      .find((b) => b.textContent === '15');
    const endDay = within(grids[1])
      .getAllByRole('button')
      .find((b) => b.textContent === '20');

    if (startDay) fireEvent.click(startDay);
    if (endDay) fireEvent.click(endDay);

    fireEvent.click(screen.getByText('dashboard.analyses.filters.apply'));

    expect(setDateRange).toHaveBeenCalled();
  });

  it('cancels without applying', () => {
    const setDateRange = vi.fn();
    renderWithProviders(
      <DateRangeFilter dateRange={{ start: null, end: null }} setDateRange={setDateRange} />,
    );
    fireEvent.click(screen.getByText('dashboard.analyses.filters.date'));
    fireEvent.click(screen.getByText('dashboard.analyses.filters.cancel'));

    expect(setDateRange).not.toHaveBeenCalled();
  });
});
