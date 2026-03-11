/**
 * Jira API service for fetching story data
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { 
  JiraConfig, 
  JiraStory, 
  StoryDetails, 
  JiraTask,
  TaskDetails,
  JiraIssue 
} from '../validation/jira-schemas.js';
import { jiraSearchResponseSchema, jiraIssueSchema } from '../validation/jira-schemas.js';

export class JiraService {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000, // 30 second timeout
      auth: {
        username: config.username,
        password: config.apiToken,
      },
    });
  }

  /**
   * Fetch stories from the configured Jira board
   */
  async getStoriesFromBoard(startAt = 0, maxResults = 50): Promise<JiraStory[]> {
    return this.getIssuesFromBoard('Story', startAt, maxResults) as Promise<JiraStory[]>;
  }

  /**
   * Fetch tasks from the configured Jira board
   */
  async getTasksFromBoard(startAt = 0, maxResults = 50): Promise<JiraTask[]> {
    return this.getIssuesFromBoard('Task', startAt, maxResults) as Promise<JiraTask[]>;
  }

  /**
   * Generic method to fetch issues by type from the configured Jira board
   */
  private async getIssuesFromBoard(
    issueType: 'Story' | 'Task',
    startAt = 0,
    maxResults = 50
  ): Promise<JiraStory[] | JiraTask[]> {
    try {
      // Use Agile API to get issues from the board with JQL filter for issue type
      const response = await this.client.get(`/rest/agile/1.0/board/${this.config.boardId}/issue`, {
        params: {
          startAt,
          maxResults,
          jql: `type = ${issueType}`,
          fields: 'summary,description,status,assignee',
        },
      });

      // Validate response structure - Agile API returns issues in a different format
      const validatedResponse = jiraSearchResponseSchema.parse(response.data);
      
      if (issueType === 'Story') {
        return this.transformJiraIssuesToStories(validatedResponse.issues);
      } else {
        return this.transformJiraIssuesToTasks(validatedResponse.issues);
      }
    } catch (error) {
      if (this.isRateLimitError(error)) {
        return this.handleRateLimit(error, () => this.getIssuesFromBoard(issueType, startAt, maxResults));
      }
      const issueTypePlural = issueType === 'Story' ? 'stories' : 'tasks';
      throw new Error(`Failed to fetch ${issueTypePlural} from Jira: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch detailed information for a specific story
   */
  async getStoryDetails(storyId: string): Promise<StoryDetails> {
    try {
      const response = await this.client.get(`/rest/api/3/issue/${storyId}`, {
        params: {
          fields: 'summary,description,status,assignee,customfield_10000',
        },
      });

      // Validate response structure
      const validatedIssue = jiraIssueSchema.parse(response.data);
      
      return this.transformJiraIssueToStoryDetails(validatedIssue);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(`Story ${storyId} not found`);
      }
      if (this.isRateLimitError(error)) {
        return this.handleRateLimit(error, () => this.getStoryDetails(storyId));
      }
      throw new Error(`Failed to fetch story details: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Fetch detailed information for a specific task
   */
  async getTaskDetails(taskId: string): Promise<TaskDetails> {
    try {
      const response = await this.client.get(`/rest/api/3/issue/${taskId}`, {
        params: {
          fields: 'summary,description,status,assignee,customfield_10000',
        },
      });

      // Validate response structure
      const validatedIssue = jiraIssueSchema.parse(response.data);
      
      return this.transformJiraIssueToTaskDetails(validatedIssue);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        throw new Error(`Task ${taskId} not found`);
      }
      if (this.isRateLimitError(error)) {
        return this.handleRateLimit(error, () => this.getTaskDetails(taskId));
      }
      throw new Error(`Failed to fetch task details: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Transform Jira issues to our JiraStory format
   */
  private transformJiraIssuesToStories(issues: JiraIssue[]): JiraStory[] {
    return issues.map(issue => ({
      id: issue.key,
      title: issue.fields.summary,
      status: this.mapJiraStatusToOurStatus(issue.fields.status.name),
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      description: this.extractTextFromDescription(issue.fields.description) || undefined,
      issueType: 'story' as const,
    }));
  }

  /**
   * Transform Jira issues to our JiraTask format
   */
  private transformJiraIssuesToTasks(issues: JiraIssue[]): JiraTask[] {
    return issues.map(issue => ({
      id: issue.key,
      title: issue.fields.summary,
      status: this.mapJiraStatusToOurStatus(issue.fields.status.name),
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      description: this.extractTextFromDescription(issue.fields.description) || undefined,
      issueType: 'task' as const,
    }));
  }

  /**
   * Transform Jira issue to our StoryDetails format
   */
  private transformJiraIssueToStoryDetails(issue: JiraIssue): StoryDetails {
    const descriptionText = this.extractTextFromDescription(issue.fields.description);
    const acceptanceCriteria = this.extractAcceptanceCriteria(descriptionText);
    
    return {
      id: issue.key,
      title: issue.fields.summary,
      description: descriptionText,
      acceptanceCriteria,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      issueType: 'story' as const,
    };
  }

  /**
   * Transform Jira issue to our TaskDetails format
   */
  private transformJiraIssueToTaskDetails(issue: JiraIssue): TaskDetails {
    const descriptionText = this.extractTextFromDescription(issue.fields.description);
    const acceptanceCriteria = this.extractAcceptanceCriteria(descriptionText);
    
    return {
      id: issue.key,
      title: issue.fields.summary,
      description: descriptionText,
      acceptanceCriteria,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      issueType: 'task' as const,
    };
  }

  /**
   * Extract plain text from Jira description field
   * Handles both plain text strings and Atlassian Document Format (ADF) objects
   */
  private extractTextFromDescription(description: any): string {
    if (!description) {
      return '';
    }

    // If it's already a string, return it
    if (typeof description === 'string') {
      return description;
    }

    // If it's an ADF object, extract text from it
    if (typeof description === 'object' && description.type === 'doc') {
      return this.extractTextFromADF(description);
    }

    // Fallback: try to stringify
    return JSON.stringify(description);
  }

  /**
   * Extract plain text from Atlassian Document Format (ADF)
   */
  private extractTextFromADF(node: any): string {
    if (!node) {
      return '';
    }

    // If node has text content, return it
    if (node.text) {
      return node.text;
    }

    // If node has content array, recursively extract text from children
    if (Array.isArray(node.content)) {
      return node.content
        .map((child: any) => this.extractTextFromADF(child))
        .join('\n')
        .trim();
    }

    return '';
  }

  /**
   * Extract acceptance criteria from description text
   */
  private extractAcceptanceCriteria(description: string): string[] {
    const acRegex = /Acceptance Criteria:\s*\n((?:\s*-\s*.+\n?)*)/i;
    const match = description.match(acRegex);
    
    if (!match || !match[1]) {
      return [];
    }
    
    return match[1]
      .split('\n')
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Map Jira status names to our standardized status enum
   */
  private mapJiraStatusToOurStatus(jiraStatus: string): JiraStory['status'] {
    const statusMap: Record<string, JiraStory['status']> = {
      'To Do': 'To Do',
      'In Progress': 'In Progress',
      'Ready for QA': 'Ready for QA',
      'Done': 'Done',
      // Common variations
      'TODO': 'To Do',
      'OPEN': 'To Do',
      'IN PROGRESS': 'In Progress',
      'READY FOR QA': 'Ready for QA',
      'CLOSED': 'Done',
      'RESOLVED': 'Done',
    };

    return statusMap[jiraStatus.toUpperCase()] || 'To Do';
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  private async handleRateLimit<T>(error: any, retryFn: () => Promise<T>): Promise<T> {
    const retryAfter = error.response?.headers?.['retry-after'];
    const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000; // Default 1 second
    
    await this.sleep(delay);
    return retryFn();
  }

  /**
   * Check if error is a rate limit error (429)
   */
  private isRateLimitError(error: any): boolean {
    return error.response?.status === 429;
  }

  /**
   * Check if error is a not found error (404)
   */
  private isNotFoundError(error: any): boolean {
    return error.response?.status === 404;
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

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}