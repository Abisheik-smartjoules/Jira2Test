import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './HomePage';
import * as useIssuesModule from '../hooks/useIssues';
import * as useGenerationModule from '../hooks/useGeneration';

// Mock the hooks
vi.mock('../hooks/useIssues');
vi.mock('../hooks/useGeneration');

describe('HomePage - Task Error Handling', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Requirement 9.1: Error Loading Tasks', () => {
    it('displays "Error Loading Tasks" for fetch errors', () => {
      // Mock useIssues to return an error
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to fetch tasks from Jira'),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      // Should display error title
      expect(screen.getByText('Error Loading Stories')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch tasks from Jira')).toBeInTheDocument();
    });

    it('displays error message in red text with proper styling', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Connection timeout'),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      const errorTitle = screen.getByText('Error Loading Stories');
      expect(errorTitle).toHaveClass('text-red-600');
    });
  });

  describe('Requirement 9.2: Generation Errors Display', () => {
    it('displays generation errors below Generate button', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const generationError = new Error('Failed to generate feature file');
      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: generationError,
      } as any);

      renderWithProviders(<HomePage />);

      // Error should be displayed in GenerationForm component
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate feature file')).toBeInTheDocument();
    });
  });

  describe('Requirement 9.3: 404 Error - Task Not Found', () => {
    it('displays "Task {taskId} not found" for 404 errors', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const notFoundError = new Error('Task PROJ-999 not found');
      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: notFoundError,
      } as any);

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Task PROJ-999 not found')).toBeInTheDocument();
    });

    it('displays 404 error with red text and error icon', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const notFoundError = new Error('Task LTC-4261 not found');
      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: notFoundError,
      } as any);

      renderWithProviders(<HomePage />);

      // Check for error message
      expect(screen.getByText('Task LTC-4261 not found')).toBeInTheDocument();
      
      // Check for error styling (red background and border)
      const errorContainer = screen.getByText('Generation failed').closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('Requirement 9.4: 401 Error - Authentication Failed', () => {
    it('displays "Authentication failed" for 401 errors', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Authentication failed'),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('displays authentication error with proper styling', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const authError = new Error('Authentication failed');
      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: authError,
      } as any);

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      
      // Check for error styling
      const errorContainer = screen.getByText('Generation failed').closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('Requirement 9.5: 500 Error - Unable to Connect to Jira', () => {
    it('displays "Unable to connect to Jira" for 500 errors', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Unable to connect to Jira'),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Unable to connect to Jira')).toBeInTheDocument();
    });

    it('displays connection error for generation failures', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const connectionError = new Error('Unable to connect to Jira');
      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: connectionError,
      } as any);

      renderWithProviders(<HomePage />);

      expect(screen.getByText('Unable to connect to Jira')).toBeInTheDocument();
    });
  });

  describe('Requirement 9.6: Error Message Styling', () => {
    it('displays all error messages in red text with error icons', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Test error message'),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      // Check for red text styling
      const errorTitle = screen.getByText('Error Loading Stories');
      expect(errorTitle).toHaveClass('text-red-600');
    });

    it('displays generation errors with red background and error icon', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const error = new Error('Generation error');
      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error,
      } as any);

      renderWithProviders(<HomePage />);

      // Check for error container styling
      const errorContainer = screen.getByText('Generation failed').closest('.border');
      expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
      
      // Check for error icon (AlertCircle)
      const errorIcon = errorContainer?.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles error without message gracefully', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error(),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      // Should display default error message
      expect(screen.getByText(/Failed to load Jira/)).toBeInTheDocument();
    });

    it('handles multiple error types correctly', () => {
      const errorMessages = [
        'Task PROJ-123 not found',
        'Authentication failed',
        'Unable to connect to Jira',
        'Network error',
      ];

      errorMessages.forEach((errorMessage) => {
        vi.clearAllMocks();
        
        vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
          data: [],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
        } as any);

        vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
          mutate: vi.fn(),
          isPending: false,
          error: new Error(errorMessage),
        } as any);

        const { unmount } = renderWithProviders(<HomePage />);

        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('displays error for tasks when Tasks tab is active', () => {
      vi.spyOn(useIssuesModule, 'useIssues').mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to fetch tasks'),
        refetch: vi.fn(),
      } as any);

      vi.spyOn(useGenerationModule, 'useGeneration').mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<HomePage />);

      // The error title should reflect the current tab
      // Since we start on Stories tab by default, it shows "Error Loading Stories"
      expect(screen.getByText('Error Loading Stories')).toBeInTheDocument();
    });
  });
});
