import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { GenerateRequest, GenerateResponse, ApiResponse } from '../types';

export function useGeneration() {
  return useMutation({
    mutationFn: async (request: GenerateRequest): Promise<GenerateResponse> => {
      const response = await api.post<ApiResponse<GenerateResponse>>('/generate', request);
      
      // Check if the response indicates success
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || response.data.error || 'Generation failed');
      }
      
      return response.data.data;
    },
    retry: false, // Don't retry generation requests
  });
}