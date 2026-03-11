// Core domain types
export type IssueType = 'story' | 'task';

export interface JiraIssue {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Ready for QA' | 'Done';
  assignee: string;
  description?: string;
  issueType: IssueType;
}

// Type aliases for specific issue types
export type JiraStory = JiraIssue & { issueType: 'story' };
export type JiraTask = JiraIssue & { issueType: 'task' };

export interface IssueDetails {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: string;
  assignee: string;
  issueType: IssueType;
}

// Type aliases for specific issue detail types
export type StoryDetails = IssueDetails & { issueType: 'story' };
export type TaskDetails = IssueDetails & { issueType: 'task' };

export interface FeatureFile {
  feature: Feature;
  scenarios: Scenario[];
  metadata: FileMetadata;
}

export interface Feature {
  title: string;
  description: string[];
  tags: string[];
}

export interface Scenario {
  id: string;
  title: string;
  tags: string[];
  acReference: string;
  type: 'happy' | 'negative' | 'edge';
  steps: Step[];
  examples?: ExamplesTable;
  assumptions?: string[];
}

export interface Step {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  text: string;
}

export interface ExamplesTable {
  headers: string[];
  rows: string[][];
}

export interface FileMetadata {
  storyId: string;
  generatedAt: Date;
  version: string;
}

export interface SyncResults {
  rowsAdded: number;
  rowsSkipped: number;
  scenarios: ScenarioSummary[];
}

export interface ScenarioSummary {
  testCaseId: string;
  scenarioTitle: string;
  tags: string;
  acReference: string;
  status: string;
}

// UI state types
export interface IssueFilters {
  status: 'All' | 'To Do' | 'In Progress' | 'Ready for QA';
  search: string;
  assignees: string[]; // Changed to array for multi-select
}

// Backward compatibility alias
export type StoryFilters = IssueFilters;

export interface GenerationStatus {
  step: 'idle' | 'fetching' | 'context' | 'generating' | 'syncing' | 'complete' | 'error';
  message: string;
  error?: string;
}

export interface ErrorState {
  type: 'validation' | 'network' | 'server' | 'integration';
  message: string;
  details?: string;
  recoverable: boolean;
}

// API types
export interface GetStoriesResponse {
  stories: JiraStory[];
}

export interface GenerateRequest {
  issueId: string;
  issueType: IssueType;
  // Backward compatibility - storyId is deprecated but still supported
  storyId?: string;
}

export interface GenerateResponse {
  featureFile: FeatureFile;
  syncResults: SyncResults;
}

// API envelope types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}