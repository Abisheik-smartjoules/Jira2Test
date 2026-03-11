/**
 * Property-based tests for GherkinGeneratorService
 * **Property 3: Generated scenarios always include required tags and AC references**
 * **Validates: Requirements 5.6, 5.7**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { GherkinGeneratorService } from '../services/gherkin-generator.js';
import type { StoryDetails } from '../validation/jira-schemas.js';
import type { CodebaseContext } from '../validation/morpheus-schemas.js';

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

describe('GherkinGeneratorService Property Tests', () => {
  let service: GherkinGeneratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GherkinGeneratorService({ apiKey: 'test-key' });
  });

  describe('Property 3: Generated scenarios always include required tags and AC references', () => {
    // Generator for valid story IDs (PROJECT-123 format)
    const storyIdArb = fc.tuple(
      fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E'), { minLength: 2, maxLength: 5 }).map(arr => arr.join('')),
      fc.integer({ min: 1, max: 9999 })
    ).map(([project, num]) => `${project}-${num}`);

    // Generator for story details
    const storyDetailsArb = fc.record({
      id: storyIdArb,
      title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
      description: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
      acceptanceCriteria: fc.array(
        fc.string({ minLength: 10, maxLength: 200 }).filter(s => s.trim().length >= 10), 
        { minLength: 1, maxLength: 5 }
      ),
      status: fc.constantFrom('To Do', 'In Progress', 'Ready for QA', 'Done'),
      assignee: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
    });

    // Generator for codebase context
    const codebaseContextArb = fc.record({
      entities: fc.array(fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3), { maxLength: 10 }),
      workflows: fc.array(fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3), { maxLength: 10 }),
      businessRules: fc.array(fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5), { maxLength: 10 }),
      apiEndpoints: fc.array(fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5), { maxLength: 10 }),
      uiComponents: fc.array(fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3), { maxLength: 10 }),
    });

    // Helper to generate valid Gherkin content for mocking
    const generateMockGherkinContent = (storyDetails: StoryDetails): string => {
      const scenarios = storyDetails.acceptanceCriteria.map((ac, index) => {
        const acRef = `AC-${index + 1}`;
        const scenarioType = index % 3 === 0 ? 'smoke' : index % 3 === 1 ? 'negative' : 'regression';
        
        return `  # ${acRef}
  @${scenarioType} @${storyDetails.id}
  Scenario: ${ac}
    Given some precondition for ${ac}
    When some action occurs
    Then some expected outcome`;
      });

      return `Feature: ${storyDetails.title}
  ${storyDetails.description}

${scenarios.join('\n\n')}`;
    };

    it('should always generate scenarios with story ID tags', async () => {
      await fc.assert(
        fc.asyncProperty(
          storyDetailsArb,
          codebaseContextArb,
          async (storyDetails: StoryDetails, codebaseContext: CodebaseContext) => {
            // Mock OpenAI response with valid Gherkin
            const mockGherkinContent = generateMockGherkinContent(storyDetails);
            mockOpenAI.chat.completions.create.mockResolvedValue({
              choices: [{
                message: {
                  content: mockGherkinContent,
                },
              }],
            });

            const result = await service.generateFeatureFile(storyDetails, codebaseContext);

            // Property: All scenarios must have the story ID tag
            const storyIdTag = `@${storyDetails.id}`;
            result.scenarios.forEach(scenario => {
              expect(scenario.tags).toContain(storyIdTag);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should always generate scenarios with AC references', async () => {
      await fc.assert(
        fc.asyncProperty(
          storyDetailsArb,
          codebaseContextArb,
          async (storyDetails: StoryDetails, codebaseContext: CodebaseContext) => {
            // Mock OpenAI response with valid Gherkin
            const mockGherkinContent = generateMockGherkinContent(storyDetails);
            mockOpenAI.chat.completions.create.mockResolvedValue({
              choices: [{
                message: {
                  content: mockGherkinContent,
                },
              }],
            });

            const result = await service.generateFeatureFile(storyDetails, codebaseContext);

            // Property: All scenarios must have AC references in the correct format
            result.scenarios.forEach(scenario => {
              expect(scenario.acReference).toMatch(/^AC-\d+$/);
            });

            // Property: Number of scenarios should be at least the number of acceptance criteria
            expect(result.scenarios.length).toBeGreaterThanOrEqual(storyDetails.acceptanceCriteria.length);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should always generate scenarios with appropriate test type tags', async () => {
      await fc.assert(
        fc.asyncProperty(
          storyDetailsArb,
          codebaseContextArb,
          async (storyDetails: StoryDetails, codebaseContext: CodebaseContext) => {
            // Mock OpenAI response with valid Gherkin
            const mockGherkinContent = generateMockGherkinContent(storyDetails);
            mockOpenAI.chat.completions.create.mockResolvedValue({
              choices: [{
                message: {
                  content: mockGherkinContent,
                },
              }],
            });

            const result = await service.generateFeatureFile(storyDetails, codebaseContext);

            // Property: All scenarios must have at least one test type tag
            const validTestTypeTags = ['@smoke', '@negative', '@regression'];
            result.scenarios.forEach(scenario => {
              const hasTestTypeTag = scenario.tags.some(tag => 
                validTestTypeTags.includes(tag)
              );
              expect(hasTestTypeTag).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should generate consistent metadata', async () => {
      await fc.assert(
        fc.asyncProperty(
          storyDetailsArb,
          codebaseContextArb,
          async (storyDetails: StoryDetails, codebaseContext: CodebaseContext) => {
            // Mock OpenAI response with valid Gherkin
            const mockGherkinContent = generateMockGherkinContent(storyDetails);
            mockOpenAI.chat.completions.create.mockResolvedValue({
              choices: [{
                message: {
                  content: mockGherkinContent,
                },
              }],
            });

            const result = await service.generateFeatureFile(storyDetails, codebaseContext);

            // Property: Metadata should always match the input story details
            expect(result.metadata.storyId).toBe(storyDetails.id);
            expect(result.metadata.version).toMatch(/^\d+\.\d+$/);
            expect(result.metadata.generatedAt).toBeInstanceOf(Date);

            // Property: Feature title should match story title
            expect(result.feature.title).toBe(storyDetails.title);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle edge cases gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Edge case: minimal story details
          fc.record({
            id: storyIdArb,
            title: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length >= 1),
            description: fc.string({ minLength: 0, maxLength: 10 }),
            acceptanceCriteria: fc.array(
              fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length >= 1), 
              { minLength: 1, maxLength: 1 }
            ),
            status: fc.constantFrom('To Do', 'In Progress', 'Ready for QA', 'Done'),
            assignee: fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length >= 1),
          }),
          // Edge case: empty codebase context
          fc.record({
            entities: fc.constant([]),
            workflows: fc.constant([]),
            businessRules: fc.constant([]),
            apiEndpoints: fc.constant([]),
            uiComponents: fc.constant([]),
          }),
          async (storyDetails: StoryDetails, codebaseContext: CodebaseContext) => {
            // Mock OpenAI response with minimal valid Gherkin
            const mockGherkinContent = `Feature: ${storyDetails.title}

  # AC-1
  @smoke @${storyDetails.id}
  Scenario: ${storyDetails.acceptanceCriteria[0]}
    Given some precondition
    When some action occurs
    Then some expected outcome`;

            mockOpenAI.chat.completions.create.mockResolvedValue({
              choices: [{
                message: {
                  content: mockGherkinContent,
                },
              }],
            });

            const result = await service.generateFeatureFile(storyDetails, codebaseContext);

            // Property: Even with minimal input, basic requirements must be met
            expect(result.scenarios.length).toBeGreaterThanOrEqual(1);
            expect(result.scenarios[0].tags).toContain(`@${storyDetails.id}`);
            expect(result.scenarios[0].acReference).toMatch(/^AC-\d+$/);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});