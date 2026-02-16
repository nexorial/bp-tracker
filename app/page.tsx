'use client';

import { useCallback, useEffect, useState } from 'react';
import { BPChart, BPChartDataPoint } from './components/BPChart';
import { BPInputForm } from './components/BPInputForm';
import { BPRecordsList, BPRecord } from './components/BPRecordsList';
import { BPStats } from './components/BPStats';

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

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Modern Header */}
      <header className="gradient-header text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="app-title">
                  BP Tracker
                </h1>
              </div>
              <p className="text-slate-300 text-sm sm:text-base" data-testid="app-description">
                Monitor your blood pressure trends with visual insights
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm disabled:opacity-50"
              data-testid="export-button"
            >
              <svg
                className={`h-5 w-5 ${isExporting ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isExporting ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                )}
              </svg>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <section
            className="lg:col-span-2 section-card"
            data-testid="chart-section"
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Blood Pressure Trends</h2>
              <p className="text-sm text-slate-500 mt-1">Visualize your readings over time</p>
            </div>
            <div className="p-6">
              {error ? (
                <div className="h-64 flex items-center justify-center text-danger-600 bg-danger-50 rounded-xl">
                  Failed to load chart data
                </div>
              ) : (
                <BPChart data={chartData} />
              )}
            </div>
          </section>

          {/* Input Form Section */}
          <section 
            className="section-card"
            data-testid="input-section"
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Add Reading</h2>
              <p className="text-sm text-slate-500 mt-1">Enter your measurements</p>
            </div>
            <div className="p-6">
              <BPInputForm onSuccess={handleRefresh} />
            </div>
          </section>

          {/* Statistics Section */}
          <section
            className="section-card"
            data-testid="stats-section"
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Statistics</h2>
              <p className="text-sm text-slate-500 mt-1">Overview of your health metrics</p>
            </div>
            <div className="p-6">
              <BPStats records={recordsData.records} />
            </div>
          </section>

          {/* Records List Section */}
          <section 
            className="lg:col-span-3 section-card"
            data-testid="list-section"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Readings</h2>
                <p className="text-sm text-slate-500 mt-1">Your blood pressure history</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="btn-secondary text-sm py-2 px-4"
                data-testid="refresh-button"
              >
                <svg 
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            <div className="p-6">
              {error ? (
                <div className="text-center py-8 text-danger-600 bg-danger-50 rounded-xl" data-testid="records-error">
                  {error}
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
        </div>
      </div>
    </main>
  );
}
