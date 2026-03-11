/**
 * Unit tests for GherkinGeneratorService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GherkinGeneratorService } from './gherkin-generator.js';
import type { StoryDetails } from '../validation/jira-schemas.js';
import type { CodebaseContext } from '../validation/morpheus-schemas.js';
import type { FeatureFile } from '@jira2test/shared';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI),
}));

describe('GherkinGeneratorService', () => {
  let service: GherkinGeneratorService;
  let mockStoryDetails: StoryDetails;
  let mockCodebaseContext: CodebaseContext;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GherkinGeneratorService({ apiKey: 'test-key' });
    
    mockStoryDetails = {
      id: 'PROJ-123',
      title: 'User Authentication',
      description: 'As a user, I want to log in to the system so that I can access my account.',
      acceptanceCriteria: [
        'User can log in with valid credentials',
        'User sees error message with invalid credentials',
        'User is redirected to dashboard after successful login'
      ],
      status: 'In Progress',
      assignee: 'John Doe',
    };

    mockCodebaseContext = {
      entities: ['User', 'Account', 'Session'],
      workflows: ['login', 'authentication', 'redirect'],
      businessRules: ['password validation', 'session timeout'],
      apiEndpoints: ['/api/auth/login', '/api/auth/logout'],
      uiComponents: ['LoginForm', 'Dashboard'],
    };
  });

  describe('generateFeatureFile', () => {
    it('should generate a complete feature file with scenarios', async () => {
      // Mock OpenAI response
      const mockGherkinContent = `Feature: User Authentication
  As a user, I want to log in to the system so that I can access my account.

  # AC-1
  @smoke @PROJ-123
  Scenario: User can log in with valid credentials
    Given a user has valid credentials
    When the user submits the login form
    Then the user should be logged in successfully

  # AC-2
  @negative @PROJ-123
  Scenario: User sees error message with invalid credentials
    Given a user has invalid credentials
    When the user submits the login form
    Then the user should see an error message

  # AC-3
  @smoke @PROJ-123
  Scenario: User is redirected to dashboard after successful login
    Given a user has valid credentials
    When the user logs in successfully
    Then the user should be redirected to the dashboard`;

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: mockGherkinContent,
          },
        }],
      });

      const result = await service.generateFeatureFile(mockStoryDetails, mockCodebaseContext);

      expect(result).toBeDefined();
      expect(result.feature.title).toBe('User Authentication');
      expect(result.scenarios).toHaveLength(3);
      expect(result.metadata.storyId).toBe('PROJ-123');
      
      // Verify all scenarios have required tags
      result.scenarios.forEach(scenario => {
        expect(scenario.tags).toContain('@PROJ-123');
        expect(scenario.acReference).toMatch(/^AC-\d+$/);
      });
    });

    it('should handle AI service errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('AI service unavailable'));

      await expect(service.generateFeatureFile(mockStoryDetails, mockCodebaseContext))
        .rejects.toThrow('Failed to generate Gherkin content: AI service unavailable');
    });

    it('should validate generated content and throw on invalid Gherkin', async () => {
      const invalidGherkinContent = `Invalid Gherkin Content
      This is not valid Gherkin syntax`;

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: invalidGherkinContent,
          },
        }],
      });

      await expect(service.generateFeatureFile(mockStoryDetails, mockCodebaseContext))
        .rejects.toThrow('Failed to generate Gherkin content: No Feature declaration found');
    });
  });

  describe('generateTags', () => {
    it('should generate correct tags for happy path scenarios', () => {
      const tags = service.generateTags('PROJ-123', 'happy');
      expect(tags).toContain('@smoke');
      expect(tags).toContain('@PROJ-123');
    });

    it('should generate correct tags for negative scenarios', () => {
      const tags = service.generateTags('PROJ-123', 'negative');
      expect(tags).toContain('@negative');
      expect(tags).toContain('@PROJ-123');
    });

    it('should generate correct tags for edge case scenarios', () => {
      const tags = service.generateTags('PROJ-123', 'edge');
      expect(tags).toContain('@regression');
      expect(tags).toContain('@PROJ-123');
    });
  });

  describe('buildPrompt', () => {
    it('should build a comprehensive prompt with story details and context', () => {
      const prompt = service.buildPrompt(mockStoryDetails, mockCodebaseContext);
      
      expect(prompt).toContain('User Authentication');
      expect(prompt).toContain('PROJ-123');
      expect(prompt).toContain('User can log in with valid credentials');
      expect(prompt).toContain('User, Account, Session');
      expect(prompt).toContain('login, authentication, redirect');
    });

    it('should handle empty context gracefully', () => {
      const emptyContext: CodebaseContext = {
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      };

      const prompt = service.buildPrompt(mockStoryDetails, emptyContext);
      expect(prompt).toContain('User Authentication');
      expect(prompt).toContain('PROJ-123');
    });
  });
});