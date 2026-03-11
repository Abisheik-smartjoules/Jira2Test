/**
 * AI-powered Gherkin feature file generator service
 */

import OpenAI from 'openai';
import type { StoryDetails, TaskDetails } from '../validation/jira-schemas.js';
import type { CodebaseContext } from '../validation/morpheus-schemas.js';
import type { FeatureFile, ScenarioType } from '@jira2test/shared';
import { GherkinParser } from './gherkin-parser.js';
import { GherkinPromptBuilder } from './prompt-builder.js';

export interface GherkinGeneratorConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseURL?: string; // Support for alternative API providers like Groq
}

export class GherkinGeneratorService {
  private openai: OpenAI | null;
  private parser: GherkinParser;
  private promptBuilder: GherkinPromptBuilder;
  private config: GherkinGeneratorConfig & { model: string; temperature: number; maxTokens: number };
  private isMockMode: boolean;

  constructor(config: GherkinGeneratorConfig) {
    this.config = {
      model: 'llama-3.3-70b-versatile', // Default Groq model
      temperature: 0.3,
      maxTokens: 2000,
      ...config,
    };
    
    // Check if we're in mock mode (no real API key or mock key)
    this.isMockMode = !this.config.apiKey || this.config.apiKey === 'mock-api-key';
    
    if (!this.isMockMode) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL, // Allow custom base URL for Groq or other providers
      });
    } else {
      this.openai = null;
    }
    
    this.parser = new GherkinParser();
    this.promptBuilder = new GherkinPromptBuilder();
  }

  /**
   * Generate a complete feature file from issue details (story or task) and codebase context
   */
  async generateFeatureFile(
    issueDetails: StoryDetails | TaskDetails,
    codebaseContext: CodebaseContext
  ): Promise<FeatureFile> {
    try {
      // Build AI prompts with advanced prompt engineering
      const prompts = this.promptBuilder.buildPrompts(issueDetails, codebaseContext);
      
      // Generate Gherkin content using AI with structured prompts
      const gherkinContent = await this.generateGherkinContent(prompts.systemPrompt, prompts.userPrompt);
      
      // Parse and validate the generated content
      const featureFile = this.parser.parse(gherkinContent);
      
      // Ensure all scenarios have proper tags and references
      const enhancedFeatureFile = this.enhanceFeatureFile(featureFile, issueDetails);
      
      return enhancedFeatureFile;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate Gherkin content: ${error.message}`);
      }
      throw new Error('Failed to generate Gherkin content: Unknown error');
    }
  }

  /**
   * Generate tags for scenarios based on story ID and scenario type
   */
  generateTags(storyId: string, scenarioType: ScenarioType): string[] {
    const tags = [`@${storyId}`];
    
    switch (scenarioType) {
      case 'happy':
        tags.push('@smoke');
        break;
      case 'negative':
        tags.push('@negative');
        break;
      case 'edge':
        tags.push('@regression');
        break;
    }
    
    return tags;
  }

  /**
   * Build comprehensive AI prompt with story details and domain context
   * @deprecated Use promptBuilder.buildPrompts() instead
   */
  buildPrompt(issueDetails: StoryDetails | TaskDetails, codebaseContext: CodebaseContext): string {
    const prompts = this.promptBuilder.buildPrompts(issueDetails, codebaseContext);
    return prompts.userPrompt;
  }

  /**
   * Validate generated content against requirements
   */
  private validateGeneratedContent(
    featureFile: FeatureFile, 
    issueDetails: StoryDetails | TaskDetails
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if all scenarios have issue ID tags
    const issueIdTag = `@${issueDetails.id}`;
    featureFile.scenarios.forEach((scenario, index) => {
      if (!scenario.tags.includes(issueIdTag)) {
        issues.push(`Scenario ${index + 1} missing issue ID tag ${issueIdTag}`);
      }
    });

    // Check if all scenarios have AC references
    featureFile.scenarios.forEach((scenario, index) => {
      if (!scenario.acReference || !scenario.acReference.match(/^AC-\d+$/)) {
        issues.push(`Scenario ${index + 1} missing or invalid AC reference`);
      }
    });

    // Check if scenarios have appropriate test type tags
    const validTestTypeTags = ['@smoke', '@negative', '@regression'];
    featureFile.scenarios.forEach((scenario, index) => {
      const hasTestTypeTag = scenario.tags.some(tag => validTestTypeTags.includes(tag));
      if (!hasTestTypeTag) {
        issues.push(`Scenario ${index + 1} missing test type tag (smoke, negative, or regression)`);
      }
    });

    // Check minimum scenario coverage
    if (featureFile.scenarios.length < issueDetails.acceptanceCriteria.length) {
      issues.push(`Insufficient scenario coverage: ${featureFile.scenarios.length} scenarios for ${issueDetails.acceptanceCriteria.length} acceptance criteria`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate Gherkin content using OpenAI API with structured prompts
   */
  private async generateGherkinContent(systemPrompt: string, userPrompt: string): Promise<string> {
    if (this.isMockMode) {
      return this.generateMockGherkinContent(userPrompt);
    }

    try {
      const response = await this.openai!.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated by AI service');
      }

      return content.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('AI service request failed');
    }
  }

  /**
   * Generate mock Gherkin content for demo purposes
   */
  private generateMockGherkinContent(userPrompt: string): string {
    // Extract story ID from prompt if possible
    const storyIdMatch = userPrompt.match(/STORY:\s*([A-Z]+-\d+)/);
    const storyId = storyIdMatch ? storyIdMatch[1] : 'DEMO-123';
    
    // Extract story title from prompt if possible
    const titleMatch = userPrompt.match(/STORY:\s*[A-Z]+-\d+[:\s]*(.+?)(?:\n|DESCRIPTION:)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Demo Feature';

    return `Feature: ${title}
  As a user
  I want to use this feature
  So that I can achieve my goals

  # AC-1
  @${storyId} @smoke
  Scenario: Happy path scenario
    Given I am a valid user
    When I perform the main action
    Then I should see the expected result
    And the system should be in the correct state

  # AC-2  
  @${storyId} @negative
  Scenario: Error handling scenario
    Given I am in an invalid state
    When I attempt the action
    Then I should see an appropriate error message
    And the system should handle the error gracefully

  # AC-3
  @${storyId} @regression
  Scenario: Edge case scenario
    Given I have edge case conditions
    When I perform the action with boundary values
    Then the system should handle it correctly
    And maintain data integrity`;
  }

  /**
   * Generate Gherkin content with validation and refinement
   */
  async generateWithValidation(
    issueDetails: StoryDetails | TaskDetails,
    codebaseContext: CodebaseContext,
    maxRetries: number = 2
  ): Promise<FeatureFile> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const featureFile = await this.generateFeatureFile(issueDetails, codebaseContext);
        
        // Validate the generated content
        const validationResult = this.validateGeneratedContent(featureFile, issueDetails);
        
        if (validationResult.isValid) {
          return featureFile;
        }
        
        // If not the last attempt, try to refine the content
        if (attempt < maxRetries) {
          // For now, just retry with the same approach
          // In the future, we could implement refinement logic here
          continue;
        }
        
        throw new Error(`Generated content validation failed: ${validationResult.issues.join(', ')}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('Failed to generate valid Gherkin content');
  }

  /**
   * Enhance feature file with proper tags and metadata
   */
  private enhanceFeatureFile(featureFile: FeatureFile, issueDetails: StoryDetails | TaskDetails): FeatureFile {
    const enhancedScenarios = featureFile.scenarios.map((scenario, index) => {
      // Ensure scenario has proper AC reference if missing
      const acReference = scenario.acReference || `AC-${index + 1}`;
      
      // Ensure scenario has issue ID tag
      const issueTag = `@${issueDetails.id}`;
      const tags = scenario.tags.includes(issueTag) 
        ? scenario.tags 
        : [issueTag, ...scenario.tags];
      
      return {
        ...scenario,
        acReference,
        tags,
      };
    });

    return {
      ...featureFile,
      scenarios: enhancedScenarios,
      metadata: {
        ...featureFile.metadata,
        storyId: issueDetails.id,
        generatedAt: new Date(),
      },
    };
  }
}