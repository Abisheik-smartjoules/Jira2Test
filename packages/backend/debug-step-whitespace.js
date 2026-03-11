/**
 * Debug script to understand step whitespace handling
 */

import { GherkinParser } from './src/services/gherkin-parser.ts';
import { GherkinFormatter } from './src/services/gherkin-formatter.ts';

const parser = new GherkinParser();
const formatter = new GherkinFormatter();

// Test case with trailing whitespace in step text
const testFeatureFile = {
  feature: {
    title: "Test Feature",
    description: [],
    tags: []
  },
  scenarios: [{
    id: "test-scenario",
    title: "Test Scenario",
    tags: ["@AA-1", "@00"],
    acReference: "AC-1",
    type: "happy",
    steps: [
      { keyword: "Given", text: "! " }, // Note the trailing space
      { keyword: "Given", text: "!" }   // No trailing space
    ],
    examples: undefined,
    assumptions: undefined
  }],
  metadata: {
    storyId: "AA-1",
    generatedAt: new Date("1970-01-01T00:00:00.000Z"),
    version: "1.0"
  }
};

console.log("=== ORIGINAL FEATURE FILE ===");
console.log("Step 0 text:", JSON.stringify(testFeatureFile.scenarios[0].steps[0].text));
console.log("Step 1 text:", JSON.stringify(testFeatureFile.scenarios[0].steps[1].text));

console.log("\n=== FORMATTING ===");
const gherkinContent = formatter.format(testFeatureFile);
console.log("Formatted Gherkin content:");
console.log(gherkinContent);

console.log("\n=== PARSING ===");
const parsedFeatureFile = parser.parse(gherkinContent);
console.log("Parsed step 0 text:", JSON.stringify(parsedFeatureFile.scenarios[0].steps[0].text));
console.log("Parsed step 1 text:", JSON.stringify(parsedFeatureFile.scenarios[0].steps[1].text));

console.log("\n=== COMPARISON ===");
const originalStep0 = testFeatureFile.scenarios[0].steps[0].text;
const parsedStep0 = parsedFeatureFile.scenarios[0].steps[0].text;
console.log("Original step 0:", JSON.stringify(originalStep0));
console.log("Parsed step 0:  ", JSON.stringify(parsedStep0));
console.log("Are they equal?", originalStep0 === parsedStep0);

if (originalStep0 !== parsedStep0) {
  console.log("MISMATCH DETECTED!");
  console.log("Original length:", originalStep0.length);
  console.log("Parsed length:  ", parsedStep0.length);
  console.log("Original chars:", [...originalStep0].map(c => c.charCodeAt(0)));
  console.log("Parsed chars:  ", [...parsedStep0].map(c => c.charCodeAt(0)));
}