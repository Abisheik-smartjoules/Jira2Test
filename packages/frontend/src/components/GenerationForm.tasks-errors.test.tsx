import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GenerationForm } from './GenerationForm';

describe('GenerationForm - Task Error Handling', () => {
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Task-Specific Labels and Messages', () => {
    it('displays "Jira Task ID" label when issueType is task', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      expect(screen.getByLabelText('Jira Task ID')).toBeInTheDocument();
    });

    it('displays task-specific validation error messages', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      fireEvent.change(input, { target: { value: 'invalid-format' } });

      expect(screen.getByText('Task ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
    });

    it('displays task-specific required error message', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      const form = input.closest('form')!;
      fireEvent.submit(form);

      expect(screen.getByText('Task ID is required')).toBeInTheDocument();
    });

    it('displays task-specific helper text', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      expect(screen.getByText('Enter a Jira task ID or select a task from the board below')).toBeInTheDocument();
    });
  });

  describe('Task Generation Errors', () => {
    it('displays "Task {taskId} not found" error with proper styling', () => {
      const error = new Error('Task PROJ-999 not found');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-999"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
      expect(screen.getByText('Task PROJ-999 not found')).toBeInTheDocument();
      
      // Check for red styling
      const errorContainer = screen.getByText('Generation failed').closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('displays authentication error for tasks', () => {
      const error = new Error('Authentication failed');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('displays connection error for tasks', () => {
      const error = new Error('Unable to connect to Jira');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      expect(screen.getByText('Unable to connect to Jira')).toBeInTheDocument();
    });

    it('displays error icon (AlertCircle) for task errors', () => {
      const error = new Error('Generation failed for task');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      const errorContainer = screen.getByText('Generation failed').closest('.border');
      const errorIcon = errorContainer?.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('text-red-500');
    });
  });

  describe('Task Validation', () => {
    it('validates task ID format correctly', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      
      // Valid task IDs
      const validIds = ['PROJ-123', 'LTC-4261', 'ABC-1', 'TEST-9999'];
      validIds.forEach(taskId => {
        fireEvent.change(input, { target: { value: taskId } });
        expect(screen.queryByText(/Task ID must be in format/)).not.toBeInTheDocument();
      });
    });

    it('rejects invalid task ID formats', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      
      // Invalid task IDs
      const invalidIds = ['proj-123', 'PROJ123', 'PROJ-', '-123', 'invalid'];
      invalidIds.forEach(taskId => {
        fireEvent.change(input, { target: { value: taskId } });
        expect(screen.getByText('Task ID must be in format PROJECT-123 (e.g., PROJ-456)')).toBeInTheDocument();
      });
    });

    it('handles task ID with whitespace correctly', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      fireEvent.change(input, { target: { value: '  PROJ-123  ' } });

      const button = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(button);

      // Should trim and call with clean ID
      expect(mockOnGenerate).toHaveBeenCalledWith('PROJ-123');
    });
  });

  describe('Error Display Consistency', () => {
    it('displays errors in red text for both stories and tasks', () => {
      const error = new Error('Test error');
      
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="story"
        />
      );

      let errorContainer = screen.getByText('Generation failed').closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      errorContainer = screen.getByText('Generation failed').closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('displays error icons consistently for stories and tasks', () => {
      const error = new Error('Test error');
      
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="story"
        />
      );

      let errorIcon = screen.getByText('Generation failed').closest('.border')?.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      errorIcon = screen.getByText('Generation failed').closest('.border')?.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Edge Cases for Task Errors', () => {
    it('handles error without message for tasks', () => {
      const error = new Error();
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });

    it('handles multiple consecutive errors for tasks', () => {
      const { rerender } = render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={new Error('First error')}
          issueType="task"
        />
      );

      expect(screen.getByText('First error')).toBeInTheDocument();

      rerender(
        <GenerationForm
          selectedStoryId="PROJ-456"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={new Error('Second error')}
          issueType="task"
        />
      );

      expect(screen.getByText('Second error')).toBeInTheDocument();
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('handles very long error messages for tasks', () => {
      const longError = new Error('This is a very long error message that describes in detail what went wrong during the task generation process and provides extensive information about the failure');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={longError}
          issueType="task"
        />
      );

      expect(screen.getByText(/This is a very long error message/)).toBeInTheDocument();
    });

    it('handles special characters in task error messages', () => {
      const error = new Error('Task "PROJ-123" not found: <invalid> & [error]');
      
      render(
        <GenerationForm
          selectedStoryId="PROJ-123"
          onGenerate={mockOnGenerate}
          isGenerating={false}
          error={error}
          issueType="task"
        />
      );

      expect(screen.getByText('Task "PROJ-123" not found: <invalid> & [error]')).toBeInTheDocument();
    });
  });

  describe('Validation Error Icon for Tasks', () => {
    it('displays alert icon for invalid task ID', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      fireEvent.change(input, { target: { value: 'invalid' } });

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('does not display alert icon for valid task ID', () => {
      render(
        <GenerationForm
          onGenerate={mockOnGenerate}
          isGenerating={false}
          issueType="task"
        />
      );

      const input = screen.getByLabelText('Jira Task ID');
      fireEvent.change(input, { target: { value: 'PROJ-123' } });

      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });
  });
});
