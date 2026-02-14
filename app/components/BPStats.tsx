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

// BP Classification based on AHA guidelines
type BPCategory = 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis';

function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'high2';
  if (systolic >= 130 || diastolic >= 80) return 'high1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  return 'normal';
}

function getBPCategoryStyles(category: BPCategory): { bg: string; text: string; label: string } {
  switch (category) {
    case 'normal':
      return { bg: 'bg-green-100', text: 'text-green-800', label: 'Normal' };
    case 'elevated':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Elevated' };
    case 'high1':
      return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High Stage 1' };
    case 'high2':
      return { bg: 'bg-red-100', text: 'text-red-800', label: 'High Stage 2' };
    case 'crisis':
      return { bg: 'bg-red-200', text: 'text-red-900', label: 'Crisis' };
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

    // Calculate averages
    const totalSystolic = records.reduce((sum, r) => sum + r.systolic, 0);
    const totalDiastolic = records.reduce((sum, r) => sum + r.diastolic, 0);
    const totalHeartRate = records.reduce((sum, r) => sum + r.heart_rate, 0);

    const avgSystolic = Math.round(totalSystolic / records.length);
    const avgDiastolic = Math.round(totalDiastolic / records.length);
    const avgHeartRate = Math.round(totalHeartRate / records.length);

    // Date range (records are sorted by recorded_at DESC, so reverse for chronological order)
    const sortedByDate = [...records].sort((a, b) => 
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const dateRange = {
      start: sortedByDate[0]?.recorded_at || '',
      end: sortedByDate[sortedByDate.length - 1]?.recorded_at || ''
    };

    // Latest reading (first in the array since records are sorted DESC)
    const latest = records[0];

    // Calculate trend (compare recent 3 readings vs older readings)
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

  // Empty state
  if (records.length === 0) {
    return (
      <div 
        className="bg-white rounded-lg shadow p-6"
        data-testid="bp-stats-empty"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
        <p className="text-gray-500 text-center py-4">
          No readings yet. Add your first reading to see statistics.
        </p>
      </div>
    );
  }

  const latestCategory = stats.latest 
    ? classifyBP(stats.latest.systolic, stats.latest.diastolic)
    : 'normal';
  const latestStyles = getBPCategoryStyles(latestCategory);

  const trendConfig = {
    improving: { icon: '↓', color: 'text-green-600', label: 'Improving', bg: 'bg-green-50' },
    stable: { icon: '→', color: 'text-gray-600', label: 'Stable', bg: 'bg-gray-50' },
    worsening: { icon: '↑', color: 'text-red-600', label: 'Worsening', bg: 'bg-red-50' }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-6"
      data-testid="bp-stats"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>

      {/* Average readings grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div 
          className="text-center p-3 bg-gray-50 rounded-lg"
          data-testid="stat-systolic"
        >
          <div className="text-2xl font-bold text-gray-900">{stats.avgSystolic}</div>
          <div className="text-xs text-gray-500 uppercase">Avg Systolic</div>
        </div>
        <div 
          className="text-center p-3 bg-gray-50 rounded-lg"
          data-testid="stat-diastolic"
        >
          <div className="text-2xl font-bold text-gray-900">{stats.avgDiastolic}</div>
          <div className="text-xs text-gray-500 uppercase">Avg Diastolic</div>
        </div>
        <div 
          className="text-center p-3 bg-gray-50 rounded-lg"
          data-testid="stat-heart-rate"
        >
          <div className="text-2xl font-bold text-gray-900">{stats.avgHeartRate}</div>
          <div className="text-xs text-gray-500 uppercase">Avg Heart Rate</div>
        </div>
      </div>

      {/* Reading count and date range */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total Readings:</span>
          <span className="font-medium text-gray-900" data-testid="stat-count">
            {stats.count}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Date Range:</span>
          <span className="font-medium text-gray-900" data-testid="stat-date-range">
            {formatDate(stats.dateRange.start)} - {formatDate(stats.dateRange.end)}
          </span>
        </div>
      </div>

      {/* Latest reading with color-coded status */}
      {stats.latest && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase mb-2">Latest Reading</div>
          <div 
            className="flex items-center justify-between p-3 rounded-lg border"
            data-testid="latest-reading"
          >
            <div className="flex items-center gap-3">
              <span 
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${latestStyles.bg} ${latestStyles.text}`}
                data-testid="latest-bp"
              >
                {stats.latest.systolic}/{stats.latest.diastolic}
              </span>
              {stats.latest.heart_rate > 0 && (
                <span className="text-sm text-gray-600" data-testid="latest-hr">
                  {stats.latest.heart_rate} bpm
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500" data-testid="latest-date">
              {formatDate(stats.latest.recorded_at)}
            </span>
          </div>
          <div className="mt-1 text-xs text-right">
            <span className={`inline-flex items-center px-2 py-0.5 rounded ${latestStyles.bg} ${latestStyles.text}`}>
              {latestStyles.label}
            </span>
          </div>
        </div>
      )}

      {/* Trend indicator */}
      <div 
        className={`flex items-center justify-center gap-2 p-3 rounded-lg ${trendConfig[stats.trend].bg}`}
        data-testid="trend-indicator"
      >
        <span className={`text-lg font-bold ${trendConfig[stats.trend].color}`}>
          {trendConfig[stats.trend].icon}
        </span>
        <span className={`text-sm font-medium ${trendConfig[stats.trend].color}`}>
          Trend: {trendConfig[stats.trend].label}
        </span>
      </div>
    </div>
  );
}

export default BPStats;
