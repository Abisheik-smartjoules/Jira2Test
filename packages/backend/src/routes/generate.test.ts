/**
 * Integration tests for generate endpoint
 */

import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { generateRouter } from './generate.js';
import { JiraService } from '../services/jira-service.js';
import { MorpheusService } from '../services/morpheus-service.js';
import { GherkinGeneratorService } from '../services/gherkin-generator.js';
import { GoogleSheetsService } from '../services/google-sheets-service.js';

// Mock all services
vi.mock('../services/jira-service.js');
vi.mock('../services/morpheus-service.js');
vi.mock('../services/gherkin-generator.js');
vi.mock('../services/google-sheets-service.js');

// Mock environment configuration
vi.mock('../config/environment.js', () => ({
  getEnvironment: vi.fn(() => ({
    PORT: '4007',
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    JIRA_BASE_URL: 'https://test.atlassian.net',
    JIRA_USERNAME: 'test@example.com',
    JIRA_API_TOKEN: 'test-token',
    JIRA_BOARD_ID: '123',
    GOOGLE_SHEETS_SPREADSHEET_ID: 'test-spreadsheet-id',
    GOOGLE_SHEETS_SHEET_NAME: 'Test Scenarios',
    GOOGLE_SERVICE_ACCOUNT_KEY: 'test-key',
    OPENAI_API_KEY: 'test-openai-key',
    MORPHEUS_MCP_URL: 'https://test-morpheus.com',
  }))
}));

const app = express();
app.use(express.json());
app.use('/api/generate', generateRouter);

describe('POST /api/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate feature file successfully for story', async () => {
    const mockStoryDetails = {
      id: 'PROJ-123',
      title: 'User Authentication',
      description: 'Implement user login functionality',
      acceptanceCriteria: ['User can log in with valid credentials'],
      status: 'To Do',
      assignee: 'john.doe@example.com',
      issueType: 'story' as const
    };

    const mockContext = {
      entities: ['User', 'Session'],
      workflows: ['login', 'logout'],
      businessRules: ['Password must be 8+ characters'],
      apiEndpoints: ['/api/auth/login'],
      uiComponents: ['LoginForm', 'Dashboard']
    };

    const mockFeatureFile = {
      feature: {
        title: 'User Authentication',
        description: ['Implement user login functionality'],
        tags: ['@PROJ-123']
      },
      scenarios: [
        {
          id: 'scenario-1',
          title: 'Valid user can log in',
          tags: ['@smoke', '@PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has valid credentials' },
            { keyword: 'When' as const, text: 'user submits login form' },
            { keyword: 'Then' as const, text: 'user is redirected to dashboard' }
          ]
        }
      ],
      metadata: {
        storyId: 'PROJ-123',
        generatedAt: '2026-03-10T11:33:57.490Z', // Use string instead of Date for JSON serialization
        version: '1.0'
      }
    };

    const mockSyncResults = {
      rowsAdded: 1,
      rowsSkipped: 0,
      scenarios: [
        {
          testCaseId: 'PROJ-123-TC-01',
          title: 'Valid user can log in',
          tags: '@smoke @PROJ-123',
          acReference: 'AC-1',
          status: 'Not Executed'
        }
      ]
    };

    // Mock service responses
    const mockJiraService = vi.mocked(JiraService.prototype);
    const mockMorpheusService = vi.mocked(MorpheusService.prototype);
    const mockGherkinService = vi.mocked(GherkinGeneratorService.prototype);
    const mockSheetsService = vi.mocked(GoogleSheetsService.prototype);

    mockJiraService.getStoryDetails.mockResolvedValue(mockStoryDetails);
    mockMorpheusService.getCodebaseContext.mockResolvedValue(mockContext);
    mockGherkinService.generateFeatureFile.mockResolvedValue(mockFeatureFile);
    mockSheetsService.syncScenarios.mockResolvedValue(mockSyncResults);

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-123', issueType: 'story' })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        featureFile: mockFeatureFile,
        syncResults: mockSyncResults
      }
    });

    // Verify service calls
    expect(mockJiraService.getStoryDetails).toHaveBeenCalledWith('PROJ-123');
    expect(mockMorpheusService.getCodebaseContext).toHaveBeenCalledWith(mockStoryDetails);
    expect(mockGherkinService.generateFeatureFile).toHaveBeenCalledWith(mockStoryDetails, mockContext);
    expect(mockSheetsService.syncScenarios).toHaveBeenCalledWith(mockFeatureFile.scenarios, 'PROJ-123', mockStoryDetails.title);
  });

  it('should generate feature file successfully for task', async () => {
    const mockTaskDetails = {
      id: 'PROJ-456',
      title: 'Update API endpoint',
      description: 'Update the authentication endpoint to support OAuth',
      acceptanceCriteria: ['Endpoint accepts OAuth tokens', 'Returns proper error codes'],
      status: 'In Progress',
      assignee: 'jane.smith@example.com',
      issueType: 'task' as const
    };

    const mockContext = {
      entities: ['AuthToken', 'User'],
      workflows: ['oauth-flow'],
      businessRules: ['Token must be valid'],
      apiEndpoints: ['/api/auth/oauth'],
      uiComponents: []
    };

    const mockFeatureFile = {
      feature: {
        title: 'Update API endpoint',
        description: ['Update the authentication endpoint to support OAuth'],
        tags: ['@PROJ-456']
      },
      scenarios: [
        {
          id: 'scenario-1',
          title: 'OAuth token is accepted',
          tags: ['@smoke', '@PROJ-456'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has valid OAuth token' },
            { keyword: 'When' as const, text: 'user sends request with token' },
            { keyword: 'Then' as const, text: 'request is authenticated' }
          ]
        }
      ],
      metadata: {
        storyId: 'PROJ-456',
        generatedAt: '2026-03-10T11:33:57.490Z',
        version: '1.0'
      }
    };

    const mockSyncResults = {
      rowsAdded: 1,
      rowsSkipped: 0,
      scenarios: [
        {
          testCaseId: 'PROJ-456-TC-01',
          title: 'OAuth token is accepted',
          tags: '@smoke @PROJ-456',
          acReference: 'AC-1',
          status: 'Not Executed'
        }
      ]
    };

    // Mock service responses
    const mockJiraService = vi.mocked(JiraService.prototype);
    const mockMorpheusService = vi.mocked(MorpheusService.prototype);
    const mockGherkinService = vi.mocked(GherkinGeneratorService.prototype);
    const mockSheetsService = vi.mocked(GoogleSheetsService.prototype);

    mockJiraService.getTaskDetails.mockResolvedValue(mockTaskDetails);
    mockMorpheusService.getCodebaseContext.mockResolvedValue(mockContext);
    mockGherkinService.generateFeatureFile.mockResolvedValue(mockFeatureFile);
    mockSheetsService.syncScenarios.mockResolvedValue(mockSyncResults);

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-456', issueType: 'task' })
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        featureFile: mockFeatureFile,
        syncResults: mockSyncResults
      }
    });

    // Verify service calls
    expect(mockJiraService.getTaskDetails).toHaveBeenCalledWith('PROJ-456');
    expect(mockMorpheusService.getCodebaseContext).toHaveBeenCalledWith(mockTaskDetails);
    expect(mockGherkinService.generateFeatureFile).toHaveBeenCalledWith(mockTaskDetails, mockContext);
    expect(mockSheetsService.syncScenarios).toHaveBeenCalledWith(mockFeatureFile.scenarios, 'PROJ-456', mockTaskDetails.title);
  });

  it('should validate request body', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid request body',
      message: expect.stringContaining('issueId')
    });
  });

  it('should handle invalid issue ID format', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'invalid-id', issueType: 'story' })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid request body',
      message: expect.stringContaining('issueId')
    });
  });

  it('should handle missing issueType', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-123' })
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid request body',
      message: expect.stringContaining('issueType')
    });
  });

  it('should handle story not found', async () => {
    const mockJiraService = vi.mocked(JiraService.prototype);
    const notFoundError = new Error('Story not found');
    notFoundError.name = 'NotFoundError';
    mockJiraService.getStoryDetails.mockRejectedValue(notFoundError);

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-999', issueType: 'story' })
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: 'Story not found',
      message: 'Story PROJ-999 does not exist in Jira'
    });
  });

  it('should handle task not found', async () => {
    const mockJiraService = vi.mocked(JiraService.prototype);
    const notFoundError = new Error('Task not found');
    notFoundError.name = 'NotFoundError';
    mockJiraService.getTaskDetails.mockRejectedValue(notFoundError);

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-888', issueType: 'task' })
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: 'Task not found',
      message: 'Task PROJ-888 does not exist in Jira'
    });
  });

  it('should handle Jira service unavailable', async () => {
    const mockJiraService = vi.mocked(JiraService.prototype);
    mockJiraService.getStoryDetails.mockRejectedValue(new Error('Connection timeout'));

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-123', issueType: 'story' })
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      error: 'Unable to connect to Jira',
      message: 'Failed to fetch story details from Jira'
    });
  });

  it('should handle Morpheus service unavailable', async () => {
    const mockStoryDetails = {
      id: 'PROJ-123',
      title: 'User Authentication',
      description: 'Implement user login functionality',
      acceptanceCriteria: ['User can log in with valid credentials'],
      status: 'To Do',
      assignee: 'john.doe@example.com',
      issueType: 'story' as const
    };

    const mockJiraService = vi.mocked(JiraService.prototype);
    const mockMorpheusService = vi.mocked(MorpheusService.prototype);

    mockJiraService.getStoryDetails.mockResolvedValue(mockStoryDetails);
    mockMorpheusService.getCodebaseContext.mockRejectedValue(new Error('Morpheus unavailable'));

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-123', issueType: 'story' })
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      error: 'Unable to access codebase context',
      message: 'Failed to get context from Morpheus MCP'
    });
  });

  it('should handle Google Sheets sync failure', async () => {
    const mockStoryDetails = {
      id: 'PROJ-123',
      title: 'User Authentication',
      description: 'Implement user login functionality',
      acceptanceCriteria: ['User can log in with valid credentials'],
      status: 'To Do',
      assignee: 'john.doe@example.com',
      issueType: 'story' as const
    };

    const mockContext = {
      entities: ['User'],
      workflows: ['login'],
      businessRules: [],
      apiEndpoints: [],
      uiComponents: []
    };

    const mockFeatureFile = {
      feature: {
        title: 'User Authentication',
        description: ['Implement user login functionality'],
        tags: ['@PROJ-123']
      },
      scenarios: [],
      metadata: {
        storyId: 'PROJ-123',
        generatedAt: new Date(),
        version: '1.0'
      }
    };

    const mockJiraService = vi.mocked(JiraService.prototype);
    const mockMorpheusService = vi.mocked(MorpheusService.prototype);
    const mockGherkinService = vi.mocked(GherkinGeneratorService.prototype);
    const mockSheetsService = vi.mocked(GoogleSheetsService.prototype);

    mockJiraService.getStoryDetails.mockResolvedValue(mockStoryDetails);
    mockMorpheusService.getCodebaseContext.mockResolvedValue(mockContext);
    mockGherkinService.generateFeatureFile.mockResolvedValue(mockFeatureFile);
    mockSheetsService.syncScenarios.mockRejectedValue(new Error('Sheets API error'));

    const response = await request(app)
      .post('/api/generate')
      .send({ issueId: 'PROJ-123', issueType: 'story' })
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      error: 'Unable to sync to Google Sheets',
      message: 'Failed to synchronize scenarios to Google Sheets'
    });
  });
});