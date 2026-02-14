import React from 'react';
import { render, screen } from '@testing-library/react';
import { BPStats, BPRecord } from '../app/components/BPStats';

describe('BPStats', () => {
  const mockRecords: BPRecord[] = [
    { id: 1, systolic: 120, diastolic: 80, heart_rate: 72, recorded_at: '2026-02-14T10:00:00Z', notes: null },
    { id: 2, systolic: 118, diastolic: 78, heart_rate: 70, recorded_at: '2026-02-13T10:00:00Z', notes: null },
    { id: 3, systolic: 122, diastolic: 82, heart_rate: 74, recorded_at: '2026-02-12T10:00:00Z', notes: null },
  ];

  describe('Empty state', () => {
    it('renders empty state when no records provided', () => {
      render(<BPStats records={[]} />);
      
      expect(screen.getByTestId('bp-stats-empty')).toBeInTheDocument();
      expect(screen.getByText(/no readings yet/i)).toBeInTheDocument();
    });
  });

  describe('Average calculations', () => {
    it('displays average systolic reading', () => {
      render(<BPStats records={mockRecords} />);
      
      const systolicStat = screen.getByTestId('stat-systolic');
      expect(systolicStat).toBeInTheDocument();
      expect(systolicStat).toHaveTextContent('120');
      expect(systolicStat).toHaveTextContent('Avg Systolic');
    });

    it('displays average diastolic reading', () => {
      render(<BPStats records={mockRecords} />);
      
      const diastolicStat = screen.getByTestId('stat-diastolic');
      expect(diastolicStat).toBeInTheDocument();
      expect(diastolicStat).toHaveTextContent('80');
      expect(diastolicStat).toHaveTextContent('Avg Diastolic');
    });

    it('displays average heart rate', () => {
      render(<BPStats records={mockRecords} />);
      
      const hrStat = screen.getByTestId('stat-heart-rate');
      expect(hrStat).toBeInTheDocument();
      expect(hrStat).toHaveTextContent('72');
      expect(hrStat).toHaveTextContent('Avg Heart Rate');
    });

    it('calculates averages correctly with different values', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 130, diastolic: 85, heart_rate: 80, recorded_at: '2026-02-14T10:00:00Z', notes: null },
        { id: 2, systolic: 110, diastolic: 75, heart_rate: 65, recorded_at: '2026-02-13T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      expect(screen.getByTestId('stat-systolic')).toHaveTextContent('120');
      expect(screen.getByTestId('stat-diastolic')).toHaveTextContent('80');
      expect(screen.getByTestId('stat-heart-rate')).toHaveTextContent('73'); // (80+65)/2 = 72.5 → 73
    });
  });

  describe('Reading count', () => {
    it('displays total number of readings', () => {
      render(<BPStats records={mockRecords} />);
      
      const count = screen.getByTestId('stat-count');
      expect(count).toBeInTheDocument();
      expect(count).toHaveTextContent('3');
    });

    it('displays correct count for single record', () => {
      render(<BPStats records={[mockRecords[0]]} />);
      
      expect(screen.getByTestId('stat-count')).toHaveTextContent('1');
    });
  });

  describe('Date range', () => {
    it('displays date range from first to last record', () => {
      render(<BPStats records={mockRecords} />);
      
      const dateRange = screen.getByTestId('stat-date-range');
      expect(dateRange).toBeInTheDocument();
      expect(dateRange).toHaveTextContent(/feb 12/i);
      expect(dateRange).toHaveTextContent(/feb 14/i);
    });

    it('handles single record date range', () => {
      render(<BPStats records={[mockRecords[0]]} />);
      
      const dateRange = screen.getByTestId('stat-date-range');
      expect(dateRange).toHaveTextContent(/feb 14.*feb 14/i);
    });
  });

  describe('Latest reading display', () => {
    it('displays latest reading', () => {
      render(<BPStats records={mockRecords} />);
      
      const latest = screen.getByTestId('latest-reading');
      expect(latest).toBeInTheDocument();
    });

    it('displays latest BP values', () => {
      render(<BPStats records={mockRecords} />);
      
      const latestBP = screen.getByTestId('latest-bp');
      expect(latestBP).toHaveTextContent('120/80');
    });

    it('displays latest heart rate when present', () => {
      render(<BPStats records={mockRecords} />);
      
      const latestHR = screen.getByTestId('latest-hr');
      expect(latestHR).toHaveTextContent('72 bpm');
    });

    it('displays latest reading date', () => {
      render(<BPStats records={mockRecords} />);
      
      const latestDate = screen.getByTestId('latest-date');
      expect(latestDate).toHaveTextContent(/feb 14/i);
    });
  });

  describe('Color-coded BP status', () => {
    it('shows normal status for normal BP', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 118, diastolic: 76, heart_rate: 70, recorded_at: '2026-02-14T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const latestBP = screen.getByTestId('latest-bp');
      expect(latestBP).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('shows elevated status for elevated BP', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 125, diastolic: 76, heart_rate: 70, recorded_at: '2026-02-14T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const latestBP = screen.getByTestId('latest-bp');
      expect(latestBP).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('shows high stage 1 status', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 135, diastolic: 85, heart_rate: 70, recorded_at: '2026-02-14T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const latestBP = screen.getByTestId('latest-bp');
      expect(latestBP).toHaveClass('bg-orange-100', 'text-orange-800');
    });

    it('shows high stage 2 status', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 145, diastolic: 95, heart_rate: 70, recorded_at: '2026-02-14T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const latestBP = screen.getByTestId('latest-bp');
      expect(latestBP).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('shows crisis status for hypertensive crisis', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 185, diastolic: 95, heart_rate: 70, recorded_at: '2026-02-14T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const latestBP = screen.getByTestId('latest-bp');
      expect(latestBP).toHaveClass('bg-red-200', 'text-red-900');
    });
  });

  describe('Trend indicator', () => {
    it('displays trend indicator', () => {
      render(<BPStats records={mockRecords} />);
      
      const trend = screen.getByTestId('trend-indicator');
      expect(trend).toBeInTheDocument();
    });

    it('shows stable trend for few records', () => {
      render(<BPStats records={mockRecords} />);
      
      const trend = screen.getByTestId('trend-indicator');
      expect(trend).toHaveTextContent(/stable/i);
    });

    it('shows improving trend when recent readings are lower', () => {
      const records: BPRecord[] = [
        // Recent readings - lower systolic
        { id: 1, systolic: 115, diastolic: 75, heart_rate: 70, recorded_at: '2026-02-18T10:00:00Z', notes: null },
        { id: 2, systolic: 118, diastolic: 76, heart_rate: 71, recorded_at: '2026-02-17T10:00:00Z', notes: null },
        { id: 3, systolic: 116, diastolic: 74, heart_rate: 69, recorded_at: '2026-02-16T10:00:00Z', notes: null },
        // Older readings - higher systolic
        { id: 4, systolic: 135, diastolic: 85, heart_rate: 75, recorded_at: '2026-02-15T10:00:00Z', notes: null },
        { id: 5, systolic: 138, diastolic: 88, heart_rate: 78, recorded_at: '2026-02-14T10:00:00Z', notes: null },
        { id: 6, systolic: 140, diastolic: 90, heart_rate: 80, recorded_at: '2026-02-13T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const trend = screen.getByTestId('trend-indicator');
      expect(trend).toHaveTextContent(/improving/i);
      expect(trend).toHaveClass('bg-green-50');
    });

    it('shows worsening trend when recent readings are higher', () => {
      const records: BPRecord[] = [
        // Recent readings - higher systolic
        { id: 1, systolic: 145, diastolic: 95, heart_rate: 80, recorded_at: '2026-02-18T10:00:00Z', notes: null },
        { id: 2, systolic: 148, diastolic: 98, heart_rate: 82, recorded_at: '2026-02-17T10:00:00Z', notes: null },
        { id: 3, systolic: 150, diastolic: 100, heart_rate: 85, recorded_at: '2026-02-16T10:00:00Z', notes: null },
        // Older readings - lower systolic
        { id: 4, systolic: 125, diastolic: 80, heart_rate: 72, recorded_at: '2026-02-15T10:00:00Z', notes: null },
        { id: 5, systolic: 122, diastolic: 78, heart_rate: 70, recorded_at: '2026-02-14T10:00:00Z', notes: null },
        { id: 6, systolic: 120, diastolic: 76, heart_rate: 68, recorded_at: '2026-02-13T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const trend = screen.getByTestId('trend-indicator');
      expect(trend).toHaveTextContent(/worsening/i);
      expect(trend).toHaveClass('bg-red-50');
    });

    it('shows stable trend when readings are relatively unchanged', () => {
      const records: BPRecord[] = [
        // Recent readings
        { id: 1, systolic: 122, diastolic: 80, heart_rate: 72, recorded_at: '2026-02-18T10:00:00Z', notes: null },
        { id: 2, systolic: 124, diastolic: 82, heart_rate: 74, recorded_at: '2026-02-17T10:00:00Z', notes: null },
        { id: 3, systolic: 123, diastolic: 81, heart_rate: 73, recorded_at: '2026-02-16T10:00:00Z', notes: null },
        // Older readings - within 5mmHg
        { id: 4, systolic: 125, diastolic: 83, heart_rate: 75, recorded_at: '2026-02-15T10:00:00Z', notes: null },
        { id: 5, systolic: 124, diastolic: 82, heart_rate: 74, recorded_at: '2026-02-14T10:00:00Z', notes: null },
        { id: 6, systolic: 126, diastolic: 84, heart_rate: 76, recorded_at: '2026-02-13T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      const trend = screen.getByTestId('trend-indicator');
      expect(trend).toHaveTextContent(/stable/i);
      expect(trend).toHaveClass('bg-gray-50');
    });
  });

  describe('Edge cases', () => {
    it('handles records with zero heart rate gracefully', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 120, diastolic: 80, heart_rate: 0, recorded_at: '2026-02-14T10:00:00Z', notes: null },
      ];
      
      render(<BPStats records={records} />);
      
      // Should still display BP and other stats
      expect(screen.getByTestId('stat-heart-rate')).toHaveTextContent('0');
      expect(screen.getByTestId('latest-bp')).toHaveTextContent('120/80');
    });

    it('handles records with notes', () => {
      const records: BPRecord[] = [
        { id: 1, systolic: 120, diastolic: 80, heart_rate: 72, recorded_at: '2026-02-14T10:00:00Z', notes: 'After workout' },
      ];
      
      render(<BPStats records={records} />);
      
      // Stats should still work with notes
      expect(screen.getByTestId('stat-count')).toHaveTextContent('1');
    });

    it('renders statistics heading', () => {
      render(<BPStats records={mockRecords} />);
      
      expect(screen.getByRole('heading', { name: /statistics/i })).toBeInTheDocument();
    });
  });
});
