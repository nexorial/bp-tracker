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
  Area,
  AreaChart,
  ComposedChart,
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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-elevated border border-slate-100">
        <p className="text-sm font-semibold text-slate-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            const labelMap: Record<string, string> = {
              systolic: 'Systolic',
              diastolic: 'Diastolic',
              heartRate: 'Heart Rate',
            };
            const unit = entry.name === 'heartRate' ? 'bpm' : 'mmHg';
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-slate-600">{labelMap[entry.name] || entry.name}:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {entry.value} {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

export function BPChart({ data }: BPChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="h-72 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200"
        data-testid="bp-chart-empty"
      >
        <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-slate-500">No data available</p>
        <p className="text-sm text-slate-400 mt-1">Add readings to see your trends</p>
      </div>
    );
  }

  return (
    <div data-testid="bp-chart" className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e2e8f0" 
            vertical={false}
          />
          
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickMargin={10}
            stroke="#cbd5e1"
            axisLine={{ stroke: '#e2e8f0' }}
          />
          
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            domain={['auto', 'auto']}
            stroke="#cbd5e1"
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend
            verticalAlign="top"
            height={30}
            iconType="circle"
            formatter={(value: string) => {
              const labelMap: Record<string, string> = {
                systolic: 'Systolic',
                diastolic: 'Diastolic',
                heartRate: 'Heart Rate',
              };
              return <span className="text-sm text-slate-600">{labelMap[value] || value}</span>;
            }}
          />

          <Area
            type="monotone"
            dataKey="systolic"
            stroke="#ef4444"
            strokeWidth={2.5}
            fill="url(#systolicGradient)"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3, stroke: '#fff' }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            name="systolic"
          />

          <Area
            type="monotone"
            dataKey="diastolic"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#diastolicGradient)"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3, stroke: '#fff' }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            name="diastolic"
          />

          <Line
            type="monotone"
            dataKey="heartRate"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3, stroke: '#fff' }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            name="heartRate"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
