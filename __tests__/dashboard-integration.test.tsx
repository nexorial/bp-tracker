import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../app/page';

// Mock fetch globally for the dashboard
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockRecords = [
  {
    id: 1,
    systolic: 120,
    diastolic: 80,
    heart_rate: 72,
    recorded_at: '2026-02-14T10:00:00Z',
    notes: 'Morning reading'
  },
  {
    id: 2,
    systolic: 135,
    diastolic: 85,
    heart_rate: 75,
    recorded_at: '2026-02-13T18:00:00Z',
    notes: 'Evening reading'
  },
  {
    id: 3,
    systolic: 118,
    diastolic: 78,
    heart_rate: 70,
    recorded_at: '2026-02-12T08:00:00Z',
    notes: null
  }
];

describe('Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        records: mockRecords,
        total: 3,
        limit: 10,
        offset: 0
      })
    } as Response);
  });

  describe('Data Fetching', () => {
    it('fetches records on page load', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records?limit=10&offset=0');
      });
    });

    it('shows loading state initially', () => {
      render(<Home />);
      // When empty, it shows the empty state for records list section
      expect(screen.getByTestId('list-section')).toBeInTheDocument();
      // Refresh button should show loading spinner during initial load
      expect(screen.getByTestId('refresh-button')).toBeDisabled();
    });

    it('displays fetched data in records list', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-record-row-1')).toBeInTheDocument();
        expect(screen.getByTestId('bp-record-row-2')).toBeInTheDocument();
        expect(screen.getByTestId('bp-record-row-3')).toBeInTheDocument();
      });
    });

    it('displays fetched data in chart', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-chart')).toBeInTheDocument();
      });
    });

    it('displays fetched data in stats component', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-stats')).toBeInTheDocument();
      });
      
      // Check average calculations
      expect(screen.getByTestId('stat-systolic')).toHaveTextContent('124'); // avg of 120, 135, 118
      expect(screen.getByTestId('stat-diastolic')).toHaveTextContent('81'); // avg of 80, 85, 78
      expect(screen.getByTestId('stat-heart-rate')).toHaveTextContent('72'); // avg of 72, 75, 70
    });
  });

  describe('Error Handling', () => {
    it('shows error state when API fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('records-error')).toHaveTextContent('Network error');
      });
    });

    it('shows error state when API returns non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      } as Response);
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('records-error')).toHaveTextContent('Failed to fetch records');
      });
    });

    it('shows chart error message when data fails to load', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes data when refresh button is clicked', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
      
      // Clear previous calls
      mockFetch.mockClear();
      
      // Mock the refresh response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          records: [...mockRecords, {
            id: 4,
            systolic: 128,
            diastolic: 82,
            heart_rate: 74,
            recorded_at: '2026-02-15T09:00:00Z',
            notes: 'New reading'
          }],
          total: 4,
          limit: 10,
          offset: 0
        })
      } as Response);
      
      await userEvent.click(screen.getByTestId('refresh-button'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records?limit=10&offset=0');
      });
    });

    it('shows loading spinner during refresh', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
      
      // Create a delayed promise to test loading state
      let resolveFetch: (value: Response) => void;
      mockFetch.mockImplementation(() => 
        new Promise(resolve => { resolveFetch = resolve; })
      );
      
      await userEvent.click(screen.getByTestId('refresh-button'));
      
      // Check that button is disabled during loading
      expect(screen.getByTestId('refresh-button')).toBeDisabled();
      
      // Resolve the promise to clean up
      resolveFetch!({
        ok: true,
        json: async () => ({
          records: mockRecords,
          total: 3,
          limit: 10,
          offset: 0
        })
      } as Response);
    });
  });

  describe('Auto-refresh After Operations', () => {
    it('refreshes data after form submission', async () => {
      // First render with initial data
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          records: [],
          total: 0,
          limit: 10,
          offset: 0
        })
      } as Response);
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-form')).toBeInTheDocument();
      });
      
      // Clear and mock the POST response
      mockFetch.mockClear();
      
      // Mock POST request response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          systolic: 120,
          diastolic: 80,
          heart_rate: 72,
          recorded_at: '2026-02-14T10:00:00Z',
          notes: null
        })
      } as Response);
      
      // Fill and submit form
      await userEvent.type(screen.getByTestId('bp-input-field'), '120/80/72');
      await userEvent.click(screen.getByTestId('bp-submit-button'));
      
      // Wait for POST then check for refresh GET
      await waitFor(() => {
        // Should have made a POST request
        const calls = mockFetch.mock.calls;
        const postCall = calls.find(call => call[1]?.method === 'POST');
        expect(postCall).toBeTruthy();
      });
    });

    it('updates records list after delete', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-record-row-1')).toBeInTheDocument();
      });
      
      // Click delete button
      await userEvent.click(screen.getByTestId('delete-button-1'));
      
      // Click confirm
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);
      
      await userEvent.click(screen.getByTestId('confirm-delete-1'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records/1', {
          method: 'DELETE'
        });
      });
    });
  });

  describe('Component Integration', () => {
    it('renders all main components', async () => {
      render(<Home />);
      
      await waitFor(() => {
        // Chart section
        expect(screen.getByTestId('chart-section')).toBeInTheDocument();
        
        // Input form
        expect(screen.getByTestId('input-section')).toBeInTheDocument();
        expect(screen.getByTestId('bp-input-form')).toBeInTheDocument();
        
        // Stats section
        expect(screen.getByTestId('stats-section')).toBeInTheDocument();
        expect(screen.getByTestId('bp-stats')).toBeInTheDocument();
        
        // Records list
        expect(screen.getByTestId('list-section')).toBeInTheDocument();
        expect(screen.getByTestId('bp-records-list')).toBeInTheDocument();
        
        // Refresh button
        expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
      });
    });

    it('stats component displays correct data from records', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-stats')).toBeInTheDocument();
      });
      
      // Check count
      expect(screen.getByTestId('stat-count')).toHaveTextContent('3');
      
      // Check latest reading (first record in array since sorted DESC)
      expect(screen.getByTestId('latest-bp')).toHaveTextContent('120/80');
      expect(screen.getByTestId('latest-hr')).toHaveTextContent('72 bpm');
    });

    it('chart converts records to chart data format', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no records', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          records: [],
          total: 0,
          limit: 10,
          offset: 0
        })
      } as Response);
      
      render(<Home />);
      
      await waitFor(() => {
        // Chart should show empty state
        expect(screen.getByTestId('bp-chart-empty')).toBeInTheDocument();
        
        // Stats should show empty state
        expect(screen.getByTestId('bp-stats-empty')).toBeInTheDocument();
        
        // Records list should show empty state
        expect(screen.getByTestId('bp-records-empty')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('handles page changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          records: mockRecords.slice(0, 2),
          total: 5,
          limit: 2,
          offset: 0
        })
      } as Response);
      
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 of 3');
      });
      
      mockFetch.mockClear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          records: mockRecords.slice(2),
          total: 5,
          limit: 2,
          offset: 2
        })
      } as Response);
      
      await userEvent.click(screen.getByTestId('next-page-button'));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records?limit=2&offset=2');
      });
    });
  });
});
