/**
 * Unit tests for GherkinPromptBuilder
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GherkinPromptBuilder } from './prompt-builder.js';
import type { StoryDetails } from '../validation/jira-schemas.js';
import type { CodebaseContext } from '../validation/morpheus-schemas.js';

describe('GherkinPromptBuilder', () => {
  let promptBuilder: GherkinPromptBuilder;
  let mockStoryDetails: StoryDetails;
  let mockCodebaseContext: CodebaseContext;

  beforeEach(() => {
    promptBuilder = new GherkinPromptBuilder();
    
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

  describe('buildPrompts', () => {
    it('should generate system and user prompts', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result).toHaveProperty('systemPrompt');
      expect(result).toHaveProperty('userPrompt');
      expect(typeof result.systemPrompt).toBe('string');
      expect(typeof result.userPrompt).toBe('string');
      expect(result.systemPrompt.length).toBeGreaterThan(100);
      expect(result.userPrompt.length).toBeGreaterThan(100);
    });

    it('should include story details in user prompt', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.userPrompt).toContain('PROJ-123');
      expect(result.userPrompt).toContain('User Authentication');
      expect(result.userPrompt).toContain('User can log in with valid credentials');
      expect(result.userPrompt).toContain('AC-1:');
      expect(result.userPrompt).toContain('AC-2:');
      expect(result.userPrompt).toContain('AC-3:');
    });

    it('should include domain context in user prompt', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.userPrompt).toContain('User, Account, Session');
      expect(result.userPrompt).toContain('login, authentication, redirect');
      expect(result.userPrompt).toContain('password validation, session timeout');
      expect(result.userPrompt).toContain('/api/auth/login, /api/auth/logout');
      expect(result.userPrompt).toContain('LoginForm, Dashboard');
    });

    it('should handle empty codebase context gracefully', () => {
      const emptyContext: CodebaseContext = {
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      };

      const result = promptBuilder.buildPrompts(mockStoryDetails, emptyContext);

      expect(result.userPrompt).toContain('No specific domain context available');
      expect(result.userPrompt).toContain('PROJ-123');
      expect(result.userPrompt).toContain('User Authentication');
    });

    it('should include proper tagging requirements', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.userPrompt).toContain('@PROJ-123');
      expect(result.userPrompt).toContain('@smoke');
      expect(result.userPrompt).toContain('@negative');
      expect(result.userPrompt).toContain('@regression');
    });

    it('should include example format in user prompt', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.userPrompt).toContain('EXAMPLE FORMAT:');
      expect(result.userPrompt).toContain('Feature: User Authentication');
      expect(result.userPrompt).toContain('# AC-1');
      expect(result.userPrompt).toContain('Scenario Outline:');
      expect(result.userPrompt).toContain('Examples:');
    });
  });

  describe('system prompt', () => {
    it('should define expert role and capabilities', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.systemPrompt).toContain('senior QA automation architect');
      expect(result.systemPrompt).toContain('Gherkin specialist');
      expect(result.systemPrompt).toContain('Behavior Driven Development');
      expect(result.systemPrompt).toContain('BDD');
      expect(result.systemPrompt).toContain('Enterprise QA strategy');
      expect(result.systemPrompt).toContain('UI and API test automation');
    });

    it('should specify critical requirements', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.systemPrompt).toContain('CRITICAL REQUIREMENTS');
      expect(result.systemPrompt).toContain('Feature:');
      expect(result.systemPrompt).toContain('correct Gherkin syntax');
      expect(result.systemPrompt).toContain('business readable language');
      expect(result.systemPrompt).toContain('complete test coverage');
    });

    it('should specify output format requirements', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.systemPrompt).toContain('OUTPUT FORMAT');
      expect(result.systemPrompt).toContain('valid Gherkin feature content');
      expect(result.systemPrompt).toContain('Do not include explanations');
    });
  });

  describe('context handling', () => {
    it('should handle partial context data', () => {
      const partialContext: CodebaseContext = {
        entities: ['User'],
        workflows: [],
        businessRules: ['password validation'],
        apiEndpoints: [],
        uiComponents: ['LoginForm'],
      };

      const result = promptBuilder.buildPrompts(mockStoryDetails, partialContext);

      expect(result.userPrompt).toContain('Domain Entities: User');
      expect(result.userPrompt).toContain('Business Rules: password validation');
      expect(result.userPrompt).toContain('UI Components: LoginForm');
      expect(result.userPrompt).not.toContain('Business Workflows:');
      expect(result.userPrompt).not.toContain('API Endpoints:');
    });

    it('should format context sections properly', () => {
      const result = promptBuilder.buildPrompts(mockStoryDetails, mockCodebaseContext);

      expect(result.userPrompt).toContain('DOMAIN CONTEXT:');
      expect(result.userPrompt).toContain('Domain Entities:');
      expect(result.userPrompt).toContain('Business Workflows:');
      expect(result.userPrompt).toContain('Business Rules:');
      expect(result.userPrompt).toContain('API Endpoints:');
      expect(result.userPrompt).toContain('UI Components:');
    });
  });

  describe('story variations', () => {
    it('should handle stories with single acceptance criterion', () => {
      const singleACStory: StoryDetails = {
        ...mockStoryDetails,
        acceptanceCriteria: ['User can log in successfully'],
      };

      const result = promptBuilder.buildPrompts(singleACStory, mockCodebaseContext);

      expect(result.userPrompt).toContain('AC-1: User can log in successfully');
      expect(result.userPrompt).not.toContain('AC-2:');
    });

    it('should handle stories with many acceptance criteria', () => {
      const manyACStory: StoryDetails = {
        ...mockStoryDetails,
        acceptanceCriteria: [
          'First criterion',
          'Second criterion',
          'Third criterion',
          'Fourth criterion',
          'Fifth criterion',
        ],
      };

      const result = promptBuilder.buildPrompts(manyACStory, mockCodebaseContext);

      expect(result.userPrompt).toContain('AC-1: First criterion');
      expect(result.userPrompt).toContain('AC-2: Second criterion');
      expect(result.userPrompt).toContain('AC-3: Third criterion');
      expect(result.userPrompt).toContain('AC-4: Fourth criterion');
      expect(result.userPrompt).toContain('AC-5: Fifth criterion');
    });

    it('should handle long story descriptions', () => {
      const longDescriptionStory: StoryDetails = {
        ...mockStoryDetails,
        description: 'This is a very long story description that contains multiple sentences and detailed information about the user story requirements and business context that needs to be considered when generating test scenarios.',
      };

      const result = promptBuilder.buildPrompts(longDescriptionStory, mockCodebaseContext);

      expect(result.userPrompt).toContain(longDescriptionStory.description);
      // Should truncate in example but keep full description in story section
      expect(result.userPrompt).toContain('This is a very long story description that contains multiple sentences and detailed information about the user story requirements and business context that needs to be considered when generating test scenarios.');
    });

    it('should handle special characters in story details', () => {
      const specialCharStory: StoryDetails = {
        ...mockStoryDetails,
        title: 'User Authentication & Authorization',
        description: 'As a user, I want to log in with "special" characters & symbols.',
        acceptanceCriteria: [
          'User can log in with email@domain.com format',
          'Password must contain special chars: !@#$%',
        ],
      };

      const result = promptBuilder.buildPrompts(specialCharStory, mockCodebaseContext);

      expect(result.userPrompt).toContain('User Authentication & Authorization');
      expect(result.userPrompt).toContain('"special" characters & symbols');
      expect(result.userPrompt).toContain('email@domain.com');
      expect(result.userPrompt).toContain('!@#$%');
    });
  });

  describe('validation prompt', () => {
    it('should build validation prompt with content', () => {
      const gherkinContent = `Feature: Test Feature
  # AC-1
  @smoke @PROJ-123
  Scenario: Test scenario
    Given some condition
    When some action
    Then some result`;

      const result = promptBuilder.buildValidationPrompt(gherkinContent);

      expect(result).toContain('validate this Gherkin content');
      expect(result).toContain('Proper syntax and formatting');
      expect(result).toContain('Complete scenario coverage');
      expect(result).toContain('Appropriate tagging');
      expect(result).toContain('Business-readable language');
      expect(result).toContain(gherkinContent);
      expect(result).toContain('VALID');
    });
  });

  describe('refinement prompt', () => {
    it('should build refinement prompt with issues and context', () => {
      const originalContent = `Feature: Test Feature
  Scenario: Test scenario
    Given some condition`;

      const issues = [
        'Missing story ID tag',
        'Missing AC reference',
        'Incomplete scenario steps',
      ];

      const result = promptBuilder.buildRefinementPrompt(originalContent, issues, mockStoryDetails);

      expect(result).toContain('refine this Gherkin content');
      expect(result).toContain('ISSUES TO FIX:');
      expect(result).toContain('1. Missing story ID tag');
      expect(result).toContain('2. Missing AC reference');
      expect(result).toContain('3. Incomplete scenario steps');
      expect(result).toContain('ORIGINAL CONTENT:');
      expect(result).toContain(originalContent);
      expect(result).toContain('STORY CONTEXT:');
      expect(result).toContain('PROJ-123');
      expect(result).toContain('User Authentication');
    });

    it('should handle empty issues list', () => {
      const originalContent = 'Feature: Test';
      const issues: string[] = [];

      const result = promptBuilder.buildRefinementPrompt(originalContent, issues, mockStoryDetails);

      expect(result).toContain('ISSUES TO FIX:');
      expect(result).toContain('ORIGINAL CONTENT:');
      expect(result).toContain('STORY CONTEXT:');
    });
  });

  describe('edge cases', () => {
    it('should handle empty story title', () => {
      const emptyTitleStory: StoryDetails = {
        ...mockStoryDetails,
        title: '',
      };

      const result = promptBuilder.buildPrompts(emptyTitleStory, mockCodebaseContext);

      expect(result.userPrompt).toContain('Title: ');
      expect(result.userPrompt).toContain('PROJ-123');
    });

    it('should handle empty description', () => {
      const emptyDescStory: StoryDetails = {
        ...mockStoryDetails,
        description: '',
      };

      const result = promptBuilder.buildPrompts(emptyDescStory, mockCodebaseContext);

      expect(result.userPrompt).toContain('Description: ');
      expect(result.userPrompt).toContain('PROJ-123');
    });

    it('should handle very long context arrays', () => {
      const longContext: CodebaseContext = {
        entities: Array.from({ length: 20 }, (_, i) => `Entity${i + 1}`),
        workflows: Array.from({ length: 15 }, (_, i) => `workflow${i + 1}`),
        businessRules: Array.from({ length: 10 }, (_, i) => `rule${i + 1}`),
        apiEndpoints: Array.from({ length: 25 }, (_, i) => `/api/endpoint${i + 1}`),
        uiComponents: Array.from({ length: 30 }, (_, i) => `Component${i + 1}`),
      };

      const result = promptBuilder.buildPrompts(mockStoryDetails, longContext);

      expect(result.userPrompt).toContain('Entity1, Entity2');
      expect(result.userPrompt).toContain('Entity20');
      expect(result.userPrompt).toContain('Component30');
      expect(result.userPrompt.length).toBeGreaterThan(1000);
    });
  });
});