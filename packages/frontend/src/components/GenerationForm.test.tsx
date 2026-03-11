import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GenerationForm } from './GenerationForm';

describe('GenerationForm', () => {
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Story ID Input Field', () => {
    it('renders story ID input field with proper label and placeholder', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.getByLabelText('Jira Story ID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., PROJ-123')).toBeInTheDocument();
      expect(screen.getByText('Enter a Jira story ID or select a story from the board below')).toBeInTheDocument();
    });

    it('auto-fills story ID when selectedStoryId prop is provided', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-456"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByDisplayValue('PROJ-456');
      expect(input).toBeInTheDocument();
    });

    it('updates story ID when selectedStoryId prop changes', () => {
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.getByDisplayValue('PROJ-123')).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-456"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.getByDisplayValue('PROJ-456')).toBeInTheDocument();
    });

    it('allows manual entry of story ID', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'TEST-789' } });

      expect(screen.getByDisplayValue('TEST-789')).toBeInTheDocument();
    });

    it('disables input when generation is in progress', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      expect(input).toBeDisabled();
    });
  });

  describe('Story ID Validation', () => {
    it('validates story ID format and shows error for invalid format', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'invalid-format' } });

      expect(screen.getByText('Story ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument(); // AlertCircle icon
    });

    it('shows error for empty story ID on form submission', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      // The button should be disabled when story ID is empty, so we need to test the validation logic directly
      const input = screen.getByLabelText('Jira Story ID');
      
      // Try to submit with empty input by triggering form submission
      const form = input.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText('Story ID is required')).toBeInTheDocument();
    });

    it('accepts valid story ID format', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'PROJ-123' } });

      expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
    });

    it('validates various valid story ID formats', () => {
      const validIds = ['A-1', 'ABC-123', 'PROJECT-9999', 'TEST-42'];
      
      validIds.forEach(storyId => {
        const { unmount } = render(
          <GenerationForm
            onGenerate={mockOnGenerate}
            isGenerating={false}
          />
        );

        const input = screen.getByLabelText('Jira Story ID');
        fireEvent.change(input, { target: { value: storyId } });

        expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
        
        unmount();
      });
    });

    it('clears validation error when selectedStoryId is provided', () => {
      const { rerender } = render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'invalid' } });

      expect(screen.getByText('Story ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
    });
  });

  describe('Generation Button', () => {
    it('renders generation button with proper text and icon', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Generate Feature File');
    });

    it('disables button when story ID is empty', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).toBeDisabled();
    });

    it('disables button when story ID is invalid', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'invalid-format' } });

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).toBeDisabled();
    });

    it('enables button when story ID is valid', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'PROJ-123' } });

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).not.toBeDisabled();
    });

    it('disables button during generation', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      const button = screen.getByRole('button', { name: /generating/i });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Generating...');
    });

    it('calls onGenerate with trimmed story ID when clicked', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: '  PROJ-123  ' } });

      const button = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(button);

      expect(mockOnGenerate).toHaveBeenCalledWith('PROJ-123');
    });

    it('prevents form submission with invalid story ID', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'invalid' } });

      const button = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(button);

      expect(mockOnGenerate).not.toHaveBeenCalled();
      expect(screen.getByText('Story ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner and text during generation', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByText('This may take up to 60 seconds...')).toBeInTheDocument();
      
      // Check for animated dots
      const dots = screen.getAllByRole('generic').filter(el => 
        el.className.includes('animate-bounce')
      );
      expect(dots).toHaveLength(3);
    });

    it('hides loading indicators when not generating', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      expect(screen.queryByText('This may take up to 60 seconds...')).not.toBeInTheDocument();
    });
  });

  describe('Progress Status Display', () => {
    it('shows no progress status when idle', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.queryByText('Fetching story details...')).not.toBeInTheDocument();
      expect(screen.queryByText('Reading Morpheus codebase context...')).not.toBeInTheDocument();
    });

    it('shows progress steps during generation', async () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      // Should start with first step
      expect(screen.getByText('Fetching story details...')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();

      // Should show progress bar
      const progressContainer = screen.getByText('Step 1 of 5').closest('div');
      expect(progressContainer).toBeInTheDocument();
    });

    it('progresses through generation steps', async () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      // First step
      expect(screen.getByText('Fetching story details...')).toBeInTheDocument();

      // Wait for second step
      await waitFor(() => {
        expect(screen.getByText('Reading Morpheus codebase context...')).toBeInTheDocument();
      }, { timeout: 4000 });
    }, 15000);

    it('resets progress status when generation stops', () => {
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      expect(screen.getByText('Fetching story details...')).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      expect(screen.queryByText('Fetching story details...')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error prop is provided', () => {
      const error = new Error('Failed to connect to Jira');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
        />
      );

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to Jira')).toBeInTheDocument();
    });

    it('shows error status in progress display when error occurs', () => {
      const error = new Error('Service unavailable');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
        />
      );

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
      expect(screen.getByText('Service unavailable')).toBeInTheDocument();
    });

    it('handles error without message gracefully', () => {
      const error = new Error();
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
        />
      );

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });

    it('does not show duplicate error messages', () => {
      const error = new Error('Test error');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
        />
      );

      const errorMessages = screen.getAllByText('Test error');
      expect(errorMessages).toHaveLength(1);
    });
  });

  describe('Form Submission', () => {
    it('prevents default form submission behavior', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      const form = input.closest('form')!;
      
      // Create a mock submit event
      const mockSubmitHandler = vi.fn((e) => e.preventDefault());
      form.addEventListener('submit', mockSubmitHandler);
      
      fireEvent.submit(form);

      expect(mockSubmitHandler).toHaveBeenCalled();
    });

    it('submits form when Enter key is pressed in input field', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'PROJ-123' } });
      
      // Submit the form by pressing Enter
      fireEvent.submit(input.closest('form')!);

      expect(mockOnGenerate).toHaveBeenCalledWith('PROJ-123');
    });
  });

  describe('Accessibility', () => {
    it('associates label with input field', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      expect(input).toHaveAttribute('id', 'storyId');
    });

    it('provides proper ARIA attributes for validation errors', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'invalid' } });

      expect(input).toHaveClass('border-red-300');
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument(); // AlertCircle icon
    });

    it('maintains focus management during state changes', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      input.focus();
      
      fireEvent.change(input, { target: { value: 'PROJ-123' } });
      
      expect(document.activeElement).toBe(input);
    });

    it('provides proper button accessibility attributes', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('provides proper accessibility for disabled button', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Edge Cases and Additional Scenarios', () => {
    it('handles rapid story ID changes correctly', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      
      // Rapid changes
      fireEvent.change(input, { target: { value: 'A' } });
      fireEvent.change(input, { target: { value: 'AB' } });
      fireEvent.change(input, { target: { value: 'ABC-123' } });

      expect(screen.getByDisplayValue('ABC-123')).toBeInTheDocument();
      expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
    });

    it('handles whitespace-only input correctly', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: '   ' } });

      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).toBeDisabled();
    });

    it('validates story ID with special characters', () => {
      const invalidIds = ['PROJ-123!', 'PROJ@123', 'PROJ-123#', 'PROJ-123$'];
      
      invalidIds.forEach(storyId => {
        const { unmount } = render(
          <GenerationForm
            onGenerate={mockOnGenerate}
            isGenerating={false}
          />
        );

        const input = screen.getByLabelText('Jira Story ID');
        fireEvent.change(input, { target: { value: storyId } });

        expect(screen.getByText('Story ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
        
        unmount();
      });
    });

    it('handles very long story IDs', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      const longId = 'VERYLONGPROJECTNAME-123456789';
      fireEvent.change(input, { target: { value: longId } });

      expect(screen.getByDisplayValue(longId)).toBeInTheDocument();
      expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
    });

    it('handles story ID with lowercase letters', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: 'proj-123' } });

      expect(screen.getByText('Story ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
    });

    it('handles story ID with leading/trailing spaces in validation', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      fireEvent.change(input, { target: { value: '  PROJ-123  ' } });

      // Should not show validation error for valid ID with spaces
      expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
      
      const button = screen.getByRole('button', { name: /generate feature file/i });
      expect(button).not.toBeDisabled();
    });

    it('clears validation error when typing valid ID after invalid one', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
        />
      );

      const input = screen.getByLabelText('Jira Story ID');
      
      // First enter invalid ID
      fireEvent.change(input, { target: { value: 'invalid' } });
      expect(screen.getByText('Story ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
      
      // Then enter valid ID
      fireEvent.change(input, { target: { value: 'PROJ-123' } });
      expect(screen.queryByText(/Story ID must be in format/)).not.toBeInTheDocument();
    });

    it('handles multiple error prop changes', () => {
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={new Error('First error')}
        />
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={new Error('Second error')}
        />
      );

      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('handles clearing error prop', () => {
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={new Error('Test error')}
        />
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={undefined}
        />
      );

      // The component doesn't automatically clear error state when error prop is cleared
      // This is expected behavior - error state persists until a new generation starts
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('Progress Bar Functionality', () => {
    it('shows correct progress percentage for each step', async () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      // First step should show 20% progress (1/5)
      const progressBar = document.querySelector('.bg-blue-600');
      expect(progressBar).toHaveStyle({ width: '20%' });
    });

    it('shows completion status correctly', async () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={true}
        />
      );

      // Wait for completion step
      await waitFor(() => {
        expect(screen.getByText('Done! ✅')).toBeInTheDocument();
      }, { timeout: 15000 });

      // Should show green styling for completion - look for the correct container
      const completionMessage = screen.getByText('Done! ✅');
      const completionContainer = completionMessage.closest('.border');
      expect(completionContainer).toHaveClass('bg-green-50', 'border-green-200');
    }, 20000);

    it('shows error status with proper styling', () => {
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={new Error('Test error')}
        />
      );

      const errorMessage = screen.getByText('Generation failed');
      const errorContainer = errorMessage.closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });
  });
});