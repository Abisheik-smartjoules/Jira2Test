/**
 * Debug test to understand parser issues
 */

import { describe, it, expect } from 'vitest';
import { GherkinParser } from '../services/gherkin-parser.js';
import { GherkinFormatter } from '../services/gherkin-formatter.js';
import { FeatureFile } from '@jira2test/shared';

describe('Debug Parser Issues', () => {
  const parser = new GherkinParser();
  const formatter = new GherkinFormatter();

  it('should debug simple feature file', () => {
    const simpleFeatureFile: FeatureFile = {
      feature: {
        title: "Simple Feature",
        description: [],
        tags: []
      },
      scenarios: [{
        id: "simple-scenario",
        title: "Simple Scenario",
        tags: ["@test"],
        acReference: "AC-1",
        type: "happy",
        steps: [{
          keyword: "Given",
          text: "I have a simple step"
        }],
        examples: undefined,
        assumptions: undefined
      }],
      metadata: {
        storyId: "TEST-1",
        generatedAt: new Date("2024-01-01T00:00:00.000Z"),
        version: "1.0"
      }
    };

    console.log("Original:", JSON.stringify(simpleFeatureFile, null, 2));
    
    const formatted = formatter.format(simpleFeatureFile);
    console.log("Formatted:", formatted);
    
    const parsed = parser.parse(formatted);
    console.log("Parsed:", JSON.stringify(parsed, null, 2));
    
    expect(parsed.scenarios[0].tags).toEqual(simpleFeatureFile.scenarios[0].tags);
  });

  it('should debug feature with examples', () => {
    const featureWithExamples: FeatureFile = {
      feature: {
        title: "Feature with Examples",
        description: [],
        tags: []
      },
      scenarios: [{
        id: "scenario-with-examples",
        title: "Scenario with Examples",
        tags: ["@test"],
        acReference: "AC-1",
        type: "happy",
        steps: [{
          keyword: "Given",
          text: "I have a <value>"
        }],
        examples: {
          headers: ["value"],
          rows: [["test1"], ["test2"]]
        },
        assumptions: undefined
      }],
      metadata: {
        storyId: "TEST-1",
        generatedAt: new Date("2024-01-01T00:00:00.000Z"),
        version: "1.0"
      }
    };

    console.log("Original with examples:", JSON.stringify(featureWithExamples, null, 2));
    
    const formatted = formatter.format(featureWithExamples);
    console.log("Formatted with examples:", formatted);
    
    const parsed = parser.parse(formatted);
    console.log("Parsed with examples:", JSON.stringify(parsed, null, 2));
    
    expect(parsed.scenarios[0].examples).toBeDefined();
    expect(parsed.scenarios[0].examples?.headers).toEqual(["value"]);
  });
});