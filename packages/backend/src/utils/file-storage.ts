/**
 * Simple in-memory file storage for feature files
 * In production, this would be replaced with persistent storage
 */

import { FeatureFile } from '../validation/gherkin-schemas.js';
import { GherkinFormatter } from '../services/gherkin-formatter.js';

// In-memory storage for generated feature files
const featureFileStorage = new Map<string, string>();

/**
 * Store a feature file for later download
 */
export function storeFeatureFile(storyId: string, featureFile: FeatureFile): void {
  const formatter = new GherkinFormatter();
  const content = formatter.format(featureFile);
  featureFileStorage.set(storyId, content);
}

/**
 * Retrieve a stored feature file
 */
export function getFeatureFile(storyId: string): string {
  const content = featureFileStorage.get(storyId);
  if (!content) {
    const error = new Error('Feature file not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return content;
}

/**
 * Check if a feature file exists
 */
export function hasFeatureFile(storyId: string): boolean {
  return featureFileStorage.has(storyId);
}

/**
 * Clear all stored feature files (for testing)
 */
export function clearFeatureFiles(): void {
  featureFileStorage.clear();
}