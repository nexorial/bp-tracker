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

// Custom tooltip component for dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-secondary border border-border-subtle rounded-lg p-3 shadow-lg">
        <p className="text-text-primary font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary capitalize">
              {entry.name === 'systolic' ? 'Systolic' : 
               entry.name === 'diastolic' ? 'Diastolic' : 'Heart Rate'}:
            </span>
            <span className="font-mono text-text-primary font-semibold">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function BPChart({ data }: BPChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="h-[300px] flex flex-col items-center justify-center bg-bg-tertiary/50 rounded-xl border border-border-subtle border-dashed"
        data-testid="bp-chart-empty"
      >
        <svg className="w-12 h-12 text-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-text-secondary font-medium">No data available</p>
        <p className="text-caption text-text-tertiary mt-1">Add readings to see your trends</p>
      </div>
    );
  }

  return (
    <div data-testid="bp-chart" className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#2A2A35" 
            vertical={false}
          />
          
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#A1A1AA', fontFamily: 'Inter' }}
            tickMargin={10}
            stroke="#3A3A48"
            axisLine={{ stroke: '#3A3A48' }}
          />
          
          <YAxis
            tick={{ fontSize: 12, fill: '#A1A1AA', fontFamily: 'Inter' }}
            domain={['auto', 'auto']}
            stroke="#3A3A48"
            axisLine={{ stroke: '#3A3A48' }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            formatter={(value: string) => {
              const labelMap: Record<string, string> = {
                systolic: 'Systolic',
                diastolic: 'Diastolic',
                heartRate: 'Heart Rate',
              };
              return <span className="text-text-secondary text-sm">{labelMap[value] || value}</span>;
            }}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#F43F5E"
            strokeWidth={2.5}
            dot={{ fill: '#F43F5E', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, stroke: '#F43F5E', strokeWidth: 2, fill: '#0A0A0F' }}
            name="systolic"
          />
          
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#0A0A0F' }}
            name="diastolic"
          />
          
          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10B981', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: '#0A0A0F' }}
            name="heartRate"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BPChart;
