'use client';

import React, { useMemo } from 'react';

export interface BPRecord {
  id: number;
  systolic: number;
  diastolic: number;
  heart_rate: number;
  recorded_at: string;
  notes: string | null;
}

export interface BPStatsProps {
  records: BPRecord[];
}

type BPCategory = 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis';

function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'high2';
  if (systolic >= 130 || diastolic >= 80) return 'high1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  return 'normal';
}

function getCategoryConfig(category: BPCategory) {
  switch (category) {
    case 'normal':
      return { 
        badge: 'badge-normal',
        gradient: 'gradient-success',
        icon: '🟢'
      };
    case 'elevated':
      return { 
        badge: 'badge-elevated',
        gradient: 'gradient-warning',
        icon: '🟡'
      };
    case 'high1':
      return { 
        badge: 'badge-high-1',
        gradient: 'bg-orange-500',
        icon: '🟠'
      };
    case 'high2':
      return { 
        badge: 'badge-high-2',
        gradient: 'gradient-danger',
        icon: '🔴'
      };
    case 'crisis':
      return { 
        badge: 'badge-crisis',
        gradient: 'gradient-crisis',
        icon: '🚨'
      };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export function BPStats({ records }: BPStatsProps) {
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        avgSystolic: 0,
        avgDiastolic: 0,
        avgHeartRate: 0,
        count: 0,
        dateRange: { start: '', end: '' },
        latest: null,
        trend: 'stable' as const
      };
    }

    const totalSystolic = records.reduce((sum, r) => sum + r.systolic, 0);
    const totalDiastolic = records.reduce((sum, r) => sum + r.diastolic, 0);
    const totalHeartRate = records.reduce((sum, r) => sum + r.heart_rate, 0);

    const avgSystolic = Math.round(totalSystolic / records.length);
    const avgDiastolic = Math.round(totalDiastolic / records.length);
    const avgHeartRate = Math.round(totalHeartRate / records.length);

    const sortedByDate = [...records].sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const dateRange = {
      start: sortedByDate[0]?.recorded_at || '',
      end: sortedByDate[sortedByDate.length - 1]?.recorded_at || ''
    };

    const latest = records[0];

    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    
    if (records.length >= 6) {
      const recent = records.slice(0, Math.min(3, Math.floor(records.length / 2)));
      const older = records.slice(Math.floor(records.length / 2), Math.floor(records.length / 2) + 3);

      const recentSystolic = recent.reduce((sum, r) => sum + r.systolic, 0) / recent.length;
      const olderSystolic = older.reduce((sum, r) => sum + r.systolic, 0) / older.length;

      const diff = recentSystolic - olderSystolic;
      if (diff < -5) trend = 'improving';
      else if (diff > 5) trend = 'worsening';
    }

    return { avgSystolic, avgDiastolic, avgHeartRate, count: records.length, dateRange, latest, trend };
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500" data-testid="bp-stats-empty">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p>No readings yet. Add your first to see statistics.</p>
      </div>
    );
  }

  const latestCategory = stats.latest ? classifyBP(stats.latest.systolic, stats.latest.diastolic) : 'normal';
  const latestConfig = getCategoryConfig(latestCategory);

  const trendConfig = {
    improving: { 
      icon: '↓', 
      color: 'text-success-600', 
      bg: 'bg-success-50',
      border: 'border-success-200',
      label: 'Improving' 
    },
    stable: { 
      icon: '→', 
      color: 'text-slate-600', 
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      label: 'Stable' 
    },
    worsening: { 
      icon: '↑', 
      color: 'text-danger-600', 
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      label: 'Worsening' 
    }
  };

  return (
    <div className="space-y-5" data-testid="bp-stats">
      {/* Average readings */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard 
          value={stats.avgSystolic} 
          label="Systolic" 
          color="primary"
          dataTestId="stat-systolic"
        />
        <StatCard 
          value={stats.avgDiastolic} 
          label="Diastolic" 
          color="primary"
          dataTestId="stat-diastolic"
        />
        <StatCard 
          value={stats.avgHeartRate} 
          label="Heart Rate" 
          color="slate"
          unit="bpm"
          dataTestId="stat-heart-rate"
        />
      </div>

      {/* Summary row */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <p className="text-xs text-slate-500 uppercase font-medium">Total Readings</p>
          <p className="text-2xl font-bold text-slate-900" data-testid="stat-count">{stats.count}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}</p>
          <p className="text-xs text-slate-400" data-testid="stat-date-range">Date Range</p>
        </div>
      </div>

      {/* Latest reading */}
      {stats.latest && (
        <div className="space-y-2" data-testid="latest-reading">
          <p className="text-xs text-slate-500 uppercase font-medium">Latest Reading</p>
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${latestConfig.icon === '🚨' ? 'text-danger-600' : 'text-slate-900'}`} data-testid="latest-bp">
                  {stats.latest.systolic}/{stats.latest.diastolic}
                </span>
                {stats.latest.heart_rate > 0 && (
                  <span className="text-sm text-slate-500" data-testid="latest-hr">
                    {stats.latest.heart_rate} bpm
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400" data-testid="latest-date">
                {formatDate(stats.latest.recorded_at)}
              </span>
            </div>            
            <div className="mt-3 flex items-center gap-2">
              <span className={latestConfig.badge}>
                {latestConfig.icon} {latestCategory === 'high1' ? 'High Stage 1' : latestCategory === 'high2' ? 'High Stage 2' : latestCategory.charAt(0).toUpperCase() + latestCategory.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trend */}
      <div 
        className={`flex items-center justify-center gap-3 p-4 rounded-xl border ${trendConfig[stats.trend].bg} ${trendConfig[stats.trend].border}`}
        data-testid="trend-indicator"
      >
        <span className={`text-2xl font-bold ${trendConfig[stats.trend].color}`}>
          {trendConfig[stats.trend].icon}
        </span>
        <div className="text-left">
          <p className={`text-sm font-semibold ${trendConfig[stats.trend].color}`}>
            {trendConfig[stats.trend].label}
          </p>
          <p className="text-xs text-slate-500">Recent trend</p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  color: 'primary' | 'slate';
  unit?: string;
  dataTestId?: string;
}

function StatCard({ value, label, color, unit, dataTestId }: StatCardProps) {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    slate: 'from-slate-500 to-slate-600'
  };
  
  return (
    <div 
      className="stat-card text-center group"
      data-testid={dataTestId}
    >
      <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {value}
        {unit && <span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span>}
      </div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}

export default BPStats;
