/**
 * Fast-check generators for Gherkin data structures
 */

import * as fc from 'fast-check';
import { FeatureFile, Feature, Scenario, Step, ExamplesTable, StepKeyword, ScenarioType } from '@jira2test/shared';

// Basic generators
export const stepKeywordArb = fc.constantFrom<StepKeyword>('Given', 'When', 'Then', 'And', 'But');

export const scenarioTypeArb = fc.constantFrom<ScenarioType>('happy', 'negative', 'edge');

// Text generators that avoid problematic characters for Gherkin
export const safeTextArb = fc.string({ 
  minLength: 1, 
  maxLength: 100 
}).filter(s => 
  s.trim().length > 0 && 
  !s.includes('\n') && 
  !s.includes('\r') &&
  !s.includes('|') &&
  !s.startsWith('#') &&
  !s.startsWith('@')
);

export const titleArb = fc.string({ 
  minLength: 5, 
  maxLength: 80 
}).filter(s => 
  s.trim().length >= 5 && 
  !s.includes('\n') && 
  !s.includes('\r') &&
  !s.includes('|') &&
  !s.startsWith('#') &&
  !s.startsWith('@')
);

// Tag generator - ensures valid tags with content
export const tagArb = fc.string({ 
  minLength: 2, 
  maxLength: 20 
}).filter(s => 
  /^[a-zA-Z0-9_-]+$/.test(s) && s.length > 0
).map(s => `@${s}`);

// Story ID generator
export const storyIdArb = fc.tuple(
  fc.array(fc.constantFrom('A', 'B', 'C', 'D', 'E'), { minLength: 2, maxLength: 5 }).map(arr => arr.join('')),
  fc.integer({ min: 1, max: 9999 })
).map(([prefix, num]) => `${prefix}-${num}`);

// Step generator
export const stepArb: fc.Arbitrary<Step> = fc.record({
  keyword: stepKeywordArb,
  text: safeTextArb
});

// Examples table generator
export const examplesTableArb: fc.Arbitrary<ExamplesTable> = fc.tuple(
  fc.array(safeTextArb, { minLength: 1, maxLength: 5 }), // headers
  fc.integer({ min: 1, max: 5 }) // number of rows
).chain(([headers, numRows]) => 
  fc.array(
    fc.array(safeTextArb, { minLength: headers.length, maxLength: headers.length }),
    { minLength: numRows, maxLength: numRows }
  ).map(rows => ({
    headers: [...headers],
    rows: rows.map(row => [...row])
  }))
);

// AC Reference generator
export const acReferenceArb = fc.integer({ min: 1, max: 10 }).map(n => `AC-${n}`);

// Scenario generator
export const scenarioArb: fc.Arbitrary<Scenario> = fc.record({
  id: fc.string({ minLength: 5, maxLength: 50 }).filter(s => /^[a-z0-9-]+$/.test(s)),
  title: titleArb,
  tags: fc.array(tagArb, { minLength: 1, maxLength: 5 }).chain(tags => {
    // Ensure at least one tag looks like a story ID for proper storyId extraction
    const storyIdTag = storyIdArb.map(id => `@${id}`);
    return fc.tuple(fc.constant(tags), storyIdTag).map(([otherTags, storyTag]) => [storyTag, ...otherTags]);
  }),
  acReference: acReferenceArb,
  type: scenarioTypeArb,
  steps: fc.array(stepArb, { minLength: 1, maxLength: 8 }),
  examples: fc.option(examplesTableArb, { freq: 3 }).map(opt => opt || undefined),
  assumptions: fc.option(fc.array(safeTextArb, { minLength: 1, maxLength: 3 }), { freq: 2 }).map(opt => opt || undefined)
});

// Feature generator
export const featureArb: fc.Arbitrary<Feature> = fc.record({
  title: titleArb,
  description: fc.array(safeTextArb, { minLength: 0, maxLength: 5 }),
  tags: fc.array(tagArb, { minLength: 0, maxLength: 3 })
});

// FeatureFile generator
export const featureFileArb: fc.Arbitrary<FeatureFile> = fc.record({
  feature: featureArb,
  scenarios: fc.array(scenarioArb, { minLength: 1, maxLength: 5 }),
  metadata: fc.record({
    storyId: storyIdArb,
    generatedAt: fc.date(),
    version: fc.constant('1.0')
  })
});