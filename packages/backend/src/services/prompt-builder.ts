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
- Enterprise QA strategy and comprehensive test coverage
- UI and API test automation
- Boundary and edge case analysis
- Security and validation testing
- Domain-driven test design

Your responsibility is to generate EXHAUSTIVE and production-grade Gherkin scenarios that achieve 90-95% test coverage WITHIN EACH test category.

CRITICAL MISSION: Generate comprehensive test scenarios to achieve 90-95% coverage in EVERY category (Functional, Negative, Edge Case, UI, Security, Data, API). This requires 40-60+ scenarios for typical features.

You MUST generate scenarios achieving 90-95% coverage in EACH of these categories:

1. FUNCTIONAL/POSITIVE TESTS (90-95% of all valid workflows):
   Cover ALL valid workflows, user roles, input variations, state transitions, data combinations, navigation paths, and operation sequences.
   MINIMUM: 8-12 scenarios

2. NEGATIVE/ERROR TESTS (90-95% of all failure modes):
   Cover ALL invalid inputs (every field), missing data (every field), duplicates, permissions (all roles), system errors, and business rule violations.
   MINIMUM: 15-25 scenarios

3. EDGE CASE/BOUNDARY TESTS (90-95% of all boundaries):
   Cover ALL numeric boundaries (every field), string boundaries (every field), collection boundaries, special characters (in all fields), extreme data, and timing/concurrency.
   MINIMUM: 12-18 scenarios

4. UI/UX VALIDATION TESTS (90-95% of all UI behaviors):
   Cover ALL form validations (every field), UI states, navigation flows, responsive behavior, and accessibility.
   MINIMUM: 10-15 scenarios

5. SECURITY TESTS (90-95% of all security vectors):
   Cover ALL authentication scenarios, authorization scenarios (all roles), input sanitization (all fields), and data protection.
   MINIMUM: 8-12 scenarios

6. DATA VALIDATION & PERSISTENCE TESTS (90-95% of all data operations):
   Cover ALL CRUD operations, data integrity constraints, data formatting, and data consistency.
   MINIMUM: 8-12 scenarios

7. API TESTS (90-95% of all API behaviors - if applicable):
   Cover ALL request validations, response validations, and error handling.
   MINIMUM: 10-15 scenarios

COVERAGE MANDATE FOR EACH CATEGORY:
- Test EVERY acceptance criterion with 5-8 scenarios minimum
- Test EVERY input field with 6-10 scenarios (2 valid + 4 invalid + 3 boundary + 2 empty/null)
- Test EVERY user action with 10+ scenarios (2-3 success + 4-6 failure + 3-4 edge)
- Test EVERY business rule with 8+ scenarios (2 compliance + 4 violation + 2 edge)
- Use Scenario Outline with 8-15 Examples rows for comprehensive data-driven coverage

TOTAL SCENARIO TARGET: 40-60+ scenarios per feature (more for complex features)

CRITICAL REQUIREMENTS:
- Always start with "Feature:"
- Use correct Gherkin syntax
- Use business-readable language
- Avoid implementation details
- Use domain terminology when available
- Generate EXHAUSTIVE coverage - be thorough, not conservative

OUTPUT FORMAT:
Return only valid Gherkin feature content. Do not include explanations or meta-commentary.`;
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

CRITICAL REMINDER: You MUST generate 40-60+ scenarios to achieve 90-95% coverage in EACH category:
- Functional: 8-12 scenarios
- Negative: 15-25 scenarios  
- Edge Case: 12-18 scenarios
- UI: 10-15 scenarios
- Security: 8-12 scenarios
- Data: 8-12 scenarios
- API: 10-15 scenarios (if applicable)

Do NOT stop at 20-25 scenarios. Generate the FULL comprehensive test suite.

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

CRITICAL TARGET: Achieve 90-95% coverage WITHIN EACH test category below.

1. COMPREHENSIVE COVERAGE REQUIREMENTS:
   You MUST generate extensive scenarios to achieve 90-95% coverage in EACH category. Total scenarios: 40-60+ for typical features.

   A. FUNCTIONAL/POSITIVE TESTS (90-95% coverage of all valid workflows):
      Generate scenarios covering:
      - Primary happy path workflow
      - ALL alternative valid workflows
      - EVERY user role performing valid actions
      - ALL valid input variations (different formats, lengths, types)
      - ALL successful state transitions
      - ALL valid data combinations
      - ALL valid navigation paths
      - ALL valid operation sequences
      - Concurrent valid operations
      - Bulk valid operations
      
      MINIMUM: 8-12 scenarios for comprehensive functional coverage

   B. NEGATIVE/ERROR TESTS (90-95% coverage of all failure modes):
      Generate scenarios covering:
      
      Invalid Inputs (test EVERY field):
      - Wrong data type for each field
      - Invalid format for each field (email, phone, date, etc.)
      - Out of range values for each field
      - Invalid characters for each field
      - Too short/too long values for each field
      
      Missing Data (test EACH field):
      - Each required field missing individually
      - Multiple required fields missing
      - All fields missing
      
      Duplicate/Uniqueness:
      - Duplicate entries when uniqueness required
      - Case-insensitive duplicate detection
      
      Permission/Authorization (test ALL roles):
      - Unauthenticated user attempts
      - Each insufficient permission scenario
      - Expired sessions
      - Invalid/revoked tokens
      - Cross-tenant data access attempts
      
      System Errors:
      - Database connection failures
      - External service unavailability
      - Timeout scenarios
      - Network errors
      - Disk space issues
      - Memory issues
      
      Business Rule Violations:
      - Each invalid state transition
      - Each conflicting operation
      - Each constraint violation
      - Circular dependencies
      - Deadlock scenarios
      
      MINIMUM: 15-25 scenarios for comprehensive negative coverage

   C. EDGE CASE/BOUNDARY TESTS (90-95% coverage of all boundaries):
      Generate scenarios covering:
      
      Numeric Boundaries (for EVERY numeric field):
      - Zero (0)
      - Negative one (-1)
      - Minimum integer value
      - Maximum integer value
      - Just below minimum
      - Just above maximum
      - Decimal precision limits
      
      String Boundaries (for EVERY text field):
      - Empty string ("")
      - Single character
      - Maximum length
      - Maximum length + 1
      - Whitespace only
      - Leading/trailing whitespace
      
      Collection Boundaries:
      - Empty arrays/lists
      - Single item
      - Maximum size
      - Maximum size + 1
      
      Special Characters (test in ALL text fields):
      - Unicode characters (中文, العربية, हिन्दी)
      - Emojis (😀, 🚀, ❤️)
      - HTML special chars (<, >, &, ", ')
      - SQL special chars (', ", --, ;)
      - Script tags (<script>, <iframe>)
      - Newlines and tabs (\n, \t)
      - Null bytes (\0)
      
      Extreme Data:
      - Very long strings (1000+ chars)
      - Very long arrays (1000+ items)
      - Large file uploads (max size, over max)
      - Deeply nested structures
      
      Timing/Concurrency:
      - Rapid successive clicks
      - Concurrent operations
      - Race conditions
      - Stale data scenarios
      
      MINIMUM: 12-18 scenarios for comprehensive edge case coverage

   D. UI/UX VALIDATION TESTS (90-95% coverage of all UI behaviors):
      Generate scenarios covering:
      
      Form Validation (for EVERY field):
      - Real-time validation feedback
      - Field-level error messages
      - Form-level error messages
      - Success messages
      - Validation on blur
      - Validation on submit
      - Clear error on correction
      
      UI State Validation:
      - Button enabled/disabled states
      - Loading indicators appear/disappear
      - Progress feedback updates
      - Confirmation dialogs
      - Modal open/close
      - Dropdown expand/collapse
      - Tooltip display
      
      Navigation Flows:
      - Forward navigation (all paths)
      - Back button behavior
      - Breadcrumb navigation
      - Deep linking
      - Tab navigation
      - Menu navigation
      - Redirect after action
      
      Responsive Behavior:
      - Mobile view (portrait/landscape)
      - Tablet view
      - Desktop view
      - Window resize behavior
      
      Accessibility:
      - Keyboard-only navigation
      - Tab order validation
      - Screen reader announcements
      - Focus management
      - ARIA labels present
      - Color contrast
      
      MINIMUM: 10-15 scenarios for comprehensive UI coverage

   E. SECURITY TESTS (90-95% coverage of all security vectors):
      Generate scenarios covering:
      
      Authentication:
      - Login with invalid credentials
      - Login with empty credentials
      - Session expiration
      - Logout functionality
      - Remember me functionality
      - Password reset flow
      - Account lockout after failed attempts
      
      Authorization:
      - Access without login
      - Each insufficient permission scenario
      - Cross-user data access attempts
      - Privilege escalation attempts
      - Token manipulation
      
      Input Sanitization (test ALL input fields):
      - XSS attempts (<script>, <img onerror>)
      - SQL injection (', ", OR 1=1)
      - Command injection (; rm -rf)
      - Path traversal (../, ..\)
      - LDAP injection
      - XML injection
      
      Data Protection:
      - Sensitive data masking in UI
      - Sensitive data not in logs
      - Secure transmission (HTTPS)
      - CSRF protection
      
      MINIMUM: 8-12 scenarios for comprehensive security coverage

   F. DATA VALIDATION & PERSISTENCE TESTS (90-95% coverage of all data operations):
      Generate scenarios covering:
      
      CRUD Operations:
      - Create and verify saved
      - Read and verify correct data
      - Update and verify changes
      - Delete and verify removal
      - Soft delete vs hard delete
      
      Data Integrity:
      - Foreign key constraints enforced
      - Unique constraints enforced
      - Required field constraints enforced
      - Check constraints enforced
      - Referential integrity maintained
      
      Data Formatting:
      - Date/time formatting correct
      - Number formatting correct
      - Currency formatting correct
      - Text encoding preserved
      - Timezone handling
      
      Data Consistency:
      - Transaction rollback on error
      - Atomic operations
      - Eventual consistency
      - Cache invalidation
      
      MINIMUM: 8-12 scenarios for comprehensive data coverage

   G. API TESTS (90-95% coverage of all API behaviors - if applicable):
      Generate scenarios covering:
      
      Request Validation:
      - Valid request formats
      - Invalid request formats
      - Missing required parameters (each one)
      - Extra unexpected parameters
      - Invalid parameter types
      - Invalid parameter values
      
      Response Validation:
      - Success responses (200, 201, 204)
      - Client error responses (400, 401, 403, 404, 409, 422)
      - Server error responses (500, 502, 503, 504)
      - Response schema validation
      - Response time validation
      - Response header validation
      
      Error Handling:
      - Timeout handling
      - Rate limiting (429)
      - Service unavailability
      - Partial failures
      - Retry logic
      
      MINIMUM: 10-15 scenarios for comprehensive API coverage

2. SCENARIO GENERATION STRATEGY FOR 90-95% COVERAGE:
   - Generate AT LEAST 5-8 scenarios per acceptance criterion
   - For EACH user action: 2-3 success cases + 4-6 failure cases + 3-4 edge cases
   - For EACH input field: 2 valid + 4 invalid + 3 boundary + 2 empty/null cases
   - For EACH business rule: 2 compliance + 4 violation + 2 edge cases
   - Use Scenario Outline with 8-15 Examples rows for comprehensive data-driven coverage
   - Test ALL combinations of critical parameters

3. TAGGING REQUIREMENTS:
   Tag every scenario with:
   - Story ID: @${issueDetails.id}
   - Test type: @smoke, @regression, @sanity
   - Scenario category: @positive, @negative, @edge, @ui, @security, @api, @validation
   - Priority: @critical, @high, @medium, @low
   - Example: @${issueDetails.id} @negative @validation @high

4. TRACEABILITY REQUIREMENTS:
   - Add AC reference before each scenario: # AC-1, # AC-2, etc.
   - Add assumption comments for ambiguous requirements: # ASSUMPTION: <text>
   - Add test objective comments: # TEST OBJECTIVE: <purpose>

5. SCENARIO STRUCTURE BEST PRACTICES:
   - Use Scenario Outline extensively for data-driven tests
   - Include Examples tables with 8-15 test data rows
   - Write declarative steps (what, not how)
   - Use business language, avoid technical jargon
   - Keep scenarios focused and independent
   - Use Background for common setup steps

6. QUALITY REQUIREMENTS:
   - Proper Gherkin syntax and indentation
   - Realistic test data (no "test123" or "foo")
   - Clear, unambiguous step descriptions
   - Scenarios should be executable without modification
   - Each scenario tests ONE specific behavior

MANDATORY: Generate 40-60+ scenarios to achieve 90-95% coverage WITHIN EACH category. Do NOT be conservative - comprehensive coverage requires extensive scenario generation.`;
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