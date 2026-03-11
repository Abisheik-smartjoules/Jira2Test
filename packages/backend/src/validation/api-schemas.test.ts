/**
 * Unit tests for API validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  apiResponseSchema,
  generationStepSchema,
  generationStatusSchema,
  generateRequestSchema,
  storiesQuerySchema,
  downloadParamsSchema,
  errorTypeSchema,
  apiErrorSchema,
} from './api-schemas.js';
import { z } from 'zod';

describe('API Schemas', () => {
  describe('apiResponseSchema', () => {
    it('should validate successful response with data', () => {
      const dataSchema = z.object({ message: z.string() });
      const schema = apiResponseSchema(dataSchema);
      
      const validResponse = {
        success: true,
        data: { message: 'Hello' },
      };

      expect(() => schema.parse(validResponse)).not.toThrow();
    });

    it('should validate error response without data', () => {
      const dataSchema = z.string();
      const schema = apiResponseSchema(dataSchema);
      
      const errorResponse = {
        success: false,
        error: 'Something went wrong',
        message: 'Error occurred',
      };

      expect(() => schema.parse(errorResponse)).not.toThrow();
    });

    it('should allow optional fields to be missing', () => {
      const dataSchema = z.string();
      const schema = apiResponseSchema(dataSchema);
      
      const minimalResponse = {
        success: true,
      };

      expect(() => schema.parse(minimalResponse)).not.toThrow();
    });
  });

  describe('generationStepSchema', () => {
    it('should validate all valid generation steps', () => {
      const validSteps = ['idle', 'fetching', 'context', 'generating', 'syncing', 'complete', 'error'];
      
      validSteps.forEach(step => {
        expect(() => generationStepSchema.parse(step)).not.toThrow();
      });
    });

    it('should reject invalid generation steps', () => {
      expect(() => generationStepSchema.parse('invalid')).toThrow();
      expect(() => generationStepSchema.parse('IDLE')).toThrow();
      expect(() => generationStepSchema.parse('')).toThrow();
    });
  });

  describe('generationStatusSchema', () => {
    it('should validate complete generation status', () => {
      const validStatus = {
        step: 'generating',
        message: 'Generating Gherkin scenarios...',
        error: 'Optional error message',
      };

      expect(() => generationStatusSchema.parse(validStatus)).not.toThrow();
    });

    it('should validate status without error', () => {
      const validStatus = {
        step: 'complete',
        message: 'Generation completed successfully',
      };

      expect(() => generationStatusSchema.parse(validStatus)).not.toThrow();
    });

    it('should reject status with empty message', () => {
      const invalidStatus = {
        step: 'generating',
        message: '',
      };

      expect(() => generationStatusSchema.parse(invalidStatus)).toThrow();
    });

    it('should reject status with invalid step', () => {
      const invalidStatus = {
        step: 'invalid-step',
        message: 'Some message',
      };

      expect(() => generationStatusSchema.parse(invalidStatus)).toThrow();
    });
  });

  describe('generateRequestSchema', () => {
    it('should validate correct issue ID format', () => {
      const validRequest = {
        issueId: 'PROJ-123',
        issueType: 'story' as const,
      };

      expect(() => generateRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject invalid issue ID formats', () => {
      const invalidRequests = [
        { issueId: 'proj-123', issueType: 'story' },
        { issueId: 'PROJ123', issueType: 'story' },
        { issueId: '', issueType: 'story' },
        { issueId: '123', issueType: 'story' },
      ];

      invalidRequests.forEach(request => {
        expect(() => generateRequestSchema.parse(request)).toThrow();
      });
    });

    it('should reject missing issueId or issueType', () => {
      expect(() => generateRequestSchema.parse({})).toThrow();
      expect(() => generateRequestSchema.parse({ issueId: 'PROJ-123' })).toThrow();
      expect(() => generateRequestSchema.parse({ issueType: 'story' })).toThrow();
    });
  });

  describe('storiesQuerySchema', () => {
    it('should validate all valid status filters', () => {
      const validStatuses = ['All', 'To Do', 'In Progress', 'Ready for QA', 'Done'];
      
      validStatuses.forEach(status => {
        const query = { status };
        expect(() => storiesQuerySchema.parse(query)).not.toThrow();
      });
    });

    it('should validate search parameter', () => {
      const query = { search: 'user authentication' };
      expect(() => storiesQuerySchema.parse(query)).not.toThrow();
    });

    it('should validate combined status and search', () => {
      const query = { 
        status: 'In Progress',
        search: 'login feature'
      };
      expect(() => storiesQuerySchema.parse(query)).not.toThrow();
    });

    it('should validate empty query object', () => {
      expect(() => storiesQuerySchema.parse({})).not.toThrow();
    });

    it('should reject invalid status values', () => {
      const invalidQuery = { status: 'Invalid Status' };
      expect(() => storiesQuerySchema.parse(invalidQuery)).toThrow();
    });
  });

  describe('downloadParamsSchema', () => {
    it('should validate correct story ID in params', () => {
      const validParams = { storyId: 'ABC-456' };
      expect(() => downloadParamsSchema.parse(validParams)).not.toThrow();
    });

    it('should reject invalid story ID in params', () => {
      const invalidParams = { storyId: 'invalid-id' };
      expect(() => downloadParamsSchema.parse(invalidParams)).toThrow();
    });
  });

  describe('errorTypeSchema', () => {
    it('should validate all error types', () => {
      const validTypes = ['validation', 'network', 'server', 'integration'];
      
      validTypes.forEach(type => {
        expect(() => errorTypeSchema.parse(type)).not.toThrow();
      });
    });

    it('should reject invalid error types', () => {
      expect(() => errorTypeSchema.parse('unknown')).toThrow();
      expect(() => errorTypeSchema.parse('VALIDATION')).toThrow();
    });
  });

  describe('apiErrorSchema', () => {
    it('should validate complete API error', () => {
      const validError = {
        type: 'validation',
        message: 'Invalid input provided',
        details: 'Field "name" is required',
        recoverable: true,
      };

      expect(() => apiErrorSchema.parse(validError)).not.toThrow();
    });

    it('should validate error without details', () => {
      const validError = {
        type: 'network',
        message: 'Connection failed',
        recoverable: true,
      };

      expect(() => apiErrorSchema.parse(validError)).not.toThrow();
    });

    it('should reject error with empty message', () => {
      const invalidError = {
        type: 'server',
        message: '',
        recoverable: false,
      };

      expect(() => apiErrorSchema.parse(invalidError)).toThrow();
    });

    it('should reject error with invalid type', () => {
      const invalidError = {
        type: 'unknown',
        message: 'Some error',
        recoverable: true,
      };

      expect(() => apiErrorSchema.parse(invalidError)).toThrow();
    });
  });
});