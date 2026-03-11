import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { JiraIssue, IssueType, ApiResponse } from '../types';

interface GetIssuesResponse {
  stories?: JiraIssue[];
  tasks?: JiraIssue[];
}

interface UseIssuesOptions {
  issueType: IssueType;
  enabled?: boolean;
}

export function useIssues({ issueType, enabled = true }: UseIssuesOptions) {
  return useQuery({
    queryKey: ['issues', issueType],
    queryFn: async (): Promise<JiraIssue[]> => {
      // Determine endpoint based on issue type
      const endpoint = issueType === 'story' ? '/stories' : '/tasks';
      
      const response = await api.get<ApiResponse<GetIssuesResponse>>(endpoint);
      
      // Check if the response indicates success
      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || 
          response.data.error || 
          `Failed to fetch ${issueType === 'story' ? 'stories' : 'tasks'}`
        );
      }
      
      // Extract issues from response based on issue type
      const issues = issueType === 'story' 
        ? response.data.data.stories 
        : response.data.data.tasks;
      
      return issues || [];
    },
    enabled,
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
