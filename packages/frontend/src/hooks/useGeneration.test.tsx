import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGeneration } from './useGeneration';
import { api } from '../lib/api';
import type { GenerateRequest, GenerateResponse, ApiResponse } from '../types';

// Mock the api module
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

const mockApi = vi.mocked(api);

describe('useGeneration', () => {
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

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should successfully unwrap API response', async () => {
    const mockRequest: GenerateRequest = { storyId: 'TEST-123' };
    const mockGenerateResponse: GenerateResponse = {
      featureFile: {
        feature: {
          title: 'Test Feature',
          description: ['Test description'],
          tags: [],
        },
        scenarios: [],
        metadata: {
          storyId: 'TEST-123',
          generatedAt: new Date(),
          version: '1.0',
        },
      },
      syncResults: {
        rowsAdded: 0,
        rowsSkipped: 0,
        scenarios: [],
      },
    };

    const mockApiResponse: ApiResponse<GenerateResponse> = {
      success: true,
      data: mockGenerateResponse,
    };

    mockApi.post.mockResolvedValueOnce({ data: mockApiResponse });

    const { result } = renderHook(() => useGeneration(), { wrapper });

    result.current.mutate(mockRequest);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockGenerateResponse);
    expect(mockApi.post).toHaveBeenCalledWith('/generate', mockRequest);
  });

  it('should handle API error response', async () => {
    const mockRequest: GenerateRequest = { storyId: 'TEST-123' };
    const mockErrorResponse: ApiResponse<GenerateResponse> = {
      success: false,
      error: 'Story not found',
      message: 'Story TEST-123 does not exist in Jira',
    };

    mockApi.post.mockResolvedValueOnce({ data: mockErrorResponse });

    const { result } = renderHook(() => useGeneration(), { wrapper });

    result.current.mutate(mockRequest);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Story TEST-123 does not exist in Jira');
  });

  it('should handle missing data in success response', async () => {
    const mockRequest: GenerateRequest = { storyId: 'TEST-123' };
    const mockErrorResponse: ApiResponse<GenerateResponse> = {
      success: true,
      // Missing data field
    };

    mockApi.post.mockResolvedValueOnce({ data: mockErrorResponse });

    const { result } = renderHook(() => useGeneration(), { wrapper });

    result.current.mutate(mockRequest);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Generation failed');
  });
});