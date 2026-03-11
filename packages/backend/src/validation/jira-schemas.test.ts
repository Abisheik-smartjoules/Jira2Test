/**
 * Unit tests for Jira validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  jiraStoryStatusSchema,
  jiraStorySchema,
  storyDetailsSchema,
  storyFiltersSchema,
  jiraIssueFieldsSchema,
  jiraIssueSchema,
  jiraSearchResponseSchema,
  jiraBoardResponseSchema,
  jiraConfigSchema,
} from './jira-schemas.js';

describe('Jira Schemas', () => {
  describe('jiraStoryStatusSchema', () => {
    it('should validate all valid story statuses', () => {
      const validStatuses = ['To Do', 'In Progress', 'Ready for QA', 'Done'];
      
      validStatuses.forEach(status => {
        expect(() => jiraStoryStatusSchema.parse(status)).not.toThrow();
      });
    });

    it('should reject invalid story statuses', () => {
      const invalidStatuses = ['todo', 'IN_PROGRESS', 'Complete', 'Closed'];
      
      invalidStatuses.forEach(status => {
        expect(() => jiraStoryStatusSchema.parse(status)).toThrow();
      });
    });
  });

  describe('jiraStorySchema', () => {
    const validStory = {
      id: 'PROJ-123',
      title: 'User Authentication Feature',
      status: 'In Progress',
      assignee: 'John Doe',
      description: 'Implement user login functionality',
      issueType: 'story' as const,
    };

    it('should validate complete story', () => {
      expect(() => jiraStorySchema.parse(validStory)).not.toThrow();
    });

    it('should validate story without optional description', () => {
      const { description, ...storyWithoutDesc } = validStory;
      expect(() => jiraStorySchema.parse(storyWithoutDesc)).not.toThrow();
    });

    it('should reject story with invalid ID format', () => {
      const invalidStory = { ...validStory, id: 'invalid-id' };
      expect(() => jiraStorySchema.parse(invalidStory)).toThrow();
    });

    it('should reject story with empty title', () => {
      const invalidStory = { ...validStory, title: '' };
      expect(() => jiraStorySchema.parse(invalidStory)).toThrow();
    });

    it('should reject story with invalid status', () => {
      const invalidStory = { ...validStory, status: 'Invalid Status' };
      expect(() => jiraStorySchema.parse(invalidStory)).toThrow();
    });

    it('should reject story with empty assignee', () => {
      const invalidStory = { ...validStory, assignee: '' };
      expect(() => jiraStorySchema.parse(invalidStory)).toThrow();
    });
  });

  describe('storyDetailsSchema', () => {
    const validDetails = {
      id: 'PROJ-456',
      title: 'Password Reset Feature',
      description: 'Allow users to reset their passwords',
      acceptanceCriteria: [
        'User can request password reset via email',
        'User receives reset link within 5 minutes',
      ],
      status: 'To Do',
      assignee: 'Jane Smith',
      issueType: 'story' as const,
    };

    it('should validate complete story details', () => {
      expect(() => storyDetailsSchema.parse(validDetails)).not.toThrow();
    });

    it('should apply default empty values', () => {
      const minimalDetails = {
        id: 'PROJ-456',
        title: 'Test Story',
        status: 'To Do',
        assignee: 'Test User',
        issueType: 'story' as const,
      };

      const parsed = storyDetailsSchema.parse(minimalDetails);
      expect(parsed.description).toBe('');
      expect(parsed.acceptanceCriteria).toEqual([]);
    });

    it('should reject details with invalid story ID', () => {
      const invalidDetails = { ...validDetails, id: 'invalid' };
      expect(() => storyDetailsSchema.parse(invalidDetails)).toThrow();
    });

    it('should reject details with empty title', () => {
      const invalidDetails = { ...validDetails, title: '' };
      expect(() => storyDetailsSchema.parse(invalidDetails)).toThrow();
    });
  });

  describe('storyFiltersSchema', () => {
    it('should validate filters with valid status', () => {
      const validFilters = { status: 'In Progress' };
      expect(() => storyFiltersSchema.parse(validFilters)).not.toThrow();
    });

    it('should validate filters with "All" status', () => {
      const validFilters = { status: 'All' };
      expect(() => storyFiltersSchema.parse(validFilters)).not.toThrow();
    });

    it('should validate filters with search term', () => {
      const validFilters = { search: 'authentication' };
      expect(() => storyFiltersSchema.parse(validFilters)).not.toThrow();
    });

    it('should validate filters with both status and search', () => {
      const validFilters = { status: 'Ready for QA', search: 'login' };
      expect(() => storyFiltersSchema.parse(validFilters)).not.toThrow();
    });

    it('should validate empty filters object', () => {
      expect(() => storyFiltersSchema.parse({})).not.toThrow();
    });

    it('should reject filters with invalid status', () => {
      const invalidFilters = { status: 'Invalid' };
      expect(() => storyFiltersSchema.parse(invalidFilters)).toThrow();
    });
  });

  describe('jiraIssueFieldsSchema', () => {
    const validFields = {
      summary: 'Test Issue Summary',
      description: 'Test issue description',
      status: { name: 'In Progress' },
      assignee: { displayName: 'John Doe' },
      customfield_10000: 'Acceptance criteria text',
    };

    it('should validate complete issue fields', () => {
      expect(() => jiraIssueFieldsSchema.parse(validFields)).not.toThrow();
    });

    it('should validate fields with null description', () => {
      const fieldsWithNullDesc = { ...validFields, description: null };
      expect(() => jiraIssueFieldsSchema.parse(fieldsWithNullDesc)).not.toThrow();
    });

    it('should validate fields with null assignee', () => {
      const fieldsWithNullAssignee = { ...validFields, assignee: null };
      expect(() => jiraIssueFieldsSchema.parse(fieldsWithNullAssignee)).not.toThrow();
    });

    it('should validate fields without optional fields', () => {
      const minimalFields = {
        summary: 'Test Summary',
        status: { name: 'To Do' },
      };
      expect(() => jiraIssueFieldsSchema.parse(minimalFields)).not.toThrow();
    });

    it('should reject fields with empty summary', () => {
      const invalidFields = { ...validFields, summary: '' };
      expect(() => jiraIssueFieldsSchema.parse(invalidFields)).toThrow();
    });
  });

  describe('jiraIssueSchema', () => {
    const validIssue = {
      id: '12345',
      key: 'PROJ-123',
      fields: {
        summary: 'Test Issue',
        status: { name: 'To Do' },
      },
    };

    it('should validate complete issue', () => {
      expect(() => jiraIssueSchema.parse(validIssue)).not.toThrow();
    });

    it('should reject issue with missing fields', () => {
      const { fields, ...issueWithoutFields } = validIssue;
      expect(() => jiraIssueSchema.parse(issueWithoutFields)).toThrow();
    });
  });

  describe('jiraSearchResponseSchema', () => {
    const validResponse = {
      issues: [
        {
          id: '12345',
          key: 'PROJ-123',
          fields: {
            summary: 'Test Issue',
            status: { name: 'To Do' },
          },
        },
      ],
      total: 1,
      startAt: 0,
      maxResults: 50,
    };

    it('should validate complete search response', () => {
      expect(() => jiraSearchResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should validate response with empty issues array', () => {
      const emptyResponse = { ...validResponse, issues: [], total: 0 };
      expect(() => jiraSearchResponseSchema.parse(emptyResponse)).not.toThrow();
    });

    it('should reject response with negative total', () => {
      const invalidResponse = { ...validResponse, total: -1 };
      expect(() => jiraSearchResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('jiraBoardResponseSchema', () => {
    const validBoardResponse = {
      values: [
        { id: 1, name: 'Test Board', type: 'scrum' },
        { id: 2, name: 'Another Board', type: 'kanban' },
      ],
    };

    it('should validate board response', () => {
      expect(() => jiraBoardResponseSchema.parse(validBoardResponse)).not.toThrow();
    });

    it('should validate response with empty boards array', () => {
      const emptyResponse = { values: [] };
      expect(() => jiraBoardResponseSchema.parse(emptyResponse)).not.toThrow();
    });
  });

  describe('jiraConfigSchema', () => {
    const validConfig = {
      baseUrl: 'https://company.atlassian.net',
      username: 'user@company.com',
      apiToken: 'abc123token',
      boardId: '123',
    };

    it('should validate complete config', () => {
      expect(() => jiraConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should reject config with invalid URL', () => {
      const invalidConfig = { ...validConfig, baseUrl: 'not-a-url' };
      expect(() => jiraConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with invalid email', () => {
      const invalidConfig = { ...validConfig, username: 'not-an-email' };
      expect(() => jiraConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with empty API token', () => {
      const invalidConfig = { ...validConfig, apiToken: '' };
      expect(() => jiraConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with empty board ID', () => {
      const invalidConfig = { ...validConfig, boardId: '' };
      expect(() => jiraConfigSchema.parse(invalidConfig)).toThrow();
    });
  });
});