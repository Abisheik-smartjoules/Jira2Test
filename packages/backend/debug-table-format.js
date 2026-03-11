// Debug script to test table formatting/parsing
import { GherkinParser } from './dist/services/gherkin-parser.js';
import { GherkinFormatter } from './dist/services/gherkin-formatter.js';

const parser = new GherkinParser();
const formatter = new GherkinFormatter();

// Test case with simple headers
const testFeature = {
  feature: {
    title: "Test Feature",
    description: [],
    tags: []
  },
  scenarios: [{
    id: "test",
    title: "Test Scenario",
    tags: ["@AA-1"],
    acReference: "AC-1",
    type: "happy",
    steps: [{ keyword: "Given", text: "test" }],
    examples: {
      headers: ["!", "$"],
      rows: [["a", "b"]]
    }
  }],
  metadata: {
    storyId: "AA-1",
    generatedAt: new Date(),
    version: "1.0"
  }
};

console.log("Original headers:", testFeature.scenarios[0].examples.headers);

// Format to Gherkin
const gherkinContent = formatter.format(testFeature);
console.log("\nFormatted Gherkin:");
console.log(gherkinContent);

// Parse back
const parsed = parser.parse(gherkinContent);
console.log("\nParsed headers:", parsed.scenarios[0].examples.headers);

console.log("\nComparison:");
console.log("Original[0]:", JSON.stringify(testFeature.scenarios[0].examples.headers[0]));
console.log("Parsed[0]:  ", JSON.stringify(parsed.scenarios[0].examples.headers[0]));