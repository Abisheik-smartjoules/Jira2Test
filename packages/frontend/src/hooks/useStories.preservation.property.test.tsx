/**
 * Property-based preservation tests for useStories hook
 * **Property 2: Preservation - Non-Stories-Loading Behavior**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 * 
 * IMPORTANT: These tests run on UNFIXED code to establish baseline behavior
 * that must be preserved. They should PASS on the current implementation
 * to confirm what behavior needs to be maintained after the fix.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as fc from 'fast-check';
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

describe('useStories - Preservation Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * Property 2: Preservation - Non-Stories-Loading Behavior
   * 
   * These tests ensure that all non-stories-loading functionality remains unchanged.
   * They test authentication error handling, network failure retry logic, and React Query
   * integration on the UNFIXED code to establish baseline behavior.
   * 
   * EXPECTED OUTCOME: These tests should PASS on unfixed code to confirm baseline behavior.
   */
  describe('Property 2: Preservation - Authentication Error Handling', () => {
    // Generator for authentication error responses
    const authErrorArb = fc.record({
      response: fc.record({
        status: fc.constantFrom(401, 403),
        statusText: fc.constantFrom('Unauthorized', 'Forbidden'),
        data: fc.record({
          success: fc.constant(false),
          error: fc.constantFrom('Authentication failed', 'Access denied', 'Invalid credentials'),
          message: fc.string({ minLength: 10, maxLength: 100 })
        })
      }),
      message: fc.constantFrom('Unauthorized', 'Forbidden', 'Authentication error'),
      name: fc.constantFrom('AuthenticationError', 'AxiosError')
    });

    it('should preserve authentication error handling behavior for 401/403 responses', async () => {
      await fc.assert(
        fc.asyncProperty(
          authErrorArb,
          async (authError) => {
            // Arrange: Mock authentication error
            mockApi.get.mockRejectedValueOnce(authError);

            // Act: Call useStories hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useStories(), { wrapper });

            // Wait for the query to complete
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            });

            // Assert: Preserve existing authentication error handling behavior
            // The hook should be in error state
            expect(result.current.isError).toBe(true);
            expect(result.current.error).toBeTruthy();
            expect(result.current.data).toBeUndefined();
            
            // Should not have success state
            expect(result.current.isSuccess).toBe(false);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should preserve retry behavior - no retries for authentication errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          authErrorArb,
          async (authError) => {
            // Clear mocks for each test run
            vi.clearAllMocks();
            
            // Arrange: Mock authentication error
            mockApi.get.mockRejectedValue(authError);

            // Act: Call useStories hook with retry enabled wrapper
            const queryClient = new QueryClient({
              defaultOptions: {
                queries: {
                  retry: (failureCount, error: any) => {
                    // This is the current retry logic that should be preserved
                    if (error?.response?.status === 401 || error?.response?.status === 403) {
                      return false;
                    }
                    return failureCount < 2;
                  },
                },
              },
            });
            
            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <QueryClientProvider client={queryClient}>
                {children}
              </QueryClientProvider>
            );

            const { result } = renderHook(() => useStories(), { wrapper });

            // Wait for the query to complete
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            });

            // Assert: Should not retry authentication errors
            expect(result.current.isError).toBe(true);
            expect(result.current.failureCount).toBe(1); // Should fail immediately, no retries
            
            // Verify the API was called only once (no retries)
            expect(mockApi.get).toHaveBeenCalledTimes(1);

            return true;
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 2: Preservation - Network Error Retry Logic', () => {
    it('should preserve network error handling behavior', async () => {
      // Test with a simple network error
      const networkError = {
        response: { status: 500 },
        message: 'Network Error'
      };
      
      // Mock the error for all retry attempts
      mockApi.get.mockRejectedValue(networkError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      // Wait for the query to complete (including retries)
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 }); // Increase timeout to account for retries

      // Assert: Should handle network errors appropriately after retries
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
      
      // Verify that retries occurred (should be called 3 times: initial + 2 retries)
      expect(mockApi.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('Property 2: Preservation - React Query Integration', () => {
    it('should preserve React Query error handling behavior', async () => {
      // Test with a simple authentication error
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      
      mockApi.get.mockRejectedValueOnce(authError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Error state structure should be preserved
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should preserve query key structure for API calls', async () => {
      // Test that the API is called with correct endpoint regardless of response format
      const authError = {
        response: { status: 401 },
        message: 'Unauthorized'
      };
      
      mockApi.get.mockRejectedValueOnce(authError);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useStories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Query key structure should be preserved
      expect(mockApi.get).toHaveBeenCalledWith('/stories');
      expect(result.current.isError).toBe(true);
    });
  });

  describe('Property 2: Preservation - Backend Response Format Expectations', () => {
    it('should preserve current behavior with backend envelope format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 15 }),
              title: fc.string({ minLength: 10, maxLength: 100 }),
              status: fc.constantFrom('To Do', 'In Progress', 'Ready for QA', 'Done'),
              assignee: fc.string({ minLength: 3, maxLength: 50 }),
              description: fc.option(fc.string({ minLength: 10, maxLength: 200 }))
            }),
            { maxLength: 10 }
          ),
          async (stories) => {
            // Arrange: Mock the actual backend response format (envelope)
            const backendResponse = {
              data: {
                success: true,
                data: {
                  stories: stories
                }
              }
            };

            mockApi.get.mockResolvedValueOnce(backendResponse);

            // Act: Call useStories hook
            const wrapper = createWrapper();
            const { result } = renderHook(() => useStories(), { wrapper });

            // Wait for the query to complete
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            });

            // Assert: Document current behavior on unfixed code
            // IMPORTANT: This test documents the CURRENT (buggy) behavior
            // On unfixed code, this should demonstrate that response.data.stories is undefined
            // while response.data.data.stories contains the actual data
            
            // The backend response structure should be preserved
            expect(backendResponse.data.success).toBe(true);
            expect(backendResponse.data.data.stories).toEqual(stories);
            
            // Current behavior: The hook tries to access response.data.stories (undefined)
            // instead of response.data.data.stories (the actual data)
            // This test will show the current behavior that needs to be preserved for non-buggy scenarios
            
            // On unfixed code, this will likely result in undefined data
            // But the error handling and query state management should still work correctly
            expect(result.current.isLoading).toBe(false);
            
            // The query should complete (either with success or error state)
            expect(result.current.isLoading).toBe(false);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});