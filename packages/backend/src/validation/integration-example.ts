/**
 * Integration example demonstrating how to use validation schemas
 * This file shows practical usage patterns for the validation system
 */

import { Request, Response, NextFunction } from 'express';
import {
  generateRequestSchema,
  storiesQuerySchema,
  downloadParamsSchema,
  validateRequest,
  validateQuery,
  validateParams,
  safeValidate,
  apiResponseSchema,
} from './index.js';
import {
  jiraSearchResponseSchema,
  morpheusContextResponseSchema,
  sheetsAppendResponseSchema,
} from './index.js';
import { z } from 'zod';

/**
 * Example: API endpoint with request validation
 */
export const generateGherkinEndpoint = [
  validateRequest(generateRequestSchema),
  async (req: Request, res: Response) => {
    try {
      // req.body is validated by middleware and cast to proper type
      const { storyId } = req.body as { storyId: string };
      
      // Your business logic here
      const result = await generateGherkinForStory(storyId);
      
      // Validate response before sending
      const responseSchema = apiResponseSchema(z.object({
        featureFile: z.any(), // Use actual schema in practice
        syncResults: z.any(),
      }));
      
      const response = {
        success: true,
        data: result,
        message: 'Gherkin file generated successfully',
      };
      
      // Validate outgoing response
      const validatedResponse = responseSchema.parse(response);
      res.json(validatedResponse);
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate Gherkin file',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
];

/**
 * Example: Query parameter validation
 */
export const getStoriesEndpoint = [
  validateQuery(storiesQuerySchema),
  async (req: Request, res: Response) => {
    try {
      // req.query is validated by middleware and cast to proper type
      const { status, search } = req.query as { status?: string; search?: string };
      
      const stories = await fetchStoriesFromJira(status, search);
      
      res.json({
        success: true,
        data: { stories },
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stories',
      });
    }
  },
];

/**
 * Example: Path parameter validation
 */
export const downloadFeatureFileEndpoint = [
  validateParams(downloadParamsSchema),
  async (req: Request, res: Response) => {
    try {
      // req.params is validated by middleware and cast to proper type
      const { storyId } = req.params as { storyId: string };
      
      const featureFile = await getFeatureFile(storyId);
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${storyId}_feature.feature"`);
      res.send(featureFile);
      
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Feature file not found',
      });
    }
  },
];

/**
 * Example: External API response validation
 */
export async function fetchAndValidateJiraResponse(query: string) {
  try {
    // Make API call to Jira
    const response = await fetch(`https://jira.company.com/rest/api/3/search?jql=${query}`);
    const data = await response.json();
    
    // Validate external API response
    const validationResult = safeValidate(jiraSearchResponseSchema, data);
    
    if (!validationResult.success) {
      throw new Error(`Invalid Jira API response: ${validationResult.error}`);
    }
    
    // Now we have type-safe, validated data
    return validationResult.data;
    
  } catch (error) {
    console.error('Failed to fetch Jira data:', error);
    throw error;
  }
}

/**
 * Example: Morpheus MCP response validation
 */
export async function fetchAndValidateMorpheusContext(storyId: string) {
  try {
    const response = await fetch(`https://morpheus.company.com/api/context/${storyId}`);
    const data = await response.json();
    
    // Validate Morpheus response
    const validationResult = safeValidate(morpheusContextResponseSchema, data);
    
    if (!validationResult.success) {
      console.warn(`Invalid Morpheus response: ${validationResult.error}`);
      // Return default context instead of failing
      return {
        context: {
          entities: [],
          workflows: [],
          businessRules: [],
          apiEndpoints: [],
          uiComponents: [],
        },
        sourceFiles: [],
        confidence: 0,
        processingTime: 0,
      };
    }
    
    return validationResult.data;
    
  } catch (error) {
    console.error('Failed to fetch Morpheus context:', error);
    throw error;
  }
}

/**
 * Example: Google Sheets API response validation
 */
export async function validateSheetsAppendResponse(response: unknown) {
  const validationResult = safeValidate(sheetsAppendResponseSchema, response);
  
  if (!validationResult.success) {
    throw new Error(`Invalid Google Sheets API response: ${validationResult.error}`);
  }
  
  return validationResult.data;
}

/**
 * Example: Custom validation middleware for specific business rules
 */
export function validateStoryAccess(allowedProjects: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const storyId = (req.body as any)?.storyId || (req.params as any)?.storyId;
    
    if (!storyId) {
      return res.status(400).json({
        success: false,
        error: 'Story ID is required',
      });
    }
    
    // Extract project prefix from story ID (e.g., "PROJ" from "PROJ-123")
    const projectPrefix = storyId.split('-')[0];
    
    if (!allowedProjects.includes(projectPrefix)) {
      return res.status(403).json({
        success: false,
        error: `Access denied for project: ${projectPrefix}`,
      });
    }
    
    next();
  };
}

/**
 * Example: Batch validation for multiple items
 */
export function validateMultipleScenarios(scenarios: unknown[]) {
  const errors: string[] = [];
  const validScenarios: any[] = [];
  
  scenarios.forEach((scenario, index) => {
    const result = safeValidate(
      z.object({
        title: z.string().min(1),
        steps: z.array(z.object({
          keyword: z.enum(['Given', 'When', 'Then', 'And', 'But']),
          text: z.string().min(1),
        })).min(1),
      }),
      scenario
    );
    
    if (result.success) {
      validScenarios.push(result.data);
    } else {
      errors.push(`Scenario ${index + 1}: ${result.error}`);
    }
  });
  
  return {
    validScenarios,
    errors,
    hasErrors: errors.length > 0,
  };
}

// Mock functions for demonstration
async function generateGherkinForStory(_storyId: string) {
  // Implementation would go here
  return { featureFile: {}, syncResults: {} };
}

async function fetchStoriesFromJira(_status?: string, _search?: string) {
  // Implementation would go here
  return [];
}

async function getFeatureFile(storyId: string) {
  // Implementation would go here
  return `Feature: ${storyId}\n  Scenario: Test scenario\n    Given something\n    When something happens\n    Then something occurs`;
}