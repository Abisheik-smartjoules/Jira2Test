import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStories } from './useStories';
import { api } from '../lib/api';
import type { JiraStory } from '../types';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn()
  }
}));

const mockApi = vi.mocked(api);

// Test wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useStories - Bug Condition Exploration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * Property 1: Fault Condition - Stories Data Extraction Bug
   * 
   * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
   * 
   * This test encodes the expected behavior - it will validate the fix when it passes after implementation.
   * The test demonstrates that useStories hook fails to extract stories from backend response format 
   * `{ success: true, data: { stories: [...] } }` because it tries to access `response.data.stories` 
   * instead of `response.data.data.stories`.
   */
  describe('Property 1: Fault Condition - Stories Data Extraction Bug', () => {
    it('should successfully extract stories from nested backend response structure', async () => {
      // Arrange: Mock the actual backend response format
      const mockStories: JiraStory[] = [
        {
          id: 'PROJ-123',
          title: 'Test Story 1',
          status: 'To Do',
          assignee: 'John Doe',
          description: 'Test description'
        },
        {
          id: 'PROJ-124', 
          title: 'Test Story 2',
          status: 'In Progress',
          assignee: 'Jane Smith'
        }
      ];

      // Mock the backend response format: { success: true, data: { stories: [...] } }
      const backendResponse = {
        data: {
          success: true,
          data: {
            stories: mockStories
          }
        }
      };

      mockApi.get.mockResolvedValueOnce(backendResponse);

      // Act: Call the useStories hook
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      // Wait for the query to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert: The hook should successfully extract the stories array
      // EXPECTED BEHAVIOR: This should pass after the fix is implemented
      // CURRENT BEHAVIOR: This will FAIL because useStories tries to access response.data.stories (undefined)
      // instead of response.data.data.stories (the actual stories array)
      expect(result.current.data).toEqual(mockStories);
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]).toEqual(mockStories[0]);
      expect(result.current.data?.[1]).toEqual(mockStories[1]);
    });

    it('should handle empty stories array from nested response structure', async () => {
      // Arrange: Mock backend response with empty stories array
      const backendResponse = {
        data: {
          success: true,
          data: {
            stories: []
          }
        }
      };

      mockApi.get.mockResolvedValueOnce(backendResponse);

      // Act
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert: Should return empty array, not undefined
      // EXPECTED BEHAVIOR: This should pass after the fix
      // CURRENT BEHAVIOR: This will FAIL because response.data.stories is undefined
      expect(result.current.data).toEqual([]);
      expect(result.current.data).toHaveLength(0);
    });

    it('should demonstrate the bug condition: response.data.stories is undefined while response.data.data.stories contains data', async () => {
      // Arrange: Create a response that demonstrates the exact bug condition
      const mockStories: JiraStory[] = [
        {
          id: 'BUG-001',
          title: 'Bug Demonstration Story',
          status: 'To Do',
          assignee: 'Bug Hunter'
        }
      ];

      const backendResponse = {
        data: {
          success: true,
          data: {
            stories: mockStories
          }
        }
      };

      mockApi.get.mockResolvedValueOnce(backendResponse);

      // Act
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Demonstrate the bug condition
      // The backend response has stories at response.data.data.stories
      expect(backendResponse.data.data.stories).toBeDefined();
      expect(backendResponse.data.data.stories).toHaveLength(1);
      
      // But response.data.stories is undefined (this is the bug condition)
      expect((backendResponse.data as any).stories).toBeUndefined();

      // EXPECTED BEHAVIOR: useStories should return the stories array
      // CURRENT BEHAVIOR: useStories will return undefined because it accesses the wrong path
      // This assertion will FAIL on unfixed code, confirming the bug exists
      expect(result.current.data).toEqual(mockStories);
      expect(result.current.data).not.toBeUndefined();
    });

    it('should handle multiple stories from nested response structure', async () => {
      // Arrange: Test with multiple stories to ensure array handling works correctly
      const mockStories: JiraStory[] = Array.from({ length: 5 }, (_, i) => ({
        id: `PROJ-${100 + i}`,
        title: `Story ${i + 1}`,
        status: ['To Do', 'In Progress', 'Ready for QA', 'Done'][i % 4] as JiraStory['status'],
        assignee: `User ${i + 1}`,
        description: `Description for story ${i + 1}`
      }));

      const backendResponse = {
        data: {
          success: true,
          data: {
            stories: mockStories
          }
        }
      };

      mockApi.get.mockResolvedValueOnce(backendResponse);

      // Act
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Assert: Should correctly extract all stories
      // EXPECTED BEHAVIOR: This should pass after the fix
      // CURRENT BEHAVIOR: This will FAIL because the hook returns undefined
      expect(result.current.data).toEqual(mockStories);
      expect(result.current.data).toHaveLength(5);
      
      // Verify each story is correctly extracted
      mockStories.forEach((expectedStory, index) => {
        expect(result.current.data?.[index]).toEqual(expectedStory);
      });
    });
  });

  describe('Preservation Tests - Existing Error Handling', () => {
    it('should preserve authentication error handling (401)', async () => {
      // Arrange: Mock 401 authentication error
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      
      mockApi.get.mockRejectedValueOnce(authError);

      // Act
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert: Should preserve existing error handling behavior
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should preserve authentication error handling (403)', async () => {
      // Arrange: Mock 403 forbidden error
      const forbiddenError = {
        response: { status: 403 },
        message: 'Forbidden'
      };
      
      mockApi.get.mockRejectedValueOnce(forbiddenError);

      // Act
      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Assert: Should preserve existing error handling behavior
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('should preserve network error retry behavior', async () => {
      // Arrange: Mock network error that should trigger error state
      const networkError = {
        response: { status: 500 },
        message: 'Network error'
      };
      
      mockApi.get.mockRejectedValue(networkError);

      // Create a wrapper with retry explicitly disabled
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            retryDelay: 0,
          },
        },
      });
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // Act
      const { result } = renderHook(() => useStories(), { wrapper });

      // Assert: Should go into error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      }, { timeout: 4000 });

      expect(result.current.error).toBeTruthy();
    });
  });
});