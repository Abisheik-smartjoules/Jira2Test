/**
 * API request/response models and common types
 */

import { JiraStory } from './jira.js';
import { FeatureFile } from './gherkin.js';
import { SyncResults } from './sheets.js';

// API Response envelope pattern
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Generation status tracking
export interface GenerationStatus {
  step: GenerationStep;
  message: string;
  error?: string;
}

export type GenerationStep = 
  | 'idle' 
  | 'fetching' 
  | 'context' 
  | 'generating' 
  | 'syncing' 
  | 'complete' 
  | 'error';

// API endpoint request/response types
export interface GetStoriesResponse {
  stories: JiraStory[];
}

export interface GenerateRequest {
  storyId: string;
}

export interface GenerateResponse {
  featureFile: FeatureFile;
  syncResults: SyncResults;
}

// Error types
export interface ApiError {
  type: ErrorType;
  message: string;
  details?: string;
  recoverable: boolean;
}

export type ErrorType = 'validation' | 'network' | 'server' | 'integration';