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

function getBPCategoryConfig(category: BPCategory): { 
  label: string; 
  colorClass: string;
  dotClass: string;
} {
  switch (category) {
    case 'normal':
      return { label: 'Normal', colorClass: 'text-health-normal', dotClass: 'bg-health-normal' };
    case 'elevated':
      return { label: 'Elevated', colorClass: 'text-health-elevated', dotClass: 'bg-health-elevated' };
    case 'high1':
      return { label: 'High Stage 1', colorClass: 'text-health-high-1', dotClass: 'bg-health-high-1' };
    case 'high2':
      return { label: 'High Stage 2', colorClass: 'text-health-high-2', dotClass: 'bg-health-high-2' };
    case 'crisis':
      return { label: 'Crisis', colorClass: 'text-health-crisis', dotClass: 'bg-health-crisis' };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
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
      if (diff < -5) {
        trend = 'improving';
      } else if (diff > 5) {
        trend = 'worsening';
      } else {
        trend = 'stable';
      }
    }

    return {
      avgSystolic,
      avgDiastolic,
      avgHeartRate,
      count: records.length,
      dateRange,
      latest,
      trend
    };
  }, [records]);

  if (records.length === 0) {
    return (
      <div className="text-center py-8" data-testid="bp-stats-empty">
        <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-text-secondary">No readings yet</p>
        <p className="text-caption text-text-tertiary mt-1">Add your first reading to see statistics</p>
      </div>
    );
  }

  const latestCategory = stats.latest 
    ? classifyBP(stats.latest.systolic, stats.latest.diastolic)
    : 'normal';
  const latestConfig = getBPCategoryConfig(latestCategory);

  const trendConfig = {
    improving: { 
      icon: '↓', 
      colorClass: 'text-health-normal', 
      label: 'Improving', 
      bgClass: 'bg-health-normal/10',
      borderClass: 'border-health-normal/20'
    },
    stable: { 
      icon: '→', 
      colorClass: 'text-text-secondary', 
      label: 'Stable', 
      bgClass: 'bg-bg-tertiary',
      borderClass: 'border-border-subtle'
    },
    worsening: { 
      icon: '↑', 
      colorClass: 'text-health-crisis', 
      label: 'Worsening', 
      bgClass: 'bg-health-crisis/10',
      borderClass: 'border-health-crisis/20'
    }
  };

  return (
    <div data-testid="bp-stats">
      {/* Average readings grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-bg-tertiary rounded-xl border border-border-subtle" data-testid="stat-systolic">
          <div className="font-mono text-2xl font-bold text-text-primary">{stats.avgSystolic}</div>
          <div className="text-tiny text-text-tertiary uppercase tracking-wider mt-1">Systolic</div>
        </div>
        <div className="text-center p-3 bg-bg-tertiary rounded-xl border border-border-subtle" data-testid="stat-diastolic">
          <div className="font-mono text-2xl font-bold text-text-primary">{stats.avgDiastolic}</div>
          <div className="text-tiny text-text-tertiary uppercase tracking-wider mt-1">Diastolic</div>
        </div>
        <div className="text-center p-3 bg-bg-tertiary rounded-xl border border-border-subtle" data-testid="stat-heart-rate">
          <div className="font-mono text-2xl font-bold text-text-primary">{stats.avgHeartRate}</div>
          <div className="text-tiny text-text-tertiary uppercase tracking-wider mt-1">BPM</div>
        </div>
      </div>

      {/* Reading count and date range */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Total Readings:</span>
          <span className="font-medium text-text-primary font-mono" data-testid="stat-count">
            {stats.count}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Date Range:</span>
          <span className="font-medium text-text-primary" data-testid="stat-date-range">
            {formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}
          </span>
        </div>
      </div>

      {/* Latest reading with color-coded status */}
      {stats.latest && (
        <div className="mb-6">
          <div className="text-tiny text-text-tertiary uppercase tracking-wider mb-2">Latest Reading</div>
          <div 
            className="flex items-center justify-between p-3 rounded-xl bg-bg-tertiary border border-border-subtle"
            data-testid="latest-reading"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${latestConfig.dotClass}`}></span>
              <span 
                className={`font-mono text-lg font-semibold ${latestConfig.colorClass}`}
                data-testid="latest-bp"
              >
                {stats.latest.systolic}/{stats.latest.diastolic}
              </span>
              {stats.latest.heart_rate > 0 && (
                <span className="text-sm text-text-secondary" data-testid="latest-hr">
                  {stats.latest.heart_rate} bpm
                </span>
              )}
            </div>
            <span className="text-xs text-text-tertiary" data-testid="latest-date">
              {formatDate(stats.latest.recorded_at)}
            </span>
          </div>
          <div className="mt-2 text-right">
            <span className={`badge ${
              latestCategory === 'normal' ? 'badge-normal' :
              latestCategory === 'elevated' ? 'badge-elevated' :
              latestCategory === 'high1' ? 'badge-high-1' :
              latestCategory === 'high2' ? 'badge-high-2' : 'badge-crisis'
            }`}>
              {latestConfig.label}
            </span>
          </div>
        </div>
      )}

      {/* Trend indicator */}
      <div 
        className={`flex items-center justify-center gap-2 p-3 rounded-xl border ${trendConfig[stats.trend].bgClass} ${trendConfig[stats.trend].borderClass}`}
        data-testid="trend-indicator"
      >
        <span className={`text-lg font-bold ${trendConfig[stats.trend].colorClass}`}>
          {trendConfig[stats.trend].icon}
        </span>
        <span className={`text-sm font-medium ${trendConfig[stats.trend].colorClass}`}>
          {trendConfig[stats.trend].label}
        </span>
      </div>
    </div>
  );
}

export default BPStats;
