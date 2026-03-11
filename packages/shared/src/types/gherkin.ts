/**
 * Core Gherkin domain models for feature file generation and parsing
 */

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
  acReference: string; // e.g., "AC-1"
  type: ScenarioType;
  steps: Step[];
  examples?: ExamplesTable;
  assumptions?: string[];
}

export type ScenarioType = 'happy' | 'negative' | 'edge';

export interface Step {
  keyword: StepKeyword;
  text: string;
}

export type StepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But';

export interface ExamplesTable {
  headers: string[];
  rows: string[][];
}

export interface FileMetadata {
  storyId: string;
  generatedAt: Date;
  version: string;
}