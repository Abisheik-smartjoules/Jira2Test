import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HomePage } from './HomePage';
import type { GenerateResponse } from '../types';

// Mock hooks
const mockUseIssues = vi.fn();
const mockUseGeneration = vi.fn();

vi.mock('../hooks/useIssues', () => ({
  useIssues: () => mockUseIssues()
}));

vi.mock('../hooks/useGeneration', () => ({
  useGeneration: () => mockUseGeneration()
}));

// Mock window.open
const mockWindowOpen = vi.fn();
global.window.open = mockWindowOpen;

describe('HomePage - Download Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
  });

  describe('Download with Task IDs', () => {
    it('should trigger download with correct task ID in URL', async () => {
      const taskId = 'TASK-456';
      const mockGenerateResponse: GenerateResponse = {
        featureFile: {
          feature: {
            title: 'Implement User Dashboard',
            description: ['Task description'],
            tags: ['@task']
          },
          scenarios: [
            {
              id: 'scenario-1',
              title: 'Dashboard displays data',
              tags: ['@happy', '@TASK-456'],
              acReference: 'AC-1',
              type: 'happy',
              steps: [
                { keyword: 'Given', text: 'user is logged in' },
                { keyword: 'When', text: 'user views dashboard' },
                { keyword: 'Then', text: 'data is displayed' }
              ]
            }
          ],
          metadata: {
            storyId: taskId,
            generatedAt: new Date('2024-01-15T10:00:00Z'),
            version: '1.0'
          }
        },
        syncResults: {
          rowsAdded: 1,
          rowsSkipped: 0,
          scenarios: [
            {
              testCaseId: 'TASK-456-TC-01',
              scenarioTitle: 'Dashboard displays data',
              tags: '@happy @TASK-456',
              acReference: 'AC-1',
              status: 'Not Executed'
            }
          ]
        }
      };

      // Mock successful generation
      const mockMutate = vi.fn((params, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(mockGenerateResponse);
        }
      });

      mockUseIssues.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      mockUseGeneration.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<HomePage />);

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Generate Gherkin Feature Files')).toBeInTheDocument();
      });

      // Simulate generation by calling the mutate function
      const generateButton = screen.getByRole('button', { name: /generate feature file/i });
      
      // Enter task ID
      const input = screen.getByPlaceholderText('e.g., PROJ-123');
      fireEvent.change(input, { target: { value: taskId } });
      
      // Click generate
      fireEvent.click(generateButton);

      // Wait for results to appear
      await waitFor(() => {
        expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      });

      // Click download button
      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      fireEvent.click(downloadButton);

      // Verify window.open was called with correct task ID
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining(`/api/download/${taskId}`),
        '_blank'
      );
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('implement-user-dashboard'),
        '_blank'
      );
    });

    it('should generate correct filename for task download', async () => {
      const taskId = 'LTC-789';
      const mockGenerateResponse: GenerateResponse = {
        featureFile: {
          feature: {
            title: 'Fix Bug: User Login Issue',
            description: [],
            tags: ['@bugfix']
          },
          scenarios: [],
          metadata: {
            storyId: taskId,
            generatedAt: new Date(),
            version: '1.0'
          }
        },
        syncResults: {
          rowsAdded: 0,
          rowsSkipped: 0,
          scenarios: []
        }
      };

      const mockMutate = vi.fn((params, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(mockGenerateResponse);
        }
      });

      mockUseIssues.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      mockUseGeneration.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Generate Gherkin Feature Files')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('e.g., PROJ-123');
      fireEvent.change(input, { target: { value: taskId } });
      
      const generateButton = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      fireEvent.click(downloadButton);

      // Verify filename is generated correctly with task ID
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining(`${taskId}_fix-bug-user-login-issue`),
        '_blank'
      );
    });

    it('should handle special characters in task feature title for download', async () => {
      const taskId = 'PROJ-111';
      const mockGenerateResponse: GenerateResponse = {
        featureFile: {
          feature: {
            title: 'User\'s "Special" Feature & More!',
            description: [],
            tags: []
          },
          scenarios: [],
          metadata: {
            storyId: taskId,
            generatedAt: new Date(),
            version: '1.0'
          }
        },
        syncResults: {
          rowsAdded: 0,
          rowsSkipped: 0,
          scenarios: []
        }
      };

      const mockMutate = vi.fn((params, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(mockGenerateResponse);
        }
      });

      mockUseIssues.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      mockUseGeneration.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Generate Gherkin Feature Files')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('e.g., PROJ-123');
      fireEvent.change(input, { target: { value: taskId } });
      
      const generateButton = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      });

      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      fireEvent.click(downloadButton);

      // Verify special characters are sanitized in filename
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining(`${taskId}_user-s-special-feature-more`),
        '_blank'
      );
    });

    it('should work identically for stories and tasks', async () => {
      const storyId = 'STORY-123';
      const taskId = 'TASK-456';

      const createMockResponse = (issueId: string): GenerateResponse => ({
        featureFile: {
          feature: {
            title: 'Test Feature',
            description: [],
            tags: []
          },
          scenarios: [],
          metadata: {
            storyId: issueId,
            generatedAt: new Date(),
            version: '1.0'
          }
        },
        syncResults: {
          rowsAdded: 0,
          rowsSkipped: 0,
          scenarios: []
        }
      });

      // Test with story
      const mockMutateStory = vi.fn((params, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(createMockResponse(storyId));
        }
      });

      mockUseIssues.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      mockUseGeneration.mockReturnValue({
        mutate: mockMutateStory,
        isPending: false,
        error: null
      });

      const { unmount } = render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Generate Gherkin Feature Files')).toBeInTheDocument();
      });

      let input = screen.getByPlaceholderText('e.g., PROJ-123');
      fireEvent.change(input, { target: { value: storyId } });
      
      let generateButton = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      });

      let downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      fireEvent.click(downloadButton);

      const storyDownloadCall = mockWindowOpen.mock.calls[0][0];
      expect(storyDownloadCall).toContain(`/api/download/${storyId}`);

      // Clean up and test with task
      unmount();
      mockWindowOpen.mockClear();

      const mockMutateTask = vi.fn((params, callbacks) => {
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(createMockResponse(taskId));
        }
      });

      mockUseGeneration.mockReturnValue({
        mutate: mockMutateTask,
        isPending: false,
        error: null
      });

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('Generate Gherkin Feature Files')).toBeInTheDocument();
      });

      input = screen.getByPlaceholderText('e.g., PROJ-123');
      fireEvent.change(input, { target: { value: taskId } });
      
      generateButton = screen.getByRole('button', { name: /generate feature file/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      });

      downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      fireEvent.click(downloadButton);

      const taskDownloadCall = mockWindowOpen.mock.calls[0][0];
      expect(taskDownloadCall).toContain(`/api/download/${taskId}`);

      // Both should use the same URL pattern
      expect(storyDownloadCall.split('/').slice(0, -1).join('/')).toBe(
        taskDownloadCall.split('/').slice(0, -1).join('/')
      );
    });
  });
});
