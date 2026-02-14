import { render, screen } from '@testing-library/react'
import Home from '../app/page'

// Mock fetch globally for the dashboard
global.fetch = jest.fn();

describe('Dashboard Layout', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch response for records
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [],
        total: 0,
        limit: 10,
        offset: 0
      })
    } as Response);
  });

  it('renders the header with app title', () => {
    render(<Home />)
    expect(screen.getByTestId('app-title')).toHaveTextContent('BP Tracker')
  })

  it('renders the header with description', () => {
    render(<Home />)
    expect(screen.getByTestId('app-description')).toHaveTextContent('Track your blood pressure readings over time')
  })

  it('renders the chart section with BPChart component', () => {
    render(<Home />)
    const chartSection = screen.getByTestId('chart-section')
    expect(chartSection).toBeInTheDocument()
    expect(chartSection).toHaveTextContent('Blood Pressure Trends')
  })

  it('renders the input form section with BPInputForm component', () => {
    render(<Home />)
    const inputSection = screen.getByTestId('input-section')
    expect(inputSection).toBeInTheDocument()
    expect(inputSection).toHaveTextContent('Add Reading')
    expect(screen.getByTestId('bp-input-form')).toBeInTheDocument()
  })

  it('renders the records list section with BPRecordsList component', () => {
    render(<Home />)
    const listSection = screen.getByTestId('list-section')
    expect(listSection).toBeInTheDocument()
    expect(listSection).toHaveTextContent('Recent Readings')
    expect(screen.getByTestId('bp-records-empty')).toBeInTheDocument()
  })

  it('renders refresh button in records section', () => {
    render(<Home />)
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument()
    expect(screen.getByTestId('refresh-button')).toHaveTextContent('Refresh')
  })

  it('uses Tailwind CSS classes for styling', () => {
    render(<Home />)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen')
    expect(main).toHaveClass('bg-gray-50')
  })

  it('header has proper Tailwind styling', () => {
    render(<Home />)
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-white')
    expect(header).toHaveClass('shadow-sm')
  })

  it('sections have card-like styling with rounded corners', () => {
    render(<Home />)
    const chartSection = screen.getByTestId('chart-section')
    expect(chartSection).toHaveClass('rounded-xl')
    expect(chartSection).toHaveClass('shadow-sm')
    expect(chartSection).toHaveClass('border')
  })
})
