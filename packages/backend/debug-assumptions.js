import { GherkinParser } from './dist/services/gherkin-parser.js';
import { GherkinFormatter } from './dist/services/gherkin-formatter.js';

const parser = new GherkinParser();
const formatter = new GherkinFormatter();

// Create a simple test case with assumptions
const testFeatureFile = {
  feature: {
    title: "Test Feature",
    description: [],
    tags: []
  },
  scenarios: [{
    id: "test",
    title: "Test Scenario",
    tags: ["@AA-1", "@test"],
    acReference: "AC-1",
    type: "happy",
    steps: [{ keyword: "Given", text: "test step" }],
    assumptions: ["!"]
  }],
  metadata: {
    storyId: "AA-1",
    generatedAt: new Date(),
    version: "1.0"
  }
};

console.log("Original assumptions:", JSON.stringify(testFeatureFile.scenarios[0].assumptions));

// Format to Gherkin
const gherkinContent = formatter.format(testFeatureFile);
console.log("\nFormatted Gherkin content:");
console.log(gherkinContent);

// Parse back
const parsedFeatureFile = parser.parse(gherkinContent);
console.log("\nParsed assumptions:", JSON.stringify(parsedFeatureFile.scenarios[0].assumptions));

// Check if they match
const originalAssumption = testFeatureFile.scenarios[0].assumptions[0];
const parsedAssumption = parsedFeatureFile.scenarios[0].assumptions[0];
console.log(`\nComparison: "${originalAssumption}" === "${parsedAssumption}": ${originalAssumption === parsedAssumption}`);
console.log(`Original length: ${originalAssumption.length}, Parsed length: ${parsedAssumption.length}`);