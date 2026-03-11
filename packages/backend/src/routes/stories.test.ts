/**
 * Integration tests for stories endpoint
 */

import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { storiesRouter } from './stories.js';
import { JiraService } from '../services/jira-service.js';

// Mock the JiraService
vi.mock('../services/jira-service.js');

// Mock environment variables
vi.mock('../config/environment.js', () => ({
  getEnvironment: () => ({
    JIRA_BASE_URL: 'https://test.atlassian.net',
    JIRA_USERNAME: 'test@example.com',
    JIRA_API_TOKEN: 'test-token',
    JIRA_BOARD_ID: '123',
    GOOGLE_SHEETS_SPREADSHEET_ID: 'test-spreadsheet-id',
    GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
    MORPHEUS_MCP_URL: 'https://morpheus.test.com'
  })
}));

const app = express();
app.use(express.json());
app.use('/api/stories', storiesRouter);

describe('GET /api/stories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return stories successfully', async () => {
    const mockStories = [
      {
        id: 'PROJ-123',
        title: 'User Authentication',
        status: 'To Do',
        assignee: 'john.doe@example.com',
        description: 'Implement user login functionality'
      },
      {
        id: 'PROJ-124',
        title: 'Dashboard View',
        status: 'In Progress',
        assignee: 'jane.smith@example.com',
        description: 'Create user dashboard'
      }
    ];

    const mockJiraService = vi.mocked(JiraService.prototype);
    mockJiraService.getStoriesFromBoard.mockResolvedValue(mockStories);

    const response = await request(app)
      .get('/api/stories')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: { stories: mockStories }
    });
  });

  it('should filter stories by status', async () => {
    const mockStories = [
      {
        id: 'PROJ-123',
        title: 'User Authentication',
        status: 'To Do',
        assignee: 'john.doe@example.com',
        description: 'Implement user login functionality'
      }
    ];

    const mockJiraService = vi.mocked(JiraService.prototype);
    mockJiraService.getStoriesFromBoard.mockResolvedValue(mockStories);

    const response = await request(app)
      .get('/api/stories?status=To Do')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: { stories: mockStories }
    });
  });

  it('should search stories by title', async () => {
    const mockStories = [
      {
        id: 'PROJ-123',
        title: 'User Authentication',
        status: 'To Do',
        assignee: 'john.doe@example.com',
        description: 'Implement user login functionality'
      }
    ];

    const mockJiraService = vi.mocked(JiraService.prototype);
    mockJiraService.getStoriesFromBoard.mockResolvedValue(mockStories);

    const response = await request(app)
      .get('/api/stories?search=Authentication')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: { stories: mockStories }
    });
  });

  it('should handle Jira service errors', async () => {
    const mockJiraService = vi.mocked(JiraService.prototype);
    mockJiraService.getStoriesFromBoard.mockRejectedValue(new Error('Jira connection failed'));

    const response = await request(app)
      .get('/api/stories')
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      error: 'Unable to connect to Jira',
      message: 'Failed to fetch stories from Jira'
    });
  });

  it('should handle authentication errors', async () => {
    const authError = new Error('Authentication failed');
    authError.name = 'AuthenticationError';
    
    const mockJiraService = vi.mocked(JiraService.prototype);
    mockJiraService.getStoriesFromBoard.mockRejectedValue(authError);

    const response = await request(app)
      .get('/api/stories')
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      error: 'Authentication failed',
      message: 'Please check your Jira credentials'
    });
  });

  it('should validate query parameters', async () => {
    const response = await request(app)
      .get('/api/stories?status=InvalidStatus')
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid query parameters',
      message: expect.stringContaining('status')
    });
  });
});