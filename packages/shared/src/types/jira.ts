/**
 * Jira integration models for story data and API responses
 */

export interface JiraStory {
  id: string;
  title: string;
  status: JiraStoryStatus;
  assignee: string;
  description?: string;
}

export type JiraStoryStatus = 'To Do' | 'In Progress' | 'Ready for QA' | 'Done';

export interface StoryDetails {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: string;
  assignee: string;
}

export interface StoryFilters {
  status?: JiraStoryStatus | 'All';
  search?: string;
}

export interface JiraConfig {
  baseUrl: string;
  username: string;
  apiToken: string;
  boardId: string;
}