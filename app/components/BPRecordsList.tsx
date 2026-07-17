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
  badgeClass: string;
  dotClass: string;
} {
  switch (category) {
    case 'normal':
      return { label: 'Normal', badgeClass: 'badge-normal', dotClass: 'bg-health-normal' };
    case 'elevated':
      return { label: 'Elevated', badgeClass: 'badge-elevated', dotClass: 'bg-health-elevated' };
    case 'high1':
      return { label: 'High Stage 1', badgeClass: 'badge-high-1', dotClass: 'bg-health-high-1' };
    case 'high2':
      return { label: 'High Stage 2', badgeClass: 'badge-high-2', dotClass: 'bg-health-high-2' };
    case 'crisis':
      return { label: 'Crisis', badgeClass: 'badge-crisis', dotClass: 'bg-health-crisis' };
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
        className="text-center py-12 bg-bg-tertiary/50 rounded-xl border border-border-subtle border-dashed"
        data-testid="bp-records-empty"
      >
        <svg
          className="mx-auto h-12 w-12 text-text-tertiary mb-4"
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
        <h3 className="text-sm font-medium text-text-secondary">No readings yet</h3>
        <p className="mt-1 text-sm text-text-tertiary">
          Start tracking your blood pressure by adding your first reading.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="bp-records-list">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border-subtle">
        <table className="w-full">
          <thead className="bg-bg-secondary">
            <tr>
              <th className="px-6 py-4 text-left text-tiny font-medium text-text-secondary uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-tiny font-medium text-text-secondary uppercase tracking-wider">
                Blood Pressure
              </th>
              <th className="px-6 py-4 text-left text-tiny font-medium text-text-secondary uppercase tracking-wider">
                Heart Rate
              </th>
              <th className="px-6 py-4 text-left text-tiny font-medium text-text-secondary uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-4 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {records.map((record) => {
              const category = classifyBP(record.systolic, record.diastolic);
              const config = getBPCategoryConfig(category);
              const isDeleting = deletingId === record.id;
              const isConfirming = showConfirm === record.id;

              return (
                <tr 
                  key={record.id}
                  data-testid={`bp-record-row-${record.id}`}
                  className={`${isDeleting ? 'opacity-50' : ''} hover:bg-bg-tertiary/50 transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-primary" data-testid={`record-date-${record.id}`}>
                      {formatShortDate(record.recorded_at)}
                    </div>
                    <div className="text-sm text-text-tertiary" data-testid={`record-time-${record.id}`}>
                      {formatShortTime(record.recorded_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${config.dotClass}`}></span>
                      <span className="font-mono text-sm font-semibold text-text-primary"
                            data-testid={`record-bp-${record.id}`}>
                        {record.systolic}/{record.diastolic}
                      </span>
                      <span className={`badge ${config.badgeClass}`}>
                        {config.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-text-primary" data-testid={`record-hr-${record.id}`}>
                      {record.heart_rate > 0 ? (
                        <>
                          <svg className="w-4 h-4 text-health-high-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span className="font-mono">{record.heart_rate} bpm</span>
                        </>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="text-sm text-text-secondary truncate max-w-[200px]"
                      data-testid={`record-notes-${record.id}`}
                      title={record.notes || undefined}
                    >
                      {record.notes || <span className="text-text-tertiary">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isConfirming ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleConfirmDelete(record.id)}
                          disabled={isDeleting}
                          className="btn btn-destructive text-xs py-1 px-2"
                          data-testid={`confirm-delete-${record.id}`}
                        >
                          {isDeleting ? '...' : 'Confirm'}
                        </button>
                        <button
                          onClick={handleCancelDelete}
                          disabled={isDeleting}
                          className="btn btn-secondary text-xs py-1 px-2"
                          data-testid={`cancel-delete-${record.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(record.id)}
                        className="p-2 text-text-tertiary hover:text-health-crisis transition-colors rounded-lg hover:bg-health-crisis/10"
                        data-testid={`delete-button-${record.id}`}
                        title="Delete record"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          const config = getBPCategoryConfig(category);
          const isDeleting = deletingId === record.id;
          const isConfirming = showConfirm === record.id;

          return (
            <div
              key={record.id}
              data-testid={`bp-record-card-${record.id}`}
              className={`bg-bg-secondary border border-border-subtle rounded-xl p-4 ${isDeleting ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-medium text-text-primary"
                       data-testid={`card-date-${record.id}`}>
                    {formatDate(record.recorded_at)}
                  </div>
                </div>
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirmDelete(record.id)}
                      disabled={isDeleting}
                      className="btn btn-destructive text-xs py-1 px-2"
                      data-testid={`card-confirm-delete-${record.id}`}
                    >
                      {isDeleting ? '...' : 'Del'}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      disabled={isDeleting}
                      className="btn btn-secondary text-xs py-1 px-2"
                      data-testid={`card-cancel-delete-${record.id}`}
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDeleteClick(record.id)}
                    className="p-2 text-text-tertiary hover:text-health-crisis transition-colors rounded-lg hover:bg-health-crisis/10"
                    data-testid={`card-delete-${record.id}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-tiny text-text-tertiary uppercase tracking-wider mb-1">Blood Pressure</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dotClass}`}></span>
                    <span className="font-mono text-lg font-semibold text-text-primary"
                          data-testid={`card-bp-${record.id}`}>
                      {record.systolic}/{record.diastolic}
                    </span>
                  </div>
                  <span className={`badge ${config.badgeClass} mt-1`}>
                    {config.label}
                  </span>
                </div>

                <div>
                  <div className="text-tiny text-text-tertiary uppercase tracking-wider mb-1">Heart Rate</div>
                  <div className="flex items-center gap-2 text-text-primary"
                       data-testid={`card-hr-${record.id}`}>
                    {record.heart_rate > 0 ? (
                      <>
                        <svg className="w-4 h-4 text-health-high-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span className="font-mono text-lg">{record.heart_rate} bpm</span>
                      </>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </div>
                </div>
              </div>

              {record.notes && (
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <div className="text-tiny text-text-tertiary uppercase tracking-wider mb-1">Notes</div>
                  <div className="text-sm text-text-secondary" data-testid={`card-notes-${record.id}`}>
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
          className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-border-subtle gap-4"
          data-testid="bp-records-pagination"
        >
          <div className="text-sm text-text-tertiary">
            Showing <span className="text-text-primary font-mono">{offset + 1}</span>-
            <span className="text-text-primary font-mono">{Math.min(offset + records.length, total)}</span> of 
            <span className="text-text-primary font-mono">{total}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isLoading}
              className="btn btn-secondary text-sm py-2 px-4 disabled:opacity-50"
              data-testid="prev-page-button"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <span className="text-sm text-text-secondary font-mono" data-testid="page-indicator">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isLoading}
              className="btn btn-secondary text-sm py-2 px-4 disabled:opacity-50"
              data-testid="next-page-button"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BPRecordsList;
