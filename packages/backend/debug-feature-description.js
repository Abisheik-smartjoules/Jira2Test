const { GherkinParser } = require('./dist/services/gherkin-parser.js');
const { GherkinFormatter } = require('./dist/services/gherkin-formatter.js');

const parser = new GherkinParser();
const formatter = new GherkinFormatter();

// Test case that's failing
const testFeatureFile = {
  feature: {
    title: "$   !",
    description: [" !"],
    tags: []
  },
  scenarios: [{
    id: "aaaaa",
    title: "$   !",
    tags: ["@AA-1", "@00"],
    acReference: "AC-1",
    type: "happy",
    steps: [{ keyword: "Given", text: "A" }],
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
console.log("Feature description:", JSON.stringify(testFeatureFile.feature.description));

console.log("\n=== STEP 1: FORMAT TO GHERKIN ===");
const gherkinContent = formatter.format(testFeatureFile);
console.log("Formatted content:");
console.log(JSON.stringify(gherkinContent));
console.log("\nFormatted content (readable):");
console.log(gherkinContent);

console.log("\n=== STEP 2: PARSE BACK ===");
const parsedFeatureFile = parser.parse(gherkinContent);
console.log("Parsed feature description:", JSON.stringify(parsedFeatureFile.feature.description));

console.log("\n=== COMPARISON ===");
console.log("Original:", JSON.stringify(testFeatureFile.feature.description[0]));
console.log("Parsed:  ", JSON.stringify(parsedFeatureFile.feature.description[0]));
console.log("Match:", testFeatureFile.feature.description[0] === parsedFeatureFile.feature.description[0]);