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
    // Remove the deleted record from the list
    setRecordsData(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== id),
      total: prev.total - 1
    }));
    
    // If we deleted the last record on this page and we're not on the first page,
    // go to the previous page
    if (recordsData.records.length === 1 && recordsData.offset > 0) {
      fetchRecords(recordsData.offset - recordsData.limit, recordsData.limit);
    } else {
      // Otherwise just refresh to fill the gap
      fetchRecords(recordsData.offset, recordsData.limit);
    }
  }, [fetchRecords, recordsData.offset, recordsData.limit, recordsData.records.length]);

  const chartData = convertToChartData(recordsData.records);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="app-title">
                BP Tracker
              </h1>
              <p className="mt-1 text-gray-600" data-testid="app-description">
                Track your blood pressure readings over time
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section - Full width on mobile, spans 2 columns on large screens */}
          <section
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-testid="chart-section"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Blood Pressure Trends
            </h2>
            {error ? (
              <div className="h-64 flex items-center justify-center text-red-600">
                Failed to load chart data
              </div>
            ) : (
              <BPChart data={chartData} />
            )}
          </section>

          {/* Input Form Section */}
          <section 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-testid="input-section"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Reading
            </h2>
            <BPInputForm onSuccess={handleRefresh} />
          </section>

          {/* Statistics Section */}
          <section
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-testid="stats-section"
          >
            <BPStats records={recordsData.records} />
          </section>

          {/* Records List Section - Full width */}
          <section 
            className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-testid="list-section"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Readings
              </h2>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 flex items-center gap-1"
                data-testid="refresh-button"
              >
                <svg 
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                  />
                </svg>
                Refresh
              </button>
            </div>
            
            {error ? (
              <div className="text-center py-8 text-red-600" data-testid="records-error">
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
          </section>
        </div>
      </div>
    </main>
  );
}
