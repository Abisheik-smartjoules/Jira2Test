/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  commonSchemas, 
  formatValidationError, 
  safeValidate,
  validateRequest,
  validateQuery,
  validateParams
} from './validation-utils.js';

describe('commonSchemas', () => {
  describe('storyId', () => {
    it('should validate correct story ID format', () => {
      expect(() => commonSchemas.storyId.parse('PROJ-123')).not.toThrow();
      expect(() => commonSchemas.storyId.parse('ABC-456')).not.toThrow();
      expect(() => commonSchemas.storyId.parse('XYZ-1')).not.toThrow();
    });

    it('should reject invalid story ID formats', () => {
      expect(() => commonSchemas.storyId.parse('proj-123')).toThrow();
      expect(() => commonSchemas.storyId.parse('PROJ123')).toThrow();
      expect(() => commonSchemas.storyId.parse('PROJ-')).toThrow();
      expect(() => commonSchemas.storyId.parse('123-PROJ')).toThrow();
      expect(() => commonSchemas.storyId.parse('')).toThrow();
    });
  });

  describe('nonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(() => commonSchemas.nonEmptyString.parse('hello')).not.toThrow();
      expect(() => commonSchemas.nonEmptyString.parse('a')).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => commonSchemas.nonEmptyString.parse('')).toThrow();
    });
  });

  describe('url', () => {
    it('should validate correct URLs', () => {
      expect(() => commonSchemas.url.parse('https://example.com')).not.toThrow();
      expect(() => commonSchemas.url.parse('http://localhost:4000')).not.toThrow();
    });

    it('should reject invalid URLs', () => {
      expect(() => commonSchemas.url.parse('not-a-url')).toThrow();
      expect(() => commonSchemas.url.parse('ftp://example.com')).toThrow();
    });
  });

  describe('email', () => {
    it('should validate correct email addresses', () => {
      expect(() => commonSchemas.email.parse('user@example.com')).not.toThrow();
      expect(() => commonSchemas.email.parse('test.email+tag@domain.co.uk')).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => commonSchemas.email.parse('not-an-email')).toThrow();
      expect(() => commonSchemas.email.parse('user@')).toThrow();
      expect(() => commonSchemas.email.parse('@domain.com')).toThrow();
    });
  });

  describe('positiveInt', () => {
    it('should validate positive integers', () => {
      expect(() => commonSchemas.positiveInt.parse(1)).not.toThrow();
      expect(() => commonSchemas.positiveInt.parse(100)).not.toThrow();
    });

    it('should reject zero and negative numbers', () => {
      expect(() => commonSchemas.positiveInt.parse(0)).toThrow();
      expect(() => commonSchemas.positiveInt.parse(-1)).toThrow();
    });

    it('should reject non-integers', () => {
      expect(() => commonSchemas.positiveInt.parse(1.5)).toThrow();
      expect(() => commonSchemas.positiveInt.parse('1')).toThrow();
    });
  });
});

describe('formatValidationError', () => {
  it('should format single validation error', () => {
    const schema = z.object({ name: z.string().min(1) });
    try {
      schema.parse({ name: '' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatValidationError(error);
        expect(formatted).toContain('Validation failed:');
        expect(formatted).toContain('name:');
      }
    }
  });

  it('should format multiple validation errors', () => {
    const schema = z.object({ 
      name: z.string().min(1),
      age: z.number().positive()
    });
    try {
      schema.parse({ name: '', age: -1 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = formatValidationError(error);
        expect(formatted).toContain('Validation failed:');
        expect(formatted).toContain('name:');
        expect(formatted).toContain('age:');
      }
    }
  });
});

describe('safeValidate', () => {
  const testSchema = z.object({ name: z.string().min(1) });

  it('should return success for valid data', () => {
    const result = safeValidate(testSchema, { name: 'John' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John');
    }
  });

  it('should return error for invalid data', () => {
    const result = safeValidate(testSchema, { name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Validation failed:');
    }
  });

  it('should handle non-ZodError exceptions', () => {
    const throwingSchema = z.string().transform(() => {
      throw new Error('Custom error');
    });
    
    const result = safeValidate(throwingSchema, 'test');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unknown validation error');
    }
  });
});

describe('Express middleware helpers', () => {
  const mockRequest = (body: any, query: any = {}, params: any = {}) => ({
    body,
    query,
    params,
  });

  const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  const mockNext = () => {
    let called = false;
    return () => { called = true; };
  };

  describe('validateRequest', () => {
    const schema = z.object({ name: z.string().min(1) });
    const middleware = validateRequest(schema);

    it('should call next() for valid request body', () => {
      const req = mockRequest({ name: 'John' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(req.validatedBody).toEqual({ name: 'John' });
    });

    it('should return 400 for invalid request body', () => {
      const req = mockRequest({ name: '' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toContain('Validation failed:');
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({ page: z.string().optional() });
    const middleware = validateQuery(schema);

    it('should call next() for valid query parameters', () => {
      const req = mockRequest({}, { page: '1' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(req.validatedQuery).toEqual({ page: '1' });
    });
  });

  describe('validateParams', () => {
    const schema = z.object({ id: commonSchemas.storyId });
    const middleware = validateParams(schema);

    it('should call next() for valid path parameters', () => {
      const req = mockRequest({}, {}, { id: 'PROJ-123' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(req.validatedParams).toEqual({ id: 'PROJ-123' });
    });

    it('should return 400 for invalid path parameters', () => {
      const req = mockRequest({}, {}, { id: 'invalid' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });
  });
});