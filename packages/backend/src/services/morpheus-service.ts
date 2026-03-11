/**
 * Morpheus MCP service for codebase context extraction
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { CodebaseContext } from '@jira2test/shared';
import type { 
  MorpheusConfig, 
  MorpheusContextRequest 
} from '../validation/morpheus-schemas.js';
import { morpheusContextResponseSchema } from '../validation/morpheus-schemas.js';

export class MorpheusService {
  private client: AxiosInstance;
  private config: MorpheusConfig;

  constructor(config: MorpheusConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Extract codebase context from issue details (story or task)
   */
  async getCodebaseContext(issueDetails: {
    id: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    status: string;
    assignee: string;
  }): Promise<CodebaseContext> {
    try {
      const keywords = this.extractKeywords(`${issueDetails.title} ${issueDetails.description} ${issueDetails.acceptanceCriteria.join(' ')}`);
      
      const request: MorpheusContextRequest = {
        storyId: issueDetails.id,
        keywords,
        contextTypes: ['entities', 'workflows', 'businessRules', 'apiEndpoints', 'uiComponents'],
      };

      const response = await this.client.post('/api/context/extract', request);
      
      // Validate response structure
      const validatedResponse = morpheusContextResponseSchema.parse(response.data);
      
      return validatedResponse.context;
    } catch (error) {
      // Temporarily return empty context if Morpheus is unavailable
      // TODO: Integrate with Morpheus MCP tools properly
      console.warn('Morpheus service unavailable, returning empty context:', this.getErrorMessage(error));
      
      return {
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      };
    }
  }

  /**
   * Extract meaningful keywords from text
   */
  extractKeywords(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
      'above', 'below', 'between', 'among', 'can', 'could', 'should', 'would', 'will',
      'shall', 'may', 'might', 'must', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'get', 'got', 'make', 'made', 'take',
      'taken', 'go', 'went', 'come', 'came', 'see', 'saw', 'know', 'knew', 'think',
      'thought', 'say', 'said', 'tell', 'told', 'ask', 'asked', 'work', 'worked',
      'seem', 'seemed', 'feel', 'felt', 'try', 'tried', 'leave', 'left', 'call', 'called'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 2) // Filter out very short words
      .filter(word => !stopWords.has(word)) // Filter out stop words
      .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof AxiosError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null) {
      if (error.message) {
        return error.message;
      }
      if (error.code) {
        return error.code;
      }
    }
    return String(error);
  }
}