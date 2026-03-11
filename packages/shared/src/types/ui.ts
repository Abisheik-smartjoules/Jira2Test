/**
 * UI component props and state models
 */

import { JiraStory, StoryFilters } from './jira.js';
import { FeatureFile } from './gherkin.js';
import { SyncResults } from './sheets.js';
import { GenerationStatus } from './api.js';

// Component props interfaces
export interface StoryBoardProps {
  stories: JiraStory[];
  onStorySelect: (storyId: string) => void;
  filters: StoryFilters;
  onFilterChange: (filters: StoryFilters) => void;
  loading?: boolean;
}

export interface GenerationFormProps {
  selectedStoryId?: string;
  onGenerate: (storyId: string) => void;
  isGenerating: boolean;
  generationStatus: GenerationStatus;
}

export interface ResultsDisplayProps {
  featureFile: FeatureFile;
  syncResults: SyncResults;
  onDownload: () => void;
}

// UI state models
export interface AppState {
  stories: JiraStory[];
  selectedStoryId?: string;
  filters: StoryFilters;
  generationStatus: GenerationStatus;
  featureFile?: FeatureFile;
  syncResults?: SyncResults;
  loading: boolean;
  error?: string;
}