'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface BPChartDataPoint {
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
}

interface BPChartProps {
  data: BPChartDataPoint[];
}

export function BPChart({ data }: BPChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
        data-testid="bp-chart-empty"
      >
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div data-testid="bp-chart" className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickMargin={10}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
            stroke="#6b7280"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
            formatter={(value: number, name: string) => {
              const labelMap: Record<string, string> = {
                systolic: 'Systolic',
                diastolic: 'Diastolic',
                heartRate: 'Heart Rate',
              };
              return [value, labelMap[name] || name];
            }}
          />
          <Legend
            formatter={(value: string) => {
              const labelMap: Record<string, string> = {
                systolic: 'Systolic',
                diastolic: 'Diastolic',
                heartRate: 'Heart Rate',
              };
              return labelMap[value] || value;
            }}
          />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="systolic"
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="diastolic"
          />
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="heartRate"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
