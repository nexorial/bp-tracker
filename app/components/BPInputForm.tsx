'use client';

import React, { useState, useCallback } from 'react';

export interface BPInputFormProps {
  onSuccess?: () => void;
}

interface FormErrors {
  input?: string;
  general?: string;
}

export function BPInputForm({ onSuccess }: BPInputFormProps) {
  const [input, setInput] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateInput = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return 'Blood pressure reading is required';
    }
    
    const parts = trimmed.split('/');
    
    if (parts.length < 2 || parts.length > 3) {
      return 'Invalid format. Use: systolic/diastolic/heartRate (e.g., 120/80/72)';
    }
    
    const systolic = parseInt(parts[0].trim(), 10);
    const diastolic = parseInt(parts[1].trim(), 10);
    const heartRateStr = parts[2]?.trim();
    const heartRate = heartRateStr ? parseInt(heartRateStr, 10) : null;
    
    if (isNaN(systolic) || systolic < 60 || systolic > 250) {
      return 'Systolic must be between 60 and 250';
    }

    if (isNaN(diastolic) || diastolic < 40 || diastolic > 150) {
      return 'Diastolic must be between 40 and 150';
    }

    if (heartRateStr && heartRateStr.length > 0 && (isNaN(heartRate!) || heartRate! < 40 || heartRate! > 200)) {
      return 'Heart rate must be between 40 and 200';
    }
    
    return undefined;
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});
    
    const inputError = validateInput(input);
    if (inputError) {
      setErrors({ input: inputError });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          setErrors({ input: data.details.join(', ') });
        } else {
          setErrors({ input: data.error || 'Failed to save reading' });
        }
        return;
      }
      
      setInput('');
      setNotes('');
      setErrors({});
      onSuccess?.();
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [input, notes, validateInput, onSuccess]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (errors.input) {
      setErrors(prev => ({ ...prev, input: undefined }));
    }
  }, [errors.input]);

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="bp-input-form">
      <div>
        <label 
          htmlFor="bp-reading" 
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Blood Pressure Reading
        </label>
        <div className="relative">
          <input
            id="bp-reading"
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="120/80/72"
            disabled={isLoading}
            className={`
              input-modern pr-12
              ${errors.input ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20' : ''}
            `}
            data-testid="bp-input-field"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>        
        {errors.input && (
          <p className="mt-2 text-sm text-danger-600 flex items-center gap-1" data-testid="bp-input-error">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.input}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Format: systolic/diastolic/heartRate
        </div>
      </div>

      <div>
        <label 
          htmlFor="bp-notes" 
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          Notes
          <span className="text-slate-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          id="bp-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Morning reading, after coffee..."
          rows={3}
          disabled={isLoading}
          className="input-modern resize-none"
          data-testid="bp-notes-field"
        />
      </div>

      {errors.general && (
        <div 
          className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center gap-2"
          data-testid="bp-general-error"
        >
          <svg className="h-5 w-5 text-danger-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-danger-700">{errors.general}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
        data-testid="bp-submit-button"
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              data-testid="bp-loading-spinner"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Reading
          </>
        )}
      </button>
    </form>
  );
}
