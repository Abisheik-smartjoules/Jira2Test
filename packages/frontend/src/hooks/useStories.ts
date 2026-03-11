import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { GetStoriesResponse, ApiResponse } from '../types';

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: async (): Promise<GetStoriesResponse['stories']> => {
      const response = await api.get<ApiResponse<GetStoriesResponse>>('/stories');
      
      // Check if the response indicates success
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || response.data.error || 'Failed to fetch stories');
      }
      
      return response.data.data.stories || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
}