/**
 * AI prompt builder for Gherkin generation with advanced prompt engineering
 */

import type { StoryDetails, TaskDetails } from '../validation/jira-schemas.js';
import type { CodebaseContext } from '../validation/morpheus-schemas.js';

export interface PromptTemplate {
  systemPrompt: string;
  userPrompt: string;
}

export class GherkinPromptBuilder {
  /**
   * Build comprehensive AI prompts with advanced prompt engineering techniques
   */
  buildPrompts(issueDetails: StoryDetails | TaskDetails, codebaseContext: CodebaseContext): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(issueDetails, codebaseContext);
    
    return { systemPrompt, userPrompt };
  }

  /**
   * Build system prompt with role definition and constraints
   */
  private buildSystemPrompt(): string {
  return `You are a senior QA automation architect and Gherkin specialist with deep expertise in:

- Behavior Driven Development (BDD)
- Enterprise QA strategy
- UI and API test automation
- Boundary and edge case analysis
- Security and validation testing
- Domain-driven test design

Your responsibility is to generate exhaustive and production-grade Gherkin scenarios that simulate how a senior QA engineer would design test coverage.

You must generate scenarios covering ALL possible testing dimensions including:

1. POSITIVE TEST SCENARIOS
   - Happy path workflows
   - Normal user behavior

2. NEGATIVE TEST SCENARIOS
   - Invalid inputs
   - Permission failures
   - System error handling

3. EDGE CASE TESTS
   - Boundary values
   - Empty inputs
   - Maximum limits
   - Special characters
   - Large data sets

4. UI TEST SCENARIOS
   - Form validation
   - Button state validation
   - Navigation flows
   - Error message display
   - Field level validation

5. SECURITY TEST SCENARIOS
   - Unauthorized access
   - Role based restrictions
   - Input sanitization

6. DATA VALIDATION TESTS
   - Data persistence
   - Data formatting
   - Database integrity

7. API TEST SCENARIOS (if applicable)
   - API response validation
   - Invalid payload handling
   - HTTP status code validation

CRITICAL REQUIREMENTS:

- Always start with "Feature:"
- Use correct Gherkin syntax
- Use business readable language
- Avoid implementation details
- Use domain terminology when possible
- Generate as many scenarios as required to achieve complete test coverage

OUTPUT FORMAT:
Return only valid Gherkin feature content. Do not include explanations.`;
}

  /**
   * Build user prompt with issue context and structured instructions
   */
  private buildUserPrompt(issueDetails: StoryDetails | TaskDetails, codebaseContext: CodebaseContext): string {
    const contextSection = this.buildContextSection(codebaseContext);
    const examplesSection = this.buildExamplesSection(issueDetails);
    const instructionsSection = this.buildInstructionsSection(issueDetails);

    return `${this.buildIssueSection(issueDetails)}

${contextSection}

${instructionsSection}

${examplesSection}

Generate the complete Gherkin feature file now:`;
  }

  /**
   * Build issue details section (works for both stories and tasks)
   */
  private buildIssueSection(issueDetails: StoryDetails | TaskDetails): string {
    return `STORY DETAILS:
Title: ${issueDetails.title}
ID: ${issueDetails.id}
Description: ${issueDetails.description}

ACCEPTANCE CRITERIA:
${issueDetails.acceptanceCriteria.map((ac, i) => `AC-${i + 1}: ${ac}`).join('\n')}`;
  }

  /**
   * Build domain context section with intelligent categorization
   */
  private buildContextSection(codebaseContext: CodebaseContext): string {
    const sections = [];

    if (codebaseContext.entities.length > 0) {
      sections.push(`Domain Entities: ${codebaseContext.entities.join(', ')}`);
    }

    if (codebaseContext.workflows.length > 0) {
      sections.push(`Business Workflows: ${codebaseContext.workflows.join(', ')}`);
    }

    if (codebaseContext.businessRules.length > 0) {
      sections.push(`Business Rules: ${codebaseContext.businessRules.join(', ')}`);
    }

    if (codebaseContext.apiEndpoints.length > 0) {
      sections.push(`API Endpoints: ${codebaseContext.apiEndpoints.join(', ')}`);
    }

    if (codebaseContext.uiComponents.length > 0) {
      sections.push(`UI Components: ${codebaseContext.uiComponents.join(', ')}`);
    }

    if (sections.length === 0) {
      return `DOMAIN CONTEXT:
No specific domain context available. Use generic business language.`;
    }

    return `DOMAIN CONTEXT:
${sections.join('\n')}

Use this domain-specific terminology in your Gherkin scenarios to make them realistic and maintainable.`;
  }

  /**
   * Build structured instructions section
   */
  private buildInstructionsSection(issueDetails: StoryDetails | TaskDetails): string {
    return `GENERATION REQUIREMENTS:

1. COVERAGE REQUIREMENTS:
   Generate comprehensive scenarios including:

   POSITIVE TESTS:
   - Happy path scenarios
   - Standard user workflows
   - Valid input processing

   NEGATIVE TESTS:
   - Invalid inputs
   - Error handling
   - Permission failures
   - Authentication failures

   EDGE CASE TESTS:
   - Boundary values
   - Empty values
   - Maximum limits
   - Special characters
   - Large data inputs

   UI TEST SCENARIOS:
   - UI validation
   - Field validation
   - Button states
   - Page navigation
   - Form validation
   - UI error messages

   SECURITY TESTS:
   - Unauthorized access
   - Role-based access control
   - Input sanitization
   - Injection attempts

   API TESTS (if APIs are mentioned):
   - API response validation
   - Invalid payload handling
   - Status code validation

   DATA VALIDATION TESTS:
   - Database consistency
   - Data persistence
   - Data formatting validation

2. TAGGING REQUIREMENTS:
   - Tag every scenario with @${issueDetails.id}
   - Use scenario type tags such as:
     @positive
     @negative
     @edge
     @ui
     @security
     @validation
     @api
     @regression
     @smoke

3. TRACEABILITY REQUIREMENTS:
   - Add AC reference comments before each scenario (# AC-1, # AC-2, etc.)
   - Add assumption comments (# ASSUMPTION: <text>) for any ambiguous requirements

4. SCENARIO STRUCTURE:
   - Use Scenario Outline with Examples tables for data-driven tests when appropriate
   - Write clear, business-readable step descriptions
   - Use domain terminology from the context provided
   - Avoid technical implementation details

5. QUALITY REQUIREMENTS:
   - Ensure proper Gherkin syntax and indentation
   - Use realistic test data and user personas
   - Make scenarios independent and maintainable
   - Focus on business value and user outcomes`;
  }

  /**
   * Build examples section with scenario templates
   */
  private buildExamplesSection(issueDetails: StoryDetails | TaskDetails): string {
    return `EXAMPLE FORMAT:

Feature: ${issueDetails.title}
  ${this.truncateDescription(issueDetails.description)}

  # AC-1
  @smoke @${issueDetails.id}
  Scenario: [Descriptive scenario title]
    Given [precondition using domain terminology]
    When [action performed by user]
    Then [expected outcome in business terms]

  # AC-2  
  @negative @${issueDetails.id}
  Scenario: [Error case scenario title]
    Given [error condition setup]
    When [invalid action attempted]
    Then [appropriate error handling]

  # AC-3
  @regression @${issueDetails.id}
  Scenario Outline: [Data-driven scenario title]
    Given [parameterized precondition]
    When [action with <parameter>]
    Then [expected result with <parameter>]
    
    Examples:
      | parameter | expected_result |
      | value1    | result1        |
      | value2    | result2        |`;
  }

  /**
   * Truncate description for examples while preserving meaning
   */
  private truncateDescription(description: string): string {
    if (description.length <= 100) {
      return description;
    }
    
    const truncated = description.substring(0, 97);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 50) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Build validation prompt for generated content
   */
  buildValidationPrompt(generatedContent: string): string {
    return `Please validate this Gherkin content for:
1. Proper syntax and formatting
2. Complete scenario coverage
3. Appropriate tagging
4. Business-readable language

Content to validate:
${generatedContent}

Respond with "VALID" if the content meets all requirements, or list specific issues that need to be fixed.`;
  }

  /**
   * Build refinement prompt for improving generated content
   */
  buildRefinementPrompt(
    originalContent: string, 
    issues: string[], 
    issueDetails: StoryDetails | TaskDetails
  ): string {
    return `Please refine this Gherkin content to address the following issues:

ISSUES TO FIX:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

ORIGINAL CONTENT:
${originalContent}

STORY CONTEXT:
- Story ID: ${issueDetails.id}
- Title: ${issueDetails.title}

Please provide the corrected Gherkin content that addresses all issues while maintaining the original intent and coverage.`;
  }
}