/**
 * Unit tests for GherkinParser edge cases
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect } from 'vitest';
import { GherkinParser } from '../services/gherkin-parser.js';

describe('GherkinParser Edge Cases', () => {
  const parser = new GherkinParser();

  describe('Malformed Gherkin syntax handling', () => {
    it('should throw error for missing Feature declaration', () => {
      const malformedContent = `
        Scenario: Test scenario
          Given I have a step
      `;
      
      expect(() => parser.parse(malformedContent)).toThrow('No Feature declaration found');
    });

    it('should throw error for feature with no scenarios', () => {
      const malformedContent = `Feature: Empty Feature`;
      
      expect(() => parser.parse(malformedContent)).toThrow('Feature must have at least one scenario');
    });

    it('should throw error for scenario with no steps', () => {
      const malformedContent = `
        Feature: Test Feature
        
        Scenario: Empty Scenario
      `;
      
      expect(() => parser.parse(malformedContent)).toThrow('Scenario must have at least one step');
    });

    it('should throw error for invalid step line', () => {
      const malformedContent = `
        Feature: Test Feature
        
        Scenario: Test Scenario
          Invalid step line
      `;
      
      expect(() => parser.parse(malformedContent)).toThrow('Invalid step line: Invalid step line');
    });

    it('should handle empty feature title gracefully', () => {
      const malformedContent = `
        Feature:
        
        Scenario: Test Scenario
          Given I have a step
      `;
      
      expect(() => parser.parse(malformedContent)).toThrow('Feature must have a title');
    });

    it('should handle empty scenario title gracefully', () => {
      const malformedContent = `
        Feature: Test Feature
        
        Scenario:
          Given I have a step
      `;
      
      expect(() => parser.parse(malformedContent)).toThrow('Scenario must have a title');
    });
  });

  describe('Special characters and Unicode content', () => {
    it('should handle Unicode characters in feature title', () => {
      const unicodeContent = `
        Feature: Test Feature with émojis 🚀 and ñoñó
        
        Scenario: Unicode scenario
          Given I have a step with émojis 🎉
      `;
      
      const result = parser.parse(unicodeContent);
      expect(result.feature.title).toBe('Test Feature with émojis 🚀 and ñoñó');
      expect(result.scenarios[0].steps[0].text).toBe('I have a step with émojis 🎉');
    });

    it('should handle special characters in step text', () => {
      const specialCharsContent = `
        Feature: Special Characters Feature
        
        Scenario: Special chars scenario
          Given I have "quotes" and 'apostrophes'
          When I use symbols: @#$%^&*()
          Then I see results with <brackets> and [arrays]
      `;
      
      const result = parser.parse(specialCharsContent);
      expect(result.scenarios[0].steps[0].text).toBe('I have "quotes" and \'apostrophes\'');
      expect(result.scenarios[0].steps[1].text).toBe('I use symbols: @#$%^&*()');
      expect(result.scenarios[0].steps[2].text).toBe('I see results with <brackets> and [arrays]');
    });

    it('should handle multiline feature descriptions', () => {
      const multilineContent = `
        Feature: Multiline Feature
          This is a feature description
          that spans multiple lines
          with various details
        
        Scenario: Test scenario
          Given I have a step
      `;
      
      const result = parser.parse(multilineContent);
      expect(result.feature.description).toEqual([
        '        This is a feature description',
        '        that spans multiple lines',
        '        with various details'
      ]);
    });
  });

  describe('Comments and assumptions extraction', () => {
    it('should extract multiple AC references', () => {
      const contentWithMultipleACs = `
        Feature: Multi AC Feature
        
        # AC-1
        Scenario: First scenario
          Given I have a step
        
        # AC-2
        Scenario: Second scenario
          Given I have another step
      `;
      
      const result = parser.parse(contentWithMultipleACs);
      expect(result.scenarios[0].acReference).toBe('AC-1');
      expect(result.scenarios[1].acReference).toBe('AC-2');
    });

    it('should extract assumptions from comments', () => {
      const contentWithAssumptions = `
        Feature: Assumptions Feature
        
        # AC-1
        # ASSUMPTION: User is logged in
        # ASSUMPTION: Database is available
        Scenario: Scenario with assumptions
          Given I have a step
      `;
      
      const result = parser.parse(contentWithAssumptions);
      expect(result.scenarios[0].assumptions).toEqual([
        'User is logged in',
        'Database is available'
      ]);
    });

    it('should ignore regular comments', () => {
      const contentWithComments = `
        Feature: Comments Feature
        
        # This is a regular comment
        # AC-1
        # Another regular comment
        Scenario: Test scenario
          Given I have a step
          # Step comment should be ignored
      `;
      
      const result = parser.parse(contentWithComments);
      expect(result.scenarios[0].acReference).toBe('AC-1');
      expect(result.scenarios[0].assumptions).toBeUndefined();
    });
  });

  describe('Tags parsing', () => {
    it('should parse multiple tags on same line', () => {
      const contentWithTags = `
        Feature: Tagged Feature
        
        # AC-1
        @smoke @regression @PROJ-123
        Scenario: Tagged scenario
          Given I have a step
      `;
      
      const result = parser.parse(contentWithTags);
      expect(result.scenarios[0].tags).toEqual(['@smoke', '@regression', '@PROJ-123']);
    });

    it('should parse tags on multiple lines', () => {
      const contentWithMultilineTags = `
        Feature: Multi-tag Feature
        
        # AC-1
        @smoke
        @regression
        @PROJ-123
        Scenario: Multi-tag scenario
          Given I have a step
      `;
      
      const result = parser.parse(contentWithMultilineTags);
      expect(result.scenarios[0].tags).toEqual(['@smoke', '@regression', '@PROJ-123']);
    });

    it('should infer scenario type from tags', () => {
      const contentWithTypeTags = `
        Feature: Type Inference Feature
        
        # AC-1
        @smoke
        Scenario: Smoke scenario
          Given I have a step
        
        # AC-2
        @negative
        Scenario: Negative scenario
          Given I have a step
        
        # AC-3
        @regression
        Scenario: Regression scenario
          Given I have a step
      `;
      
      const result = parser.parse(contentWithTypeTags);
      expect(result.scenarios[0].type).toBe('happy');
      expect(result.scenarios[1].type).toBe('negative');
      expect(result.scenarios[2].type).toBe('edge');
    });
  });

  describe('Examples table parsing', () => {
    it('should handle examples table with multiple columns', () => {
      const contentWithExamples = `
        Feature: Examples Feature
        
        # AC-1
        Scenario Outline: Multi-column examples
          Given I have <input> and <value>
          When I process <action>
          Then I get <result>
        
        Examples:
          | input | value | action | result |
          | test1 | 100   | add    | pass   |
          | test2 | 200   | sub    | fail   |
      `;
      
      const result = parser.parse(contentWithExamples);
      expect(result.scenarios[0].examples?.headers).toEqual([' input ', ' value ', ' action ', ' result ']);
      expect(result.scenarios[0].examples?.rows).toEqual([
        [' test1 ', ' 100   ', ' add    ', ' pass   '],
        [' test2 ', ' 200   ', ' sub    ', ' fail   ']
      ]);
    });

    it('should handle examples table with empty cells', () => {
      const contentWithEmptyCells = `
        Feature: Empty Cells Feature
        
        # AC-1
        Scenario Outline: Empty cells examples
          Given I have <input>
        
        Examples:
          | input |
          |       |
          | test  |
      `;
      
      const result = parser.parse(contentWithEmptyCells);
      expect(result.scenarios[0].examples?.rows).toEqual([
        ['       '],
        [' test  ']
      ]);
    });
  });

  describe('Story ID extraction', () => {
    it('should extract story ID from scenario tags', () => {
      const contentWithStoryId = `
        Feature: Story ID Feature
        
        # AC-1
        @PROJ-123 @smoke
        Scenario: Test scenario
          Given I have a step
      `;
      
      const result = parser.parse(contentWithStoryId);
      expect(result.metadata.storyId).toBe('PROJ-123');
    });

    it('should return UNKNOWN when no story ID found', () => {
      const contentWithoutStoryId = `
        Feature: No Story ID Feature
        
        # AC-1
        @smoke @regression
        Scenario: Test scenario
          Given I have a step
      `;
      
      const result = parser.parse(contentWithoutStoryId);
      expect(result.metadata.storyId).toBe('UNKNOWN');
    });

    it('should extract first valid story ID when multiple exist', () => {
      const contentWithMultipleStoryIds = `
        Feature: Multiple Story IDs Feature
        
        # AC-1
        @PROJ-123 @smoke
        Scenario: First scenario
          Given I have a step
        
        # AC-2
        @FEAT-456 @regression
        Scenario: Second scenario
          Given I have another step
      `;
      
      const result = parser.parse(contentWithMultipleStoryIds);
      expect(result.metadata.storyId).toBe('PROJ-123');
    });
  });

  describe('Whitespace and formatting handling', () => {
    it('should handle inconsistent indentation', () => {
      const inconsistentContent = `
Feature: Inconsistent Indentation

    # AC-1
      @smoke
Scenario: Inconsistent scenario
Given I have a step
    When I do something
        Then I see result
      `;
      
      const result = parser.parse(inconsistentContent);
      expect(result.scenarios[0].steps).toHaveLength(3);
      expect(result.scenarios[0].steps[0].keyword).toBe('Given');
      expect(result.scenarios[0].steps[1].keyword).toBe('When');
      expect(result.scenarios[0].steps[2].keyword).toBe('Then');
    });

    it('should handle extra blank lines', () => {
      const contentWithBlankLines = `


        Feature: Blank Lines Feature


        # AC-1


        @smoke
        Scenario: Test scenario


          Given I have a step


          When I do something


      `;
      
      const result = parser.parse(contentWithBlankLines);
      expect(result.feature.title).toBe('Blank Lines Feature');
      expect(result.scenarios[0].steps).toHaveLength(2);
    });

    it('should preserve trailing whitespace from lines', () => {
      const contentWithTrailingSpaces = `Feature: Trailing Spaces   \n\n  # AC-1   \n  @smoke   \n  Scenario: Test scenario   \n    Given I have a step   `;
      
      const result = parser.parse(contentWithTrailingSpaces);
      expect(result.feature.title).toBe('Trailing Spaces   ');
      expect(result.scenarios[0].title).toBe('Test scenario   ');
      expect(result.scenarios[0].steps[0].text).toBe('I have a step   ');
    });
  });
});