/**
 * API request/response validation schemas
 */

import { z } from 'zod';
import { commonSchemas } from './validation-utils.js';

/**
 * API Response envelope schema
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

/**
 * Generation status schemas
 */
export const generationStepSchema = z.enum([
  'idle',
  'fetching', 
  'context',
  'generating',
  'syncing',
  'complete',
  'error'
]);

export const generationStatusSchema = z.object({
  step: generationStepSchema,
  message: commonSchemas.nonEmptyString,
  error: z.string().optional(),
});

/**
 * API endpoint request schemas
 */
export const generateRequestSchema = z.object({
  issueId: commonSchemas.issueId,
  issueType: z.enum(['story', 'task']),
});

/**
 * Legacy generate request schema (for backward compatibility)
 * @deprecated Use generateRequestSchema instead
 */
export const legacyGenerateRequestSchema = z.object({
  storyId: commonSchemas.storyId,
});

/**
 * Query parameter schemas
 */
export const storiesQuerySchema = z.object({
  status: z.enum(['All', 'To Do', 'In Progress', 'Ready for QA', 'Done']).optional(),
  search: z.string().optional(),
});

export const tasksQuerySchema = z.object({
  status: z.enum(['All', 'To Do', 'In Progress', 'Ready for QA', 'Done']).optional(),
  search: z.string().optional(),
});

export const downloadParamsSchema = z.object({
  storyId: commonSchemas.storyId,
});

/**
 * Error type schemas
 */
export const errorTypeSchema = z.enum(['validation', 'network', 'server', 'integration']);

export const apiErrorSchema = z.object({
  type: errorTypeSchema,
  message: commonSchemas.nonEmptyString,
  details: z.string().optional(),
  recoverable: z.boolean(),
});

/**
 * Type exports for use in application code
 */
export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type StoriesQuery = z.infer<typeof storiesQuerySchema>;
export type TasksQuery = z.infer<typeof tasksQuerySchema>;
export type DownloadParams = z.infer<typeof downloadParamsSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;