import React from 'react';
import { render, screen } from '@testing-library/react';
import { BPChart, BPChartDataPoint } from '../app/components/BPChart';

// Mock recharts to avoid SVG rendering issues in jsdom
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ name, stroke }: { name: string; stroke: string }) => (
    <div data-testid={`line-${name}`} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('BPChart', () => {
  const mockData: BPChartDataPoint[] = [
    { date: '2024-01-01', systolic: 120, diastolic: 80, heartRate: 72 },
    { date: '2024-01-02', systolic: 125, diastolic: 82, heartRate: 75 },
    { date: '2024-01-03', systolic: 118, diastolic: 78, heartRate: 70 },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the chart with data', () => {
      render(<BPChart data={mockData} />);
      
      expect(screen.getByTestId('bp-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders three line series', () => {
      render(<BPChart data={mockData} />);
      
      expect(screen.getByTestId('line-systolic')).toBeInTheDocument();
      expect(screen.getByTestId('line-diastolic')).toBeInTheDocument();
      expect(screen.getByTestId('line-heartRate')).toBeInTheDocument();
    });

    it('renders X and Y axes', () => {
      render(<BPChart data={mockData} />);
      
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('renders cartesian grid', () => {
      render(<BPChart data={mockData} />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('renders tooltip', () => {
      render(<BPChart data={mockData} />);
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('renders legend', () => {
      render(<BPChart data={mockData} />);
      
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  describe('line colors', () => {
    it('renders systolic line in red color', () => {
      render(<BPChart data={mockData} />);
      
      const systolicLine = screen.getByTestId('line-systolic');
      expect(systolicLine).toHaveAttribute('data-stroke', '#dc2626');
    });

    it('renders diastolic line in blue color', () => {
      render(<BPChart data={mockData} />);
      
      const diastolicLine = screen.getByTestId('line-diastolic');
      expect(diastolicLine).toHaveAttribute('data-stroke', '#2563eb');
    });

    it('renders heart rate line in green color', () => {
      render(<BPChart data={mockData} />);
      
      const heartRateLine = screen.getByTestId('line-heartRate');
      expect(heartRateLine).toHaveAttribute('data-stroke', '#16a34a');
    });
  });

  describe('empty state', () => {
    it('renders empty state message when no data is provided', () => {
      render(<BPChart data={[]} />);
      
      expect(screen.getByTestId('bp-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('does not render chart when data is empty', () => {
      render(<BPChart data={[]} />);
      
      expect(screen.queryByTestId('bp-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('data variations', () => {
    it('renders with single data point', () => {
      const singleData: BPChartDataPoint[] = [
        { date: '2024-01-01', systolic: 120, diastolic: 80, heartRate: 72 },
      ];
      render(<BPChart data={singleData} />);
      
      expect(screen.getByTestId('bp-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-systolic')).toBeInTheDocument();
    });

    it('renders with many data points', () => {
      const manyData: BPChartDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        systolic: 120 + Math.floor(Math.random() * 10),
        diastolic: 80 + Math.floor(Math.random() * 5),
        heartRate: 70 + Math.floor(Math.random() * 10),
      }));
      render(<BPChart data={manyData} />);
      
      expect(screen.getByTestId('bp-chart')).toBeInTheDocument();
    });
  });
});
