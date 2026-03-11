/**
 * Gherkin feature file validation schemas
 */

import { z } from 'zod';
import { commonSchemas } from './validation-utils.js';

/**
 * Step keyword enum
 */
export const stepKeywordSchema = z.enum(['Given', 'When', 'Then', 'And', 'But']);

/**
 * Scenario type enum
 */
export const scenarioTypeSchema = z.enum(['happy', 'negative', 'edge']);

/**
 * Step schema
 */
export const stepSchema = z.object({
  keyword: stepKeywordSchema,
  text: commonSchemas.nonEmptyString,
});

/**
 * Examples table schema
 */
export const examplesTableSchema = z.object({
  headers: z.array(commonSchemas.nonEmptyString).min(1, 'Examples table must have at least one header'),
  rows: z.array(z.array(z.string())).min(1, 'Examples table must have at least one row'),
}).refine(
  (data) => data.rows.every(row => row.length === data.headers.length),
  'All example rows must have the same number of columns as headers'
);

/**
 * Scenario schema
 */
export const scenarioSchema = z.object({
  id: commonSchemas.nonEmptyString,
  title: commonSchemas.nonEmptyString,
  tags: z.array(z.string()).default([]),
  acReference: z.string().regex(/^AC-\d+$/, 'AC reference must be in format AC-1, AC-2, etc.'),
  type: scenarioTypeSchema,
  steps: z.array(stepSchema).min(1, 'Scenario must have at least one step'),
  examples: examplesTableSchema.optional(),
  assumptions: z.array(z.string()).optional(),
});

/**
 * Feature schema
 */
export const featureSchema = z.object({
  title: commonSchemas.nonEmptyString,
  description: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

/**
 * File metadata schema
 */
export const fileMetadataSchema = z.object({
  storyId: commonSchemas.storyId,
  generatedAt: z.date(),
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y'),
});

/**
 * Complete feature file schema
 */
export const featureFileSchema = z.object({
  feature: featureSchema,
  scenarios: z.array(scenarioSchema).min(1, 'Feature file must have at least one scenario'),
  metadata: fileMetadataSchema,
}).refine(
  (data) => {
    // Validate that all scenarios reference the same story ID in tags
    const storyId = data.metadata.storyId;
    return data.scenarios.every(scenario => 
      scenario.tags.some(tag => tag === `@${storyId}`)
    );
  },
  'All scenarios must be tagged with the story ID'
);

/**
 * Gherkin parsing result schema
 */
export const gherkinParseResultSchema = z.object({
  success: z.boolean(),
  featureFile: featureFileSchema.optional(),
  errors: z.array(z.string()).default([]),
});

/**
 * Gherkin generation input schema
 */
export const gherkinGenerationInputSchema = z.object({
  storyDetails: z.object({
    id: commonSchemas.storyId,
    title: commonSchemas.nonEmptyString,
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
  }),
  codebaseContext: z.object({
    entities: z.array(z.string()),
    workflows: z.array(z.string()),
    businessRules: z.array(z.string()),
    apiEndpoints: z.array(z.string()),
    uiComponents: z.array(z.string()),
  }),
});

/**
 * Type exports
 */
export type Step = z.infer<typeof stepSchema>;
export type StepKeyword = z.infer<typeof stepKeywordSchema>;
export type ScenarioType = z.infer<typeof scenarioTypeSchema>;
export type ExamplesTable = z.infer<typeof examplesTableSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Feature = z.infer<typeof featureSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type FeatureFile = z.infer<typeof featureFileSchema>;
export type GherkinParseResult = z.infer<typeof gherkinParseResultSchema>;
export type GherkinGenerationInput = z.infer<typeof gherkinGenerationInputSchema>;