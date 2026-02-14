'use client';

import { BPChart, BPChartDataPoint } from './components/BPChart';

// Sample data for demonstration - will be replaced with real data in future stories
const sampleData: BPChartDataPoint[] = [
  { date: '2024-01-01', systolic: 120, diastolic: 80, heartRate: 72 },
  { date: '2024-01-02', systolic: 125, diastolic: 82, heartRate: 75 },
  { date: '2024-01-03', systolic: 118, diastolic: 78, heartRate: 70 },
  { date: '2024-01-04', systolic: 122, diastolic: 79, heartRate: 73 },
  { date: '2024-01-05', systolic: 119, diastolic: 77, heartRate: 71 },
];

export default function Home() {
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
            <BPChart data={sampleData} />
          </section>

          {/* Input Form Section */}
          <section 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-testid="input-section"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Add Reading
            </h2>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Input Form Placeholder</span>
            </div>
          </section>

          {/* Records List Section - Full width */}
          <section 
            className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            data-testid="list-section"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Readings
            </h2>
            <div className="min-h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Records List Placeholder</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
