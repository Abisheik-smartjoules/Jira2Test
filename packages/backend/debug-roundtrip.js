import { GherkinParser } from './src/services/gherkin-parser.js';
import { GherkinFormatter } from './src/services/gherkin-formatter.js';

const parser = new GherkinParser();
const formatter = new GherkinFormatter();

// Test case that's failing
const testFeatureFile = {
  feature: {
    title: "!   !",
    description: [],
    tags: []
  },
  scenarios: [{
    id: "a0aaa",
    title: "$   !",
    tags: ["@AA-1", "@A0"],
    acReference: "AC-1",
    type: "happy",
    steps: [
      { keyword: "Given", text: " !" },
      { keyword: "Given", text: "A" }
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

console.log('Original FeatureFile:');
console.log('Step 0 text:', JSON.stringify(testFeatureFile.scenarios[0].steps[0].text));

// Format to Gherkin content
const gherkinContent = formatter.format(testFeatureFile);
console.log('\nFormatted Gherkin content:');
console.log(gherkinContent);

// Parse back
const parsedFeatureFile = parser.parse(gherkinContent);
console.log('\nParsed back:');
console.log('Step 0 text:', JSON.stringify(parsedFeatureFile.scenarios[0].steps[0].text));

// Compare
const originalStepText = testFeatureFile.scenarios[0].steps[0].text;
const parsedStepText = parsedFeatureFile.scenarios[0].steps[0].text;

console.log('\nComparison:');
console.log('Original:', JSON.stringify(originalStepText));
console.log('Parsed:  ', JSON.stringify(parsedStepText));
console.log('Equal?   ', originalStepText === parsedStepText);