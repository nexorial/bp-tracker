'use client';

import React, { useState, useCallback, useMemo } from 'react';

export interface BPRecord {
  id: number;
  systolic: number;
  diastolic: number;
  heart_rate: number;
  recorded_at: string;
  notes: string | null;
}

export interface BPRecordsListProps {
  records: BPRecord[];
  total: number;
  limit: number;
  offset: number;
  onDelete?: (id: number) => void;
  onPageChange?: (offset: number) => void;
  isLoading?: boolean;
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
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function formatShortTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function BPRecordsList({
  records,
  total,
  limit,
  offset,
  onDelete,
  onPageChange,
  isLoading = false
}: BPRecordsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState<number | null>(null);

  const handleDeleteClick = useCallback((id: number) => {
    setShowConfirm(id);
  }, []);

  const handleConfirmDelete = useCallback(async (id: number) => {
    setDeletingId(id);
    setShowConfirm(null);
    
    try {
      const response = await fetch(`/api/records/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      onDelete?.(id);
    } catch (error) {
      console.error('Error deleting record:', error);
      // Could add toast notification here
    } finally {
      setDeletingId(null);
    }
  }, [onDelete]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirm(null);
  }, []);

  const handlePrevPage = useCallback(() => {
    if (offset >= limit) {
      onPageChange?.(offset - limit);
    }
  }, [offset, limit, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (offset + limit < total) {
      onPageChange?.(offset + limit);
    }
  }, [offset, limit, total, onPageChange]);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasPrevPage = offset > 0;
  const hasNextPage = offset + limit < total;

  // Empty state
  if (records.length === 0) {
    return (
      <div 
        className="text-center py-12 bg-gray-50 rounded-lg"
        data-testid="bp-records-empty"
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          data-testid="empty-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No readings yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start tracking your blood pressure by adding your first reading.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="bp-records-list">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date & Time
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Blood Pressure
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Heart Rate
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Notes
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => {
              const category = classifyBP(record.systolic, record.diastolic);
              const styles = getBPCategoryStyles(category);
              const isDeleting = deletingId === record.id;
              const isConfirming = showConfirm === record.id;

              return (
                <tr 
                  key={record.id}
                  data-testid={`bp-record-row-${record.id}`}
                  className={isDeleting ? 'opacity-50' : ''}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900" data-testid={`record-date-${record.id}`}>
                      {formatShortDate(record.recorded_at)}
                    </div>
                    <div className="text-sm text-gray-500" data-testid={`record-time-${record.id}`}>
                      {formatShortTime(record.recorded_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}
                        data-testid={`record-bp-${record.id}`}
                      >
                        {record.systolic}/{record.diastolic}
                      </span>
                      <span className="text-xs text-gray-500">{styles.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900" data-testid={`record-hr-${record.id}`}>
                      {record.heart_rate > 0 ? `${record.heart_rate} bpm` : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div 
                      className="text-sm text-gray-500 truncate max-w-xs"
                      data-testid={`record-notes-${record.id}`}
                      title={record.notes || undefined}
                    >
                      {record.notes || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isConfirming ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleConfirmDelete(record.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded"
                          data-testid={`confirm-delete-${record.id}`}
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          disabled={isDeleting}
                          className="text-gray-600 hover:text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded"
                          data-testid={`cancel-delete-${record.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(record.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        data-testid={`delete-button-${record.id}`}
                        title="Delete record"
                      >
                        <svg 
                          className="h-5 w-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1.5} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4" data-testid="bp-records-mobile">
        {records.map((record) => {
          const category = classifyBP(record.systolic, record.diastolic);
          const styles = getBPCategoryStyles(category);
          const isDeleting = deletingId === record.id;
          const isConfirming = showConfirm === record.id;

          return (
            <div
              key={record.id}
              data-testid={`bp-record-card-${record.id}`}
              className={`bg-white border border-gray-200 rounded-lg p-4 ${isDeleting ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-900"
                       data-testid={`card-date-${record.id}`}>
                    {formatDate(record.recorded_at)}
                  </div>
                </div>
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmDelete(record.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded"
                      data-testid={`card-confirm-delete-${record.id}`}
                    >
                      {isDeleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      disabled={isDeleting}
                      className="text-gray-600 hover:text-gray-900 text-xs bg-gray-100 px-2 py-1 rounded"
                      data-testid={`card-cancel-delete-${record.id}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(record.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    data-testid={`card-delete-${record.id}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase">Blood Pressure</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles.bg} ${styles.text}`}
                      data-testid={`card-bp-${record.id}`}
                    >
                      {record.systolic}/{record.diastolic}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{styles.label}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase">Heart Rate</div>
                  <div 
                    className="text-sm font-medium text-gray-900 mt-1"
                    data-testid={`card-hr-${record.id}`}
                  >
                    {record.heart_rate > 0 ? `${record.heart_rate} bpm` : '—'}
                  </div>
                </div>
              </div>

              {record.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Notes:</div>
                  <div 
                    className="text-sm text-gray-700 mt-1"
                    data-testid={`card-notes-${record.id}`}
                  >
                    {record.notes}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div 
          className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200"
          data-testid="bp-records-pagination"
        >
          <div className="text-sm text-gray-500">
            Showing {offset + 1}-{Math.min(offset + records.length, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isLoading}
              className={`
                px-3 py-1 text-sm rounded
                ${hasPrevPage && !isLoading
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
              data-testid="prev-page-button"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600" data-testid="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className={`
                px-3 py-1 text-sm rounded
                ${hasNextPage && !isLoading
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
              data-testid="next-page-button"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BPRecordsList;
