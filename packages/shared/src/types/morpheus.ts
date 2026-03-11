/**
 * Morpheus MCP integration models for codebase context
 */

export interface CodebaseContext {
  entities: string[];
  workflows: string[];
  businessRules: string[];
  apiEndpoints: string[];
  uiComponents: string[];
}

export interface MorpheusConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}