'use client';

import { useCallback, useEffect, useState } from 'react';
import { BPChart, BPChartDataPoint } from './components/BPChart';
import { BPInputForm } from './components/BPInputForm';
import { BPRecordsList, BPRecord } from './components/BPRecordsList';
import { BPStats } from './components/BPStats';
import { CurrentReadingCard } from './components/CurrentReadingCard';

interface RecordsResponse {
  records: BPRecord[];
  total: number;
  limit: number;
  offset: number;
}

function convertToChartData(records: BPRecord[]): BPChartDataPoint[] {
  return [...records]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(record => ({
      date: new Date(record.recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      systolic: record.systolic,
      diastolic: record.diastolic,
      heartRate: record.heart_rate
    }));
}

// Heart icon SVG component
function HeartIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

// Download icon SVG component
function DownloadIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

// Refresh icon SVG component
function RefreshIcon({ className = 'w-5 h-5', spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export default function Home() {
  const [recordsData, setRecordsData] = useState<RecordsResponse>({
    records: [],
    total: 0,
    limit: 10,
    offset: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (offset = 0, limit = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/records?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }
      
      const data: RecordsResponse = await response.json();
      setRecordsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRefresh = useCallback(() => {
    fetchRecords(recordsData.offset, recordsData.limit);
  }, [fetchRecords, recordsData.offset, recordsData.limit]);

  const handlePageChange = useCallback((offset: number) => {
    fetchRecords(offset, recordsData.limit);
  }, [fetchRecords, recordsData.limit]);

  const handleDelete = useCallback((id: number) => {
    setRecordsData(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== id),
      total: prev.total - 1
    }));

    if (recordsData.records.length === 1 && recordsData.offset > 0) {
      fetchRecords(recordsData.offset - recordsData.limit, recordsData.limit);
    } else {
      fetchRecords(recordsData.offset, recordsData.limit);
    }
  }, [fetchRecords, recordsData.offset, recordsData.limit, recordsData.records.length]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/export');

      if (!response.ok) {
        throw new Error('Failed to export records');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'bp-records.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert(err instanceof Error ? err.message : 'Failed to export records');
    } finally {
      setIsExporting(false);
    }
  }, []);

  const chartData = convertToChartData(recordsData.records);
  const latestRecord = recordsData.records[0] || null;

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-health-high-2 to-accent-danger flex items-center justify-center shadow-lg">
                <HeartIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-text-primary tracking-tight">
                  BP Tracker
                </h1>
                <p className="text-xs text-text-tertiary">
                  Blood Pressure Monitor
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="btn btn-ghost p-2"
                title="Refresh data"
              >
                <RefreshIcon className="w-5 h-5" spinning={isLoading} />
              </button>
              
              <button
                onClick={handleExport}
                disabled={isExporting || recordsData.total === 0}
                className="btn btn-primary text-sm"
              >
                {isExporting ? (
                  <>
                    <RefreshIcon className="w-4 h-4" spinning />
                    Exporting...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-4 h-4" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section - Current Reading */}
        {latestRecord && (
          <section className="mb-8 animate-fade-in">
            <CurrentReadingCard record={latestRecord} />
          </section>
        )}

        {/* Statistics and Add Reading - Same Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Statistics Section */}
          <section>
            <div className="card h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-h3 text-text-primary">Statistics</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Your blood pressure statistics and trends
                  </p>
                </div>
              </div>
              <BPStats records={recordsData.records} />
            </div>
          </section>

          {/* Add Reading Section */}
          <section>
            <div className="card h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-h3 text-text-primary">Add Reading</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Log a new blood pressure measurement
                  </p>
                </div>
              </div>
              <BPInputForm onSuccess={handleRefresh} />
            </div>
          </section>
        </div>

        {/* Blood Pressure Trends Section - Full Width */}
        <section className="mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-h3 text-text-primary">Blood Pressure Trends</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Track your readings over time
                </p>
              </div>
            </div>
            
            {error ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-health-crisis/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-health-crisis" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-health-crisis font-medium">Failed to load chart data</p>
                  <button 
                    onClick={handleRefresh}
                    className="text-accent-primary text-sm mt-2 hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <BPChart data={chartData} />
            )}
          </div>
        </section>

        {/* Recent Readings - Full width */}
        <section className="mb-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-h3 text-text-primary">Recent Readings</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Your latest blood pressure measurements
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption text-text-tertiary">
                  {recordsData.total} total records
                </span>
              </div>
            </div>
            
            {error ? (
              <div className="text-center py-12">
                <p className="text-health-crisis">{error}</p>
              </div>
            ) : (
              <BPRecordsList
                records={recordsData.records}
                total={recordsData.total}
                limit={recordsData.limit}
                offset={recordsData.offset}
                onDelete={handleDelete}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-caption text-text-tertiary">
              BP Tracker Dashboard • Built with care for your health
            </p>
            <div className="flex items-center gap-4 text-caption text-text-tertiary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-health-normal"></span>
                Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-health-elevated"></span>
                Elevated
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-health-high-1"></span>
                High 1
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-health-high-2"></span>
                High 2
              </span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
