/**
 * Google Sheets integration validation schemas
 */

import { z } from 'zod';
import { commonSchemas } from './validation-utils.js';

/**
 * Test case ID schema (e.g., PROJ-123-TC-01)
 */
export const testCaseIdSchema = z.string()
  .regex(/^[A-Z]+-\d+-TC-\d{2}$/, 'Test case ID must be in format ABC-123-TC-01');

/**
 * Scenario summary schema
 */
export const scenarioSummarySchema = z.object({
  testCaseId: testCaseIdSchema,
  scenarioTitle: commonSchemas.nonEmptyString,
  tags: z.string(), // Space-separated tags as string
  acReference: z.string().regex(/^AC-\d+$/, 'AC reference must be in format AC-1'),
  status: z.string().default('Not Executed'),
});

/**
 * Sync results schema
 */
export const syncResultsSchema = z.object({
  rowsAdded: commonSchemas.nonNegativeInt,
  rowsSkipped: commonSchemas.nonNegativeInt,
  scenarios: z.array(scenarioSummarySchema),
});

/**
 * Sheet row schema (complete row data for Google Sheets)
 */
export const sheetRowSchema = z.object({
  testCaseId: testCaseIdSchema,
  jiraStoryId: commonSchemas.storyId,
  featureName: commonSchemas.nonEmptyString,
  scenarioTitle: commonSchemas.nonEmptyString,
  tags: z.string(), // Space-separated tags
  acReference: z.string().regex(/^AC-\d+$/, 'AC reference must be in format AC-1'),
  givenSteps: z.string(),
  whenSteps: z.string(),
  thenSteps: z.string(),
  testType: z.enum(['smoke', 'negative', 'regression']),
  status: z.string().default('Not Executed'),
  automationStatus: z.string().default('Pending - Phase 2'),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().default(''),
});

/**
 * Google Sheets configuration schema
 */
export const googleSheetsConfigSchema = z.object({
  spreadsheetId: commonSchemas.nonEmptyString,
  sheetName: commonSchemas.nonEmptyString.default('Test Scenarios'),
  serviceAccountKey: commonSchemas.nonEmptyString,
});

/**
 * Google Sheets API response schemas for external validation
 */
export const sheetsValueRangeSchema = z.object({
  range: z.string(),
  majorDimension: z.enum(['ROWS', 'COLUMNS']).optional(),
  values: z.array(z.array(z.string())).optional(),
});

export const sheetsAppendResponseSchema = z.object({
  spreadsheetId: z.string(),
  tableRange: z.string(),
  updates: z.object({
    spreadsheetId: z.string(),
    updatedRange: z.string(),
    updatedRows: commonSchemas.nonNegativeInt,
    updatedColumns: commonSchemas.nonNegativeInt,
    updatedCells: commonSchemas.nonNegativeInt,
  }),
});

export const sheetsBatchGetResponseSchema = z.object({
  spreadsheetId: z.string(),
  valueRanges: z.array(sheetsValueRangeSchema),
});

/**
 * Sheets operation request schemas
 */
export const appendScenariosRequestSchema = z.object({
  scenarios: z.array(z.object({
    id: z.string(),
    title: z.string(),
    tags: z.array(z.string()),
    acReference: z.string(),
    type: z.enum(['happy', 'negative', 'edge']),
    steps: z.array(z.object({
      keyword: z.enum(['Given', 'When', 'Then', 'And', 'But']),
      text: z.string(),
    })),
  })),
  storyId: commonSchemas.storyId,
  featureName: commonSchemas.nonEmptyString,
});

export const checkDuplicatesRequestSchema = z.object({
  storyId: commonSchemas.storyId,
  scenarioTitles: z.array(commonSchemas.nonEmptyString),
});

/**
 * Sheets operation result schemas
 */
export const duplicateCheckResultSchema = z.object({
  duplicates: z.array(z.object({
    scenarioTitle: z.string(),
    existingTestCaseId: testCaseIdSchema,
  })),
  newScenarios: z.array(z.string()),
});

export const sheetsOperationResultSchema = z.object({
  success: z.boolean(),
  syncResults: syncResultsSchema.optional(),
  error: z.string().optional(),
  metadata: z.object({
    operationType: z.enum(['append', 'update', 'check']),
    executionTime: commonSchemas.nonNegativeInt,
    apiCallsUsed: commonSchemas.nonNegativeInt,
  }).optional(),
});

/**
 * Type exports
 */
export type ScenarioSummary = z.infer<typeof scenarioSummarySchema>;
export type SyncResults = z.infer<typeof syncResultsSchema>;
export type SheetRow = z.infer<typeof sheetRowSchema>;
export type GoogleSheetsConfig = z.infer<typeof googleSheetsConfigSchema>;
export type SheetsValueRange = z.infer<typeof sheetsValueRangeSchema>;
export type SheetsAppendResponse = z.infer<typeof sheetsAppendResponseSchema>;
export type AppendScenariosRequest = z.infer<typeof appendScenariosRequestSchema>;
export type CheckDuplicatesRequest = z.infer<typeof checkDuplicatesRequestSchema>;
export type DuplicateCheckResult = z.infer<typeof duplicateCheckResultSchema>;
export type SheetsOperationResult = z.infer<typeof sheetsOperationResultSchema>;