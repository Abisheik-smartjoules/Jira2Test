/**
 * Morpheus MCP integration validation schemas
 */

import { z } from 'zod';
import { commonSchemas } from './validation-utils.js';

/**
 * Codebase context schema
 */
export const codebaseContextSchema = z.object({
  entities: z.array(z.string()).default([]),
  workflows: z.array(z.string()).default([]),
  businessRules: z.array(z.string()).default([]),
  apiEndpoints: z.array(z.string()).default([]),
  uiComponents: z.array(z.string()).default([]),
});

/**
 * Morpheus configuration schema
 */
export const morpheusConfigSchema = z.object({
  baseUrl: commonSchemas.url,
  apiKey: z.string().optional(),
  timeout: commonSchemas.positiveInt.default(30000), // 30 seconds default
});

/**
 * Morpheus API request schemas
 */
export const morpheusSearchRequestSchema = z.object({
  query: commonSchemas.nonEmptyString,
  maxResults: commonSchemas.positiveInt.optional().default(10),
  includeCode: z.boolean().optional().default(false),
});

export const morpheusContextRequestSchema = z.object({
  storyId: commonSchemas.storyId,
  keywords: z.array(z.string()).min(1, 'At least one keyword is required'),
  contextTypes: z.array(z.enum(['entities', 'workflows', 'businessRules', 'apiEndpoints', 'uiComponents']))
    .optional()
    .default(['entities', 'workflows', 'businessRules', 'apiEndpoints', 'uiComponents']),
});

/**
 * Morpheus API response schemas for external validation
 */
export const morpheusFileResultSchema = z.object({
  path: z.string(),
  content: z.string(),
  relevanceScore: z.number().min(0).max(1),
  type: z.enum(['entity', 'workflow', 'businessRule', 'apiEndpoint', 'uiComponent']),
});

export const morpheusSearchResponseSchema = z.object({
  results: z.array(morpheusFileResultSchema),
  totalResults: commonSchemas.nonNegativeInt,
  query: z.string(),
  executionTime: commonSchemas.nonNegativeInt,
});

export const morpheusContextResponseSchema = z.object({
  context: codebaseContextSchema,
  sourceFiles: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  processingTime: commonSchemas.nonNegativeInt,
});

/**
 * Morpheus error response schema
 */
export const morpheusErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
  timestamp: commonSchemas.dateString,
  requestId: z.string().optional(),
});

/**
 * Context extraction result schema
 */
export const contextExtractionResultSchema = z.object({
  success: z.boolean(),
  context: codebaseContextSchema.optional(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  metadata: z.object({
    filesProcessed: commonSchemas.nonNegativeInt,
    processingTime: commonSchemas.nonNegativeInt,
    confidence: z.number().min(0).max(1),
  }).optional(),
});

/**
 * Type exports
 */
export type CodebaseContext = z.infer<typeof codebaseContextSchema>;
export type MorpheusConfig = z.infer<typeof morpheusConfigSchema>;
export type MorpheusSearchRequest = z.infer<typeof morpheusSearchRequestSchema>;
export type MorpheusContextRequest = z.infer<typeof morpheusContextRequestSchema>;
export type MorpheusSearchResponse = z.infer<typeof morpheusSearchResponseSchema>;
export type MorpheusContextResponse = z.infer<typeof morpheusContextResponseSchema>;
export type MorpheusErrorResponse = z.infer<typeof morpheusErrorResponseSchema>;
export type ContextExtractionResult = z.infer<typeof contextExtractionResultSchema>;