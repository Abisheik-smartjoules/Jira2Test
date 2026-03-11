/**
 * Property-based tests for Gherkin round-trip consistency
 * **Validates: Requirements 6.4**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { GherkinParser } from '../services/gherkin-parser.js';
import { GherkinFormatter } from '../services/gherkin-formatter.js';
import { featureFileArb } from './generators/gherkin-generators.js';

describe('Gherkin Round-trip Properties', () => {
  const parser = new GherkinParser();
  const formatter = new GherkinFormatter();

  /**
   * Property 1: Round trip consistency for valid Gherkin content
   * **Validates: Requirements 6.4**
   * 
   * For any valid Gherkin content string:
   * content → parse → format → parse should produce equivalent objects
   */
  it('should maintain round-trip consistency: content → parse → format → parse', () => {
    // Generate simple, valid Gherkin content strings
    const validGherkinArb = fc.record({
      featureTitle: fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s.trim())),
      scenarioTitle: fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s.trim())),
      stepText: fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s.trim())),
      storyId: fc.tuple(
        fc.constantFrom('PROJ', 'TEST'),
        fc.integer({ min: 1, max: 99 })
      ).map(([prefix, num]) => `${prefix}-${num}`),
      scenarioType: fc.constantFrom('smoke', 'negative', 'regression')
    }).map(({ featureTitle, scenarioTitle, stepText, storyId, scenarioType }) => 
      `Feature: ${featureTitle}

  # AC-1
  @${storyId} @${scenarioType}
  Scenario: ${scenarioTitle}
    Given ${stepText}`
    );

    fc.assert(
      fc.property(validGherkinArb, (gherkinContent: string) => {
        // Step 1: Parse the content
        const firstParsed = parser.parse(gherkinContent);
        
        // Step 2: Format it back to content
        const reformattedContent = formatter.format(firstParsed);
        
        // Step 3: Parse again
        const secondParsed = parser.parse(reformattedContent);
        
        // Step 4: Verify the two parsed objects have the same structure
        // Focus on the core properties that should be preserved
        if (firstParsed.feature.title !== secondParsed.feature.title) {
          throw new Error(`Feature title mismatch: "${firstParsed.feature.title}" !== "${secondParsed.feature.title}"`);
        }
        
        if (firstParsed.scenarios.length !== secondParsed.scenarios.length) {
          throw new Error(`Scenario count mismatch: ${firstParsed.scenarios.length} !== ${secondParsed.scenarios.length}`);
        }
        
        const firstScenario = firstParsed.scenarios[0];
        const secondScenario = secondParsed.scenarios[0];
        
        if (firstScenario.title !== secondScenario.title) {
          throw new Error(`Scenario title mismatch: "${firstScenario.title}" !== "${secondScenario.title}"`);
        }
        
        if (firstScenario.type !== secondScenario.type) {
          throw new Error(`Scenario type mismatch: "${firstScenario.type}" !== "${secondScenario.type}"`);
        }
        
        if (firstScenario.steps.length !== secondScenario.steps.length) {
          throw new Error(`Steps count mismatch: ${firstScenario.steps.length} !== ${secondScenario.steps.length}`);
        }
        
        const firstStep = firstScenario.steps[0];
        const secondStep = secondScenario.steps[0];
        
        if (firstStep.keyword !== secondStep.keyword || firstStep.text !== secondStep.text) {
          throw new Error(`Step mismatch: "${firstStep.keyword} ${firstStep.text}" !== "${secondStep.keyword} ${secondStep.text}"`);
        }
        
        return true;
      }),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 2: Parse-format-parse produces equivalent objects
   * **Validates: Requirements 6.4**
   * 
   * For any valid FeatureFile object:
   * featureFile → format → parse should produce an equivalent object
   */
  it('should maintain object equivalence: featureFile → format → parse', () => {
    fc.assert(
      fc.property(featureFileArb, (originalFeatureFile: FeatureFile) => {
        // Step 1: Format the FeatureFile object to Gherkin content
        const gherkinContent = formatter.format(originalFeatureFile);
        
        // Step 2: Parse the formatted content back to a FeatureFile object
        const parsedFeatureFile = parser.parse(gherkinContent);
        
        // Step 3: Verify structural equivalence
        // Feature comparison
        if (originalFeatureFile.feature.title !== parsedFeatureFile.feature.title) {
          throw new Error(`Feature title mismatch: "${originalFeatureFile.feature.title}" !== "${parsedFeatureFile.feature.title}"`);
        }
        
        if (originalFeatureFile.feature.description.length !== parsedFeatureFile.feature.description.length) {
          throw new Error(`Feature description length mismatch: ${originalFeatureFile.feature.description.length} !== ${parsedFeatureFile.feature.description.length}`);
        }
        
        // Compare feature descriptions
        for (let i = 0; i < originalFeatureFile.feature.description.length; i++) {
          if (originalFeatureFile.feature.description[i] !== parsedFeatureFile.feature.description[i]) {
            throw new Error(`Feature description[${i}] mismatch: "${originalFeatureFile.feature.description[i]}" !== "${parsedFeatureFile.feature.description[i]}"`);
          }
        }
        
        // Scenarios comparison
        if (originalFeatureFile.scenarios.length !== parsedFeatureFile.scenarios.length) {
          throw new Error(`Scenario count mismatch: ${originalFeatureFile.scenarios.length} !== ${parsedFeatureFile.scenarios.length}`);
        }
        
        // Compare each scenario
        for (let i = 0; i < originalFeatureFile.scenarios.length; i++) {
          const originalScenario = originalFeatureFile.scenarios[i];
          const parsedScenario = parsedFeatureFile.scenarios[i];
          
          if (originalScenario.title !== parsedScenario.title) {
            throw new Error(`Scenario[${i}] title mismatch: "${originalScenario.title}" !== "${parsedScenario.title}"`);
          }
          
          if (originalScenario.acReference !== parsedScenario.acReference) {
            throw new Error(`Scenario[${i}] AC reference mismatch: "${originalScenario.acReference}" !== "${parsedScenario.acReference}"`);
          }
          
          // Compare steps
          if (originalScenario.steps.length !== parsedScenario.steps.length) {
            throw new Error(`Scenario[${i}] steps count mismatch: ${originalScenario.steps.length} !== ${parsedScenario.steps.length}`);
          }
          
          for (let j = 0; j < originalScenario.steps.length; j++) {
            const originalStep = originalScenario.steps[j];
            const parsedStep = parsedScenario.steps[j];
            
            if (originalStep.keyword !== parsedStep.keyword || originalStep.text !== parsedStep.text) {
              throw new Error(`Scenario[${i}] step[${j}] mismatch: "${originalStep.keyword} ${originalStep.text}" !== "${parsedStep.keyword} ${parsedStep.text}"`);
            }
          }
          
          // Compare examples tables if present
          if (originalScenario.examples && parsedScenario.examples) {
            if (originalScenario.examples.headers.length !== parsedScenario.examples.headers.length) {
              throw new Error(`Scenario[${i}] examples headers count mismatch`);
            }
            
            for (let h = 0; h < originalScenario.examples.headers.length; h++) {
              if (originalScenario.examples.headers[h] !== parsedScenario.examples.headers[h]) {
                throw new Error(`Scenario[${i}] examples header[${h}] mismatch: "${originalScenario.examples.headers[h]}" !== "${parsedScenario.examples.headers[h]}"`);
              }
            }
            
            if (originalScenario.examples.rows.length !== parsedScenario.examples.rows.length) {
              throw new Error(`Scenario[${i}] examples rows count mismatch`);
            }
            
            for (let r = 0; r < originalScenario.examples.rows.length; r++) {
              const originalRow = originalScenario.examples.rows[r];
              const parsedRow = parsedScenario.examples.rows[r];
              
              if (originalRow.length !== parsedRow.length) {
                throw new Error(`Scenario[${i}] examples row[${r}] length mismatch`);
              }
              
              for (let c = 0; c < originalRow.length; c++) {
                if (originalRow[c] !== parsedRow[c]) {
                  throw new Error(`Scenario[${i}] examples row[${r}] col[${c}] mismatch: "${originalRow[c]}" !== "${parsedRow[c]}"`);
                }
              }
            }
          } else if (originalScenario.examples !== parsedScenario.examples) {
            throw new Error(`Scenario[${i}] examples presence mismatch: ${!!originalScenario.examples} !== ${!!parsedScenario.examples}`);
          }
          
          // Compare assumptions if present
          if (originalScenario.assumptions && parsedScenario.assumptions) {
            if (originalScenario.assumptions.length !== parsedScenario.assumptions.length) {
              throw new Error(`Scenario[${i}] assumptions count mismatch`);
            }
            
            for (let a = 0; a < originalScenario.assumptions.length; a++) {
              if (originalScenario.assumptions[a] !== parsedScenario.assumptions[a]) {
                throw new Error(`Scenario[${i}] assumption[${a}] mismatch: "${originalScenario.assumptions[a]}" !== "${parsedScenario.assumptions[a]}"`);
              }
            }
          } else if (originalScenario.assumptions !== parsedScenario.assumptions) {
            throw new Error(`Scenario[${i}] assumptions presence mismatch: ${!!originalScenario.assumptions} !== ${!!parsedScenario.assumptions}`);
          }
        }
        
        return true;
      }),
      { 
        numRuns: 100,
        verbose: true
      }
    );
  });

  /**
   * Property 2: Formatting preserves immutability
   * **Validates: Requirements 6.4 + Immutability principles**
   */
  it('should not mutate objects during formatting', () => {
    const simpleGherkinContent = `Feature: Test Feature

  # AC-1
  @PROJ-123 @smoke
  Scenario: Test Scenario
    Given I have a test
    When I run the test
    Then it should pass`;

    fc.assert(
      fc.property(fc.constant(simpleGherkinContent), (content: string) => {
        // Parse the content
        const featureFile = parser.parse(content);
        
        // Create a deep copy for comparison
        const originalCopy = JSON.parse(JSON.stringify(featureFile));
        
        // Format the feature file
        formatter.format(featureFile);
        
        // Verify the original wasn't mutated by comparing key properties
        if (featureFile.feature.title !== originalCopy.feature.title) {
          throw new Error('Feature title was mutated during formatting');
        }
        
        if (featureFile.scenarios.length !== originalCopy.scenarios.length) {
          throw new Error('Scenarios array was mutated during formatting');
        }
        
        if (featureFile.scenarios[0].title !== originalCopy.scenarios[0].title) {
          throw new Error('Scenario title was mutated during formatting');
        }
        
        return true;
      }),
      { 
        numRuns: 50,
        verbose: true
      }
    );
  });

  /**
   * Property 3: Parsing produces independent objects
   * **Validates: Requirements 6.4 + Immutability principles**
   */
  it('should produce independent objects on multiple parses', () => {
    const simpleGherkinContent = `Feature: Test Feature

  # AC-1
  @PROJ-123 @smoke
  Scenario: Test Scenario
    Given I have a test`;

    fc.assert(
      fc.property(fc.constant(simpleGherkinContent), (content: string) => {
        // Parse twice
        const firstParsed = parser.parse(content);
        const secondParsed = parser.parse(content);
        
        // Verify they have the same content
        if (firstParsed.feature.title !== secondParsed.feature.title) {
          throw new Error('Parsed objects have different content');
        }
        
        // Verify they are different object references
        if (firstParsed === secondParsed) {
          throw new Error('Parser returned the same object reference');
        }
        
        if (firstParsed.scenarios === secondParsed.scenarios) {
          throw new Error('Parser returned the same scenarios array reference');
        }
        
        if (firstParsed.feature === secondParsed.feature) {
          throw new Error('Parser returned the same feature object reference');
        }
        
        return true;
      }),
      { 
        numRuns: 20,
        verbose: true
      }
    );
  });

  /**
   * Property 4: Valid Gherkin always parses successfully
   * **Validates: Requirements 6.1, 6.2**
   */
  it('should successfully parse any valid Gherkin content', () => {
    const validGherkinArb = fc.record({
      featureTitle: fc.string({ minLength: 5, maxLength: 15 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s.trim())),
      scenarioTitle: fc.string({ minLength: 5, maxLength: 15 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s.trim())),
      stepText: fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s.trim())),
      storyId: fc.constantFrom('PROJ-1', 'TEST-2', 'FEAT-3')
    }).map(({ featureTitle, scenarioTitle, stepText, storyId }) => 
      `Feature: ${featureTitle}

  # AC-1
  @${storyId} @smoke
  Scenario: ${scenarioTitle}
    Given ${stepText}`
    );

    fc.assert(
      fc.property(validGherkinArb, (gherkinContent: string) => {
        // Should not throw an error
        const parsed = parser.parse(gherkinContent);
        
        // Should have basic structure
        if (!parsed.feature || !parsed.scenarios || parsed.scenarios.length === 0) {
          throw new Error('Parsed result missing required structure');
        }
        
        if (!parsed.feature.title || parsed.feature.title.trim().length === 0) {
          throw new Error('Parsed feature missing title');
        }
        
        if (!parsed.scenarios[0].title || parsed.scenarios[0].title.trim().length === 0) {
          throw new Error('Parsed scenario missing title');
        }
        
        if (!parsed.scenarios[0].steps || parsed.scenarios[0].steps.length === 0) {
          throw new Error('Parsed scenario missing steps');
        }
        
        return true;
      }),
      { 
        numRuns: 50,
        verbose: true
      }
    );
  });
});