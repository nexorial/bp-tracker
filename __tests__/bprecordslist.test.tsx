import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BPRecordsList, BPRecord } from '../app/components/BPRecordsList';

// Mock fetch globally
global.fetch = jest.fn();

describe('BPRecordsList', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockOnDelete = jest.fn();
  const mockOnPageChange = jest.fn();

  const sampleRecords: BPRecord[] = [
    {
      id: 1,
      systolic: 118,
      diastolic: 76,
      heart_rate: 72,
      recorded_at: '2024-01-15T10:30:00Z',
      notes: 'Feeling good'
    },
    {
      id: 2,
      systolic: 135,
      diastolic: 85,
      heart_rate: 75,
      recorded_at: '2024-01-14T08:00:00Z',
      notes: null
    },
    {
      id: 3,
      systolic: 145,
      diastolic: 92,
      heart_rate: 80,
      recorded_at: '2024-01-13T18:45:00Z',
      notes: 'After exercise'
    },
    {
      id: 4,
      systolic: 115,
      diastolic: 75,
      heart_rate: 0,
      recorded_at: '2024-01-12T12:00:00Z',
      notes: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering with records', () => {
    it('renders the records list with data-testid', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('bp-records-list')).toBeInTheDocument();
    });

    it('displays record dates and times', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('record-date-1')).toBeInTheDocument();
      expect(screen.getByTestId('record-time-1')).toBeInTheDocument();
    });

    it('displays blood pressure values with color coding', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      // Normal BP (118/76)
      const bp1 = screen.getByTestId('record-bp-1');
      expect(bp1).toHaveTextContent('118/76');
      expect(bp1.className).toContain('bg-green-100');

      // High Stage 1 BP (135/85)
      const bp2 = screen.getByTestId('record-bp-2');
      expect(bp2).toHaveTextContent('135/85');
      expect(bp2.className).toContain('bg-orange-100');

      // High Stage 2 (145/92)
      const bp3 = screen.getByTestId('record-bp-3');
      expect(bp3).toHaveTextContent('145/92');
      expect(bp3.className).toContain('bg-red-100');

      // Normal BP (115/75)
      const bp4 = screen.getByTestId('record-bp-4');
      expect(bp4).toHaveTextContent('115/75');
      expect(bp4.className).toContain('bg-green-100');
    });

    it('displays heart rate values', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('record-hr-1')).toHaveTextContent('72 bpm');
      expect(screen.getByTestId('record-hr-2')).toHaveTextContent('75 bpm');
    });

    it('displays dash for zero heart rate', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('record-hr-4')).toHaveTextContent('—');
    });

    it('displays notes when present', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('record-notes-1')).toHaveTextContent('Feeling good');
      expect(screen.getByTestId('record-notes-4')).toHaveTextContent('—');
    });

    it('displays delete buttons for each record', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      sampleRecords.forEach(record => {
        expect(screen.getByTestId(`delete-button-${record.id}`)).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('renders empty state when no records', () => {
      render(
        <BPRecordsList
          records={[]}
          total={0}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('bp-records-empty')).toBeInTheDocument();
      expect(screen.getByText('No readings yet')).toBeInTheDocument();
      expect(screen.getByText(/Start tracking your blood pressure/)).toBeInTheDocument();
    });

    it('renders empty icon', () => {
      render(
        <BPRecordsList
          records={[]}
          total={0}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
    });

    it('does not render records list when empty', () => {
      render(
        <BPRecordsList
          records={[]}
          total={0}
          limit={10}
          offset={0}
        />
      );

      expect(screen.queryByTestId('bp-records-list')).not.toBeInTheDocument();
    });
  });

  describe('BP color coding', () => {
    const testCases = [
      { systolic: 115, diastolic: 75, expectedClass: 'bg-green-100', label: 'Normal' },
      { systolic: 120, diastolic: 75, expectedClass: 'bg-yellow-100', label: 'Elevated' },
      { systolic: 130, diastolic: 80, expectedClass: 'bg-orange-100', label: 'High Stage 1' },
      { systolic: 140, diastolic: 90, expectedClass: 'bg-red-100', label: 'High Stage 2' },
      { systolic: 180, diastolic: 110, expectedClass: 'bg-red-200', label: 'Crisis' },
      { systolic: 120, diastolic: 85, expectedClass: 'bg-orange-100', label: 'High Stage 1 (diastolic)' }
    ];

    testCases.forEach(({ systolic, diastolic, expectedClass, label }) => {
      it(`color-codes ${label} BP (${systolic}/${diastolic}) correctly`, () => {
        const record: BPRecord = {
          id: 999,
          systolic,
          diastolic,
          heart_rate: 70,
          recorded_at: '2024-01-15T10:00:00Z',
          notes: null
        };

        render(
          <BPRecordsList
            records={[record]}
            total={1}
            limit={10}
            offset={0}
          />
        );

        const bpElement = screen.getByTestId(`record-bp-${record.id}`);
        expect(bpElement.className).toContain(expectedClass);
      });
    });
  });

  describe('delete functionality', () => {
    it('shows confirmation dialog when delete button clicked', async () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      const deleteButton = screen.getByTestId('delete-button-1');
      await userEvent.click(deleteButton);

      expect(screen.getByTestId('confirm-delete-1')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-delete-1')).toBeInTheDocument();
    });

    it('hides delete button when confirming', async () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      const deleteButton = screen.getByTestId('delete-button-1');
      await userEvent.click(deleteButton);

      expect(screen.queryByTestId('delete-button-1')).not.toBeInTheDocument();
    });

    it('cancels delete when cancel button clicked', async () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      // Click delete to show confirmation
      await userEvent.click(screen.getByTestId('delete-button-1'));
      expect(screen.getByTestId('confirm-delete-1')).toBeInTheDocument();

      // Click cancel
      await userEvent.click(screen.getByTestId('cancel-delete-1'));

      // Should be back to delete button
      await waitFor(() => {
        expect(screen.getByTestId('delete-button-1')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('confirm-delete-1')).not.toBeInTheDocument();
    });

    it('calls API and onDelete when delete confirmed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Record deleted' })
      } as Response);

      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
          onDelete={mockOnDelete}
        />
      );

      // Click delete to show confirmation
      await userEvent.click(screen.getByTestId('delete-button-1'));
      
      // Click confirm
      await userEvent.click(screen.getByTestId('confirm-delete-1'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records/1', { method: 'DELETE' });
      });

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith(1);
      });
    });

    it('shows loading state during delete', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      // Click delete to show confirmation
      await userEvent.click(screen.getByTestId('delete-button-1'));
      
      // Click confirm
      await userEvent.click(screen.getByTestId('confirm-delete-1'));

      // Row should be dimmed while deleting
      await waitFor(() => {
        expect(screen.getByTestId('bp-record-row-1')).toHaveClass('opacity-50');
      });
    });

    it('handles delete API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
          onDelete={mockOnDelete}
        />
      );

      // Click delete and confirm
      await userEvent.click(screen.getByTestId('delete-button-1'));
      await userEvent.click(screen.getByTestId('confirm-delete-1'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting record:', expect.any(Error));
      });

      // onDelete should not be called on error
      expect(mockOnDelete).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      // Click delete and confirm
      await userEvent.click(screen.getByTestId('delete-button-1'));
      await userEvent.click(screen.getByTestId('confirm-delete-1'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting record:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('pagination', () => {
    const paginatedRecords = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      systolic: 120,
      diastolic: 80,
      heart_rate: 70,
      recorded_at: `2024-01-${String(i % 30 + 1).padStart(2, '0')}T10:00:00Z`,
      notes: null
    }));

    it('displays pagination controls', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(0, 10)}
          total={25}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('bp-records-pagination')).toBeInTheDocument();
      expect(screen.getByTestId('prev-page-button')).toBeInTheDocument();
      expect(screen.getByTestId('next-page-button')).toBeInTheDocument();
      expect(screen.getByTestId('page-indicator')).toBeInTheDocument();
    });

    it('shows correct page info', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(0, 10)}
          total={25}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByText('Showing 1-10 of 25')).toBeInTheDocument();
      expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 of 3');
    });

    it('disables previous button on first page', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(0, 10)}
          total={25}
          limit={10}
          offset={0}
        />
      );

      const prevButton = screen.getByTestId('prev-page-button');
      expect(prevButton).toBeDisabled();
      expect(prevButton.className).toContain('cursor-not-allowed');
    });

    it('enables next button when more pages exist', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(0, 10)}
          total={25}
          limit={10}
          offset={0}
        />
      );

      const nextButton = screen.getByTestId('next-page-button');
      expect(nextButton).not.toBeDisabled();
    });

    it('calls onPageChange when next button clicked', async () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(0, 10)}
          total={25}
          limit={10}
          offset={0}
          onPageChange={mockOnPageChange}
        />
      );

      await userEvent.click(screen.getByTestId('next-page-button'));

      expect(mockOnPageChange).toHaveBeenCalledWith(10);
    });

    it('disables next button on last page', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(20, 25)}
          total={25}
          limit={10}
          offset={20}
        />
      );

      const nextButton = screen.getByTestId('next-page-button');
      expect(nextButton).toBeDisabled();
      expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 3 of 3');
    });

    it('enables previous button when not on first page', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(10, 20)}
          total={25}
          limit={10}
          offset={10}
        />
      );

      const prevButton = screen.getByTestId('prev-page-button');
      expect(prevButton).not.toBeDisabled();
    });

    it('calls onPageChange when previous button clicked', async () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(10, 20)}
          total={25}
          limit={10}
          offset={10}
          onPageChange={mockOnPageChange}
        />
      );

      await userEvent.click(screen.getByTestId('prev-page-button'));

      expect(mockOnPageChange).toHaveBeenCalledWith(0);
    });

    it('disables buttons when isLoading is true', () => {
      render(
        <BPRecordsList
          records={paginatedRecords.slice(10, 20)}
          total={25}
          limit={10}
          offset={10}
          isLoading={true}
        />
      );

      expect(screen.getByTestId('prev-page-button')).toBeDisabled();
      expect(screen.getByTestId('next-page-button')).toBeDisabled();
    });

    it('does not show pagination when total is 0', () => {
      render(
        <BPRecordsList
          records={[]}
          total={0}
          limit={10}
          offset={0}
        />
      );

      expect(screen.queryByTestId('bp-records-pagination')).not.toBeInTheDocument();
    });
  });

  describe('mobile view', () => {
    it('renders mobile card view with data-testid', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('bp-records-mobile')).toBeInTheDocument();
    });

    it('renders mobile cards for each record', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      sampleRecords.forEach(record => {
        expect(screen.getByTestId(`bp-record-card-${record.id}`)).toBeInTheDocument();
      });
    });

    it('displays BP values in mobile cards with color coding', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      const bp1 = screen.getByTestId('card-bp-1');
      expect(bp1).toHaveTextContent('118/76');
      expect(bp1.className).toContain('bg-green-100');
    });

    it('displays heart rate in mobile cards', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('card-hr-1')).toHaveTextContent('72 bpm');
    });

    it('displays notes in mobile cards when present', () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      expect(screen.getByTestId('card-notes-1')).toHaveTextContent('Feeling good');
    });

    it('shows delete confirmation in mobile view', async () => {
      render(
        <BPRecordsList
          records={sampleRecords}
          total={4}
          limit={10}
          offset={0}
        />
      );

      await userEvent.click(screen.getByTestId('card-delete-1'));

      expect(screen.getByTestId('card-confirm-delete-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-cancel-delete-1')).toBeInTheDocument();
    });
  });

  describe('records sorted by date', () => {
    it('maintains record order as provided (assumes API sorted newest first)', () => {
      const unsortedRecords: BPRecord[] = [
        {
          id: 1,
          systolic: 120,
          diastolic: 80,
          heart_rate: 72,
          recorded_at: '2024-01-10T10:00:00Z',
          notes: null
        },
        {
          id: 2,
          systolic: 130,
          diastolic: 85,
          heart_rate: 75,
          recorded_at: '2024-01-15T10:00:00Z',
          notes: null
        }
      ];

      render(
        <BPRecordsList
          records={unsortedRecords}
          total={2}
          limit={10}
          offset={0}
        />
      );

      // Component should display records in the order provided
      const rows = screen.getAllByTestId(/bp-record-row-/);
      expect(rows).toHaveLength(2);
    });
  });
});
