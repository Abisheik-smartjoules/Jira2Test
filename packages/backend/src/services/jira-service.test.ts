/**
 * JiraService integration tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { JiraService } from './jira-service.js';
import type { JiraConfig, JiraSearchResponse, JiraIssue } from '../validation/jira-schemas.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('JiraService', () => {
  let jiraService: JiraService;
  let mockConfig: JiraConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://test.atlassian.net',
      username: 'test@example.com',
      apiToken: 'test-token',
      boardId: '123',
    };

    // Mock axios.create to return a mock instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
    
    jiraService = new JiraService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStoriesFromBoard', () => {
    it('should fetch stories from board with default pagination', async () => {
      const mockResponse: JiraSearchResponse = {
        issues: [
          {
            id: '1',
            key: 'TEST-1',
            fields: {
              summary: 'Test Story 1',
              description: 'Test description',
              status: { name: 'To Do' },
              assignee: { displayName: 'John Doe' },
            },
          },
          {
            id: '2',
            key: 'TEST-2',
            fields: {
              summary: 'Test Story 2',
              description: null,
              status: { name: 'In Progress' },
              assignee: null,
            },
          },
        ],
        total: 2,
        startAt: 0,
        maxResults: 50,
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await jiraService.getStoriesFromBoard();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/rest/agile/1.0/board/123/issue',
        expect.objectContaining({
          params: {
            jql: 'type = Story',
            startAt: 0,
            maxResults: 50,
            fields: 'summary,description,status,assignee',
          },
        })
      );

      expect(result).toEqual([
        {
          id: 'TEST-1',
          title: 'Test Story 1',
          status: 'To Do',
          assignee: 'John Doe',
          description: 'Test description',
          issueType: 'story',
        },
        {
          id: 'TEST-2',
          title: 'Test Story 2',
          status: 'In Progress',
          assignee: 'Unassigned',
          description: undefined,
          issueType: 'story',
        },
      ]);
    });

    it('should handle pagination parameters', async () => {
      const mockResponse: JiraSearchResponse = {
        issues: [],
        total: 0,
        startAt: 50,
        maxResults: 25,
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockResponse });

      await jiraService.getStoriesFromBoard(50, 25);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/rest/agile/1.0/board/123/issue',
        expect.objectContaining({
          params: expect.objectContaining({
            startAt: 50,
            maxResults: 25,
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(jiraService.getStoriesFromBoard()).rejects.toThrow(
        'Failed to fetch stories from Jira: Network error'
      );
    });

    it('should handle rate limiting with retry', async () => {
      const rateLimitError = {
        response: { status: 429, headers: { 'retry-after': '1' } },
        message: 'Rate limited',
      };
      const mockResponse: JiraSearchResponse = {
        issues: [],
        total: 0,
        startAt: 0,
        maxResults: 50,
      };

      mockAxiosInstance.get
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await jiraService.getStoriesFromBoard();

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);
    });
  });

  describe('getStoryDetails', () => {
    it('should fetch detailed story information', async () => {
      const mockIssue: JiraIssue = {
        id: '1',
        key: 'TEST-1',
        fields: {
          summary: 'Test Story',
          description: 'Detailed description\n\nAcceptance Criteria:\n- AC 1\n- AC 2',
          status: { name: 'To Do' },
          assignee: { displayName: 'John Doe' },
          customfield_10000: 'Custom AC field content',
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssue });

      const result = await jiraService.getStoryDetails('TEST-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/rest/api/3/issue/TEST-1',
        expect.objectContaining({
          params: {
            fields: 'summary,description,status,assignee,customfield_10000',
          },
        })
      );

      expect(result).toEqual({
        id: 'TEST-1',
        title: 'Test Story',
        description: 'Detailed description\n\nAcceptance Criteria:\n- AC 1\n- AC 2',
        acceptanceCriteria: ['AC 1', 'AC 2'],
        status: 'To Do',
        assignee: 'John Doe',
        issueType: 'story',
      });
    });

    it('should handle missing story', async () => {
      const error = { response: { status: 404 }, message: 'Not found' };
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(jiraService.getStoryDetails('INVALID-1')).rejects.toThrow(
        'Story INVALID-1 not found'
      );
    });

    it('should extract acceptance criteria from description', async () => {
      const mockIssue: JiraIssue = {
        id: '1',
        key: 'TEST-1',
        fields: {
          summary: 'Test Story',
          description: 'Story description\n\nAcceptance Criteria:\n- First criterion\n- Second criterion\n\nAdditional notes',
          status: { name: 'To Do' },
          assignee: { displayName: 'John Doe' },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssue });

      const result = await jiraService.getStoryDetails('TEST-1');

      expect(result.acceptanceCriteria).toEqual(['First criterion', 'Second criterion']);
    });

    it('should handle empty acceptance criteria', async () => {
      const mockIssue: JiraIssue = {
        id: '1',
        key: 'TEST-1',
        fields: {
          summary: 'Test Story',
          description: 'Just a description without AC',
          status: { name: 'To Do' },
          assignee: { displayName: 'John Doe' },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockIssue });

      const result = await jiraService.getStoryDetails('TEST-1');

      expect(result.acceptanceCriteria).toEqual([]);
    });
  });

  describe('authentication and configuration', () => {
    it('should use basic auth with username and API token', async () => {
      // Create a new service to test constructor behavior
      vi.clearAllMocks();
      
      const testConfig: JiraConfig = {
        baseUrl: 'https://test.atlassian.net',
        username: 'test@example.com',
        apiToken: 'test-token',
        boardId: '123',
      };

      new JiraService(testConfig);

      // Check that axios.create was called with correct config during construction
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://test.atlassian.net',
          auth: {
            username: 'test@example.com',
            password: 'test-token',
          },
          timeout: 30000,
        })
      );
    });

    it('should use correct base URL', async () => {
      // Create a new service to test constructor behavior
      vi.clearAllMocks();
      
      const testConfig: JiraConfig = {
        baseUrl: 'https://custom.atlassian.net',
        username: 'test@example.com',
        apiToken: 'test-token',
        boardId: '456',
      };

      new JiraService(testConfig);

      // Check that axios.create was called with correct config during construction
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom.atlassian.net',
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      mockAxiosInstance.get.mockRejectedValueOnce(timeoutError);

      await expect(jiraService.getStoriesFromBoard()).rejects.toThrow(
        'Failed to fetch stories from Jira: timeout'
      );
    });

    it('should handle invalid JSON responses', async () => {
      const invalidJsonError = { message: 'Unexpected token' };
      mockAxiosInstance.get.mockRejectedValueOnce(invalidJsonError);

      await expect(jiraService.getStoriesFromBoard()).rejects.toThrow(
        'Failed to fetch stories from Jira: Unexpected token'
      );
    });
  });
});