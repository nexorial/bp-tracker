import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BPInputForm } from '../app/components/BPInputForm';

// Mock fetch globally
global.fetch = jest.fn();

describe('BPInputForm', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the form with all elements', () => {
      render(<BPInputForm />);
      
      expect(screen.getByTestId('bp-input-form')).toBeInTheDocument();
      expect(screen.getByTestId('bp-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('bp-notes-field')).toBeInTheDocument();
      expect(screen.getByTestId('bp-submit-button')).toBeInTheDocument();
    });

    it('has input field with placeholder 120/80/72', () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      expect(input).toHaveAttribute('placeholder', '120/80/72');
    });

    it('renders notes textarea with placeholder', () => {
      render(<BPInputForm />);
      
      const notes = screen.getByTestId('bp-notes-field');
      expect(notes).toHaveAttribute('placeholder', 'Add any notes about this reading...');
    });

    it('renders submit button with correct text', () => {
      render(<BPInputForm />);
      
      const button = screen.getByTestId('bp-submit-button');
      expect(button).toHaveTextContent('Add Reading');
    });

    it('renders format hint below input', () => {
      render(<BPInputForm />);
      
      expect(screen.getByText('Format: systolic/diastolic/heartRate (e.g., 120/80/72)')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows validation error for empty input', async () => {
      render(<BPInputForm />);
      
      const submitButton = screen.getByTestId('bp-submit-button');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Blood pressure reading is required');
      });
    });

    it('shows validation error for invalid format with too few parts', async () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      await userEvent.type(input, '120');
      
      const submitButton = screen.getByTestId('bp-submit-button');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Invalid format');
      });
    });

    it('shows validation error for invalid format with too many parts', async () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      await userEvent.type(input, '120/80/72/10');
      
      const submitButton = screen.getByTestId('bp-submit-button');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Invalid format');
      });
    });

    it('shows validation error for out of range systolic', async () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      await userEvent.type(input, '300/80/72');
      
      const submitButton = screen.getByTestId('bp-submit-button');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Systolic must be between 60 and 250');
      });
    });

    it('shows validation error for out of range diastolic', async () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      await userEvent.type(input, '120/200/72');
      
      const submitButton = screen.getByTestId('bp-submit-button');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Diastolic must be between 40 and 150');
      });
    });

    it('shows validation error for out of range heart rate', async () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      await userEvent.type(input, '120/80/250');
      
      const submitButton = screen.getByTestId('bp-submit-button');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Heart rate must be between 40 and 200');
      });
    });

    it('clears validation error when user types', async () => {
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      // Trigger validation error
      await userEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toBeInTheDocument();
      });
      
      // Type to clear error
      await userEvent.type(input, '1');
      
      await waitFor(() => {
        expect(screen.queryByTestId('bp-input-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('submission', () => {
    it('calls POST /api/records with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, systolic: 120, diastolic: 80, heart_rate: 72 }),
      } as Response);
      
      render(<BPInputForm onSuccess={mockOnSuccess} />);
      
      const input = screen.getByTestId('bp-input-field');
      const notes = screen.getByTestId('bp-notes-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.type(notes, 'Feeling good today');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: '120/80/72',
            notes: 'Feeling good today',
          }),
        });
      });
    });

    it('calls POST /api/records without notes when notes are empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, systolic: 120, diastolic: 80, heart_rate: 72 }),
      } as Response);
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: '120/80/72',
            notes: undefined,
          }),
        });
      });
    });

    it('shows loading state during submission', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-loading-spinner')).toBeInTheDocument();
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
      
      // Verify input and button are disabled during loading
      expect(screen.getByTestId('bp-input-field')).toBeDisabled();
      expect(screen.getByTestId('bp-notes-field')).toBeDisabled();
      expect(screen.getByTestId('bp-submit-button')).toBeDisabled();
    });

    it('clears form after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, systolic: 120, diastolic: 80, heart_rate: 72 }),
      } as Response);
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const notes = screen.getByTestId('bp-notes-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.type(notes, 'Test notes');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(input).toHaveValue('');
        expect(notes).toHaveValue('');
      });
    });

    it('calls onSuccess callback after successful submission', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, systolic: 120, diastolic: 80, heart_rate: 72 }),
      } as Response);
      
      render(<BPInputForm onSuccess={mockOnSuccess} />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('displays server validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Invalid data',
          details: ['Something went wrong on the server'] 
        }),
      } as Response);
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Something went wrong on the server');
      });
    });

    it('displays server error without details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response);
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-input-error')).toHaveTextContent('Internal server error');
      });
    });

    it('displays network error message on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80/72');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('bp-general-error')).toHaveTextContent('Network error. Please try again.');
      });
    });
  });

  describe('input without heart rate', () => {
    it('accepts systolic/diastolic format without heart rate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, systolic: 120, diastolic: 80, heart_rate: 0 }),
      } as Response);
      
      render(<BPInputForm />);
      
      const input = screen.getByTestId('bp-input-field');
      const submitButton = screen.getByTestId('bp-submit-button');
      
      await userEvent.type(input, '120/80');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/records', expect.objectContaining({
          body: expect.stringContaining('120/80'),
        }));
      });
    });
  });
});
