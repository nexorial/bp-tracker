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
      return 'Invalid format. Expected: systolic/diastolic or systolic/diastolic/heartRate (e.g., 120/80/72)';
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
    
    // Clear previous errors
    setErrors({});
    
    // Validate input
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
      
      // Clear form on success
      setInput('');
      setNotes('');
      setErrors({});
      
      // Call onSuccess callback if provided
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

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="bp-input-form">
      <div>
        <label 
          htmlFor="bp-reading" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Blood Pressure Reading
        </label>
        <input
          id="bp-reading"
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="120/80/72"
          disabled={isLoading}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${errors.input ? 'border-red-500' : 'border-gray-300'}
          `}
          data-testid="bp-input-field"
        />
        {errors.input && (
          <p className="mt-1 text-sm text-red-600" data-testid="bp-input-error">
            {errors.input}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Format: systolic/diastolic/heartRate (e.g., 120/80/72)
        </p>
      </div>

      <div>
        <label 
          htmlFor="bp-notes" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes (optional)
        </label>
        <textarea
          id="bp-notes"
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add any notes about this reading..."
          rows={3}
          disabled={isLoading}
          className="
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-vertical
          "
          data-testid="bp-notes-field"
        />
      </div>

      {errors.general && (
        <div 
          className="p-3 bg-red-50 border border-red-200 rounded-md"
          data-testid="bp-general-error"
        >
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full flex items-center justify-center px-4 py-2
          bg-blue-600 text-white font-medium rounded-md
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:bg-blue-400 disabled:cursor-not-allowed
          transition-colors duration-200
        "
        data-testid="bp-submit-button"
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              data-testid="bp-loading-spinner"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Saving...
          </>
        ) : (
          'Add Reading'
        )}
      </button>
    </form>
  );
}
