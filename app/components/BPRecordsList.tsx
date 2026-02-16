'use client';

import React, { useState, useCallback } from 'react';

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

type BPCategory = 'normal' | 'elevated' | 'high1' | 'high2' | 'crisis';

function classifyBP(systolic: number, diastolic: number): BPCategory {
  if (systolic >= 180 || diastolic >= 120) return 'crisis';
  if (systolic >= 140 || diastolic >= 90) return 'high2';
  if (systolic >= 130 || diastolic >= 80) return 'high1';
  if (systolic >= 120 && diastolic < 80) return 'elevated';
  return 'normal';
}

function getCategoryBadge(category: BPCategory): string {
  switch (category) {
    case 'normal': return 'badge-normal';
    case 'elevated': return 'badge-elevated';
    case 'high1': return 'badge-high-1';
    case 'high2': return 'badge-high-2';
    case 'crisis': return 'badge-crisis';
  }
}

function getCategoryLabel(category: BPCategory): string {
  switch (category) {
    case 'normal': return 'Normal';
    case 'elevated': return 'Elevated';
    case 'high1': return 'High Stage 1';
    case 'high2': return 'High Stage 2';
    case 'crisis': return 'Crisis';
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

  if (records.length === 0) {
    return (
      <div 
        className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200"
        data-testid="bp-records-empty"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <p className="text-slate-600 font-medium">No readings yet</p>
        <p className="text-sm text-slate-400 mt-1">Start tracking by adding your first reading</p>
      </div>
    );
  }

  return (
    <div data-testid="bp-records-list">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Pressure</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Heart Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
              <th className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {records.map((record) => {
              const category = classifyBP(record.systolic, record.diastolic);
              const badgeClass = getCategoryBadge(category);
              const isDeleting = deletingId === record.id;
              const isConfirming = showConfirm === record.id;

              return (
                <tr 
                  key={record.id}
                  data-testid={`bp-record-row-${record.id}`}
                  className={`${isDeleting ? 'opacity-50' : ''} hover:bg-slate-50 transition-colors`}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900" data-testid={`record-date-${record.id}`}>
                      {formatShortDate(record.recorded_at)}
                    </div>
                    <div className="text-sm text-slate-500" data-testid={`record-time-${record.id}`}>
                      {formatShortTime(record.recorded_at)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold text-slate-900`} data-testid={`record-bp-${record.id}`}>
                        {record.systolic}/{record.diastolic}
                      </span>
                      <span className={badgeClass}>{getCategoryLabel(category)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900" data-testid={`record-hr-${record.id}`}>
                      {record.heart_rate > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {record.heart_rate} bpm
                        </span>
                      ) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div 
                      className="text-sm text-slate-500 truncate max-w-xs"
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
                          className="px-3 py-1.5 text-xs font-medium text-white bg-danger-500 rounded-lg hover:bg-danger-600 transition-colors"
                          data-testid={`confirm-delete-${record.id}`}
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          disabled={isDeleting}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                          data-testid={`cancel-delete-${record.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(record.id)}
                        className="p-2 text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                        data-testid={`delete-button-${record.id}`}
                        title="Delete record"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
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
      <div className="md:hidden space-y-3" data-testid="bp-records-mobile">
        {records.map((record) => {
          const category = classifyBP(record.systolic, record.diastolic);
          const badgeClass = getCategoryBadge(category);
          const isDeleting = deletingId === record.id;
          const isConfirming = showConfirm === record.id;

          return (
            <div
              key={record.id}
              data-testid={`bp-record-card-${record.id}`}
              className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm ${isDeleting ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900" data-testid={`card-date-${record.id}`}>
                    {formatShortDate(record.recorded_at)}
                  </div>
                  <div className="text-xs text-slate-500" data-testid={`card-time-${record.id}`}>
                    {formatShortTime(record.recorded_at)}
                  </div>
                </div>
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmDelete(record.id)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-danger-500 rounded-lg"
                      data-testid={`card-confirm-delete-${record.id}`}
                    >
                      {isDeleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      disabled={isDeleting}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg"
                      data-testid={`card-cancel-delete-${record.id}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(record.id)}
                    className="p-2 text-slate-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
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

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 uppercase font-medium">Blood Pressure</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-slate-900" data-testid={`card-bp-${record.id}`}>
                      {record.systolic}/{record.diastolic}
                    </span>
                    <span className={badgeClass}>{getCategoryLabel(category)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500 uppercase font-medium">Heart Rate</div>
                  <div className="text-sm font-medium text-slate-900 mt-1" data-testid={`card-hr-${record.id}`}>
                    {record.heart_rate > 0 ? `${record.heart_rate} bpm` : '—'}
                  </div>
                </div>
              </div>

              {record.notes && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">Notes:</div>
                  <div className="text-sm text-slate-700 mt-1" data-testid={`card-notes-${record.id}`}>
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
          className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100"
          data-testid="bp-records-pagination"
        >
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">{offset + 1}</span>-
            <span className="font-medium">{Math.min(offset + records.length, total)}</span> of 
            <span className="font-medium">{total}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isLoading}
              className={`btn-secondary py-2 px-4 text-sm ${!hasPrevPage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              data-testid="prev-page-button"
            >
              Previous
            </button>
            
            <span className="text-sm text-slate-600 font-medium" data-testid="page-indicator">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className={`btn-secondary py-2 px-4 text-sm ${!hasNextPage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
