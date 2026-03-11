/**
 * Validation utilities and common patterns
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
export const commonSchemas = {
  // Issue ID validation (e.g., PROJ-123, ABC-456) - generic for stories, tasks, etc.
  issueId: z.string()
    .regex(/^[A-Z]+-\d+$/, 'Issue ID must be in format ABC-123')
    .min(1, 'Issue ID is required'),

  // Story ID validation (e.g., PROJ-123, ABC-456)
  storyId: z.string()
    .regex(/^[A-Z]+-\d+$/, 'Story ID must be in format ABC-123')
    .min(1, 'Story ID is required'),

  // Non-empty string
  nonEmptyString: z.string().min(1, 'Value cannot be empty'),

  // Optional non-empty string
  optionalNonEmptyString: z.string().min(1).optional(),

  // URL validation (restrict to HTTP/HTTPS)
  url: z.string().url('Must be a valid URL').refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URL must use HTTP or HTTPS protocol'
  ),

  // Email validation
  email: z.string().email('Must be a valid email address'),

  // Date string validation (ISO format)
  dateString: z.string().datetime('Must be a valid ISO date string'),

  // Positive integer
  positiveInt: z.number().int().positive('Must be a positive integer'),

  // Non-negative integer
  nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),
};

/**
 * Validation error formatter
 */
export function formatValidationError(error: z.ZodError): string {
  const errors = error.errors.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
  
  return `Validation failed:\n${errors.join('\n')}`;
}

/**
 * Safe validation wrapper that returns result with error details
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatValidationError(error) };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

/**
 * Middleware helper for Express route validation
 */
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: 'Invalid request data'
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Query parameter validation helper
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: 'Invalid query parameters'
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Path parameter validation helper
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = safeValidate(schema, req.params);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: 'Invalid path parameters'
      });
    }
    req.validatedParams = result.data;
    next();
  };
}