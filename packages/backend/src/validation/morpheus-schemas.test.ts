/**
 * Unit tests for Morpheus MCP validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  codebaseContextSchema,
  morpheusConfigSchema,
  morpheusSearchRequestSchema,
  morpheusContextRequestSchema,
  morpheusFileResultSchema,
  morpheusSearchResponseSchema,
  morpheusContextResponseSchema,
  morpheusErrorResponseSchema,
  contextExtractionResultSchema,
} from './morpheus-schemas.js';

describe('Morpheus Schemas', () => {
  describe('codebaseContextSchema', () => {
    const validContext = {
      entities: ['User', 'Session', 'Account'],
      workflows: ['login', 'logout', 'register'],
      businessRules: ['Password must be 8+ characters', 'Email must be unique'],
      apiEndpoints: ['/api/auth/login', '/api/auth/logout'],
      uiComponents: ['LoginForm', 'Dashboard', 'UserProfile'],
    };

    it('should validate complete codebase context', () => {
      expect(() => codebaseContextSchema.parse(validContext)).not.toThrow();
    });

    it('should apply default empty arrays', () => {
      const emptyContext = {};
      const parsed = codebaseContextSchema.parse(emptyContext);
      
      expect(parsed.entities).toEqual([]);
      expect(parsed.workflows).toEqual([]);
      expect(parsed.businessRules).toEqual([]);
      expect(parsed.apiEndpoints).toEqual([]);
      expect(parsed.uiComponents).toEqual([]);
    });

    it('should validate context with some empty arrays', () => {
      const partialContext = {
        entities: ['User'],
        workflows: [],
        businessRules: ['Some rule'],
      };

      const parsed = codebaseContextSchema.parse(partialContext);
      expect(parsed.entities).toEqual(['User']);
      expect(parsed.workflows).toEqual([]);
      expect(parsed.businessRules).toEqual(['Some rule']);
      expect(parsed.apiEndpoints).toEqual([]);
      expect(parsed.uiComponents).toEqual([]);
    });
  });

  describe('morpheusConfigSchema', () => {
    const validConfig = {
      baseUrl: 'https://morpheus.company.com',
      apiKey: 'secret-api-key',
      timeout: 30000,
    };

    it('should validate complete config', () => {
      expect(() => morpheusConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should validate config without optional API key', () => {
      const { apiKey, ...configWithoutKey } = validConfig;
      expect(() => morpheusConfigSchema.parse(configWithoutKey)).not.toThrow();
    });

    it('should apply default timeout', () => {
      const configWithoutTimeout = {
        baseUrl: 'https://morpheus.company.com',
      };

      const parsed = morpheusConfigSchema.parse(configWithoutTimeout);
      expect(parsed.timeout).toBe(30000);
    });

    it('should reject config with invalid URL', () => {
      const invalidConfig = { ...validConfig, baseUrl: 'not-a-url' };
      expect(() => morpheusConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with negative timeout', () => {
      const invalidConfig = { ...validConfig, timeout: -1 };
      expect(() => morpheusConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with zero timeout', () => {
      const invalidConfig = { ...validConfig, timeout: 0 };
      expect(() => morpheusConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('morpheusSearchRequestSchema', () => {
    const validRequest = {
      query: 'user authentication',
      maxResults: 10,
      includeCode: true,
    };

    it('should validate complete search request', () => {
      expect(() => morpheusSearchRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should apply default values', () => {
      const minimalRequest = { query: 'test query' };
      const parsed = morpheusSearchRequestSchema.parse(minimalRequest);
      
      expect(parsed.maxResults).toBe(10);
      expect(parsed.includeCode).toBe(false);
    });

    it('should reject request with empty query', () => {
      const invalidRequest = { ...validRequest, query: '' };
      expect(() => morpheusSearchRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with negative maxResults', () => {
      const invalidRequest = { ...validRequest, maxResults: -1 };
      expect(() => morpheusSearchRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with zero maxResults', () => {
      const invalidRequest = { ...validRequest, maxResults: 0 };
      expect(() => morpheusSearchRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('morpheusContextRequestSchema', () => {
    const validRequest = {
      storyId: 'PROJ-123',
      keywords: ['authentication', 'login', 'user'],
      contextTypes: ['entities', 'workflows'],
    };

    it('should validate complete context request', () => {
      expect(() => morpheusContextRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should apply default context types', () => {
      const requestWithoutTypes = {
        storyId: 'PROJ-123',
        keywords: ['test'],
      };

      const parsed = morpheusContextRequestSchema.parse(requestWithoutTypes);
      expect(parsed.contextTypes).toEqual([
        'entities', 'workflows', 'businessRules', 'apiEndpoints', 'uiComponents'
      ]);
    });

    it('should reject request with invalid story ID', () => {
      const invalidRequest = { ...validRequest, storyId: 'invalid-id' };
      expect(() => morpheusContextRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with empty keywords array', () => {
      const invalidRequest = { ...validRequest, keywords: [] };
      expect(() => morpheusContextRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with invalid context type', () => {
      const invalidRequest = { ...validRequest, contextTypes: ['invalid'] };
      expect(() => morpheusContextRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('morpheusFileResultSchema', () => {
    const validResult = {
      path: 'src/auth/user.ts',
      content: 'export class User { ... }',
      relevanceScore: 0.85,
      type: 'entity',
    };

    it('should validate complete file result', () => {
      expect(() => morpheusFileResultSchema.parse(validResult)).not.toThrow();
    });

    it('should validate all result types', () => {
      const types = ['entity', 'workflow', 'businessRule', 'apiEndpoint', 'uiComponent'];
      
      types.forEach(type => {
        const result = { ...validResult, type };
        expect(() => morpheusFileResultSchema.parse(result)).not.toThrow();
      });
    });

    it('should reject result with relevance score > 1', () => {
      const invalidResult = { ...validResult, relevanceScore: 1.5 };
      expect(() => morpheusFileResultSchema.parse(invalidResult)).toThrow();
    });

    it('should reject result with relevance score < 0', () => {
      const invalidResult = { ...validResult, relevanceScore: -0.1 };
      expect(() => morpheusFileResultSchema.parse(invalidResult)).toThrow();
    });

    it('should reject result with invalid type', () => {
      const invalidResult = { ...validResult, type: 'invalid' };
      expect(() => morpheusFileResultSchema.parse(invalidResult)).toThrow();
    });
  });

  describe('morpheusSearchResponseSchema', () => {
    const validResponse = {
      results: [
        {
          path: 'src/user.ts',
          content: 'class User {}',
          relevanceScore: 0.9,
          type: 'entity',
        },
      ],
      totalResults: 1,
      query: 'user authentication',
      executionTime: 150,
    };

    it('should validate complete search response', () => {
      expect(() => morpheusSearchResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should validate response with empty results', () => {
      const emptyResponse = { ...validResponse, results: [], totalResults: 0 };
      expect(() => morpheusSearchResponseSchema.parse(emptyResponse)).not.toThrow();
    });

    it('should reject response with negative execution time', () => {
      const invalidResponse = { ...validResponse, executionTime: -1 };
      expect(() => morpheusSearchResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('morpheusContextResponseSchema', () => {
    const validResponse = {
      context: {
        entities: ['User'],
        workflows: ['login'],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      },
      sourceFiles: ['src/user.ts', 'src/auth.ts'],
      confidence: 0.85,
      processingTime: 200,
    };

    it('should validate complete context response', () => {
      expect(() => morpheusContextResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should reject response with confidence > 1', () => {
      const invalidResponse = { ...validResponse, confidence: 1.2 };
      expect(() => morpheusContextResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject response with confidence < 0', () => {
      const invalidResponse = { ...validResponse, confidence: -0.1 };
      expect(() => morpheusContextResponseSchema.parse(invalidResponse)).toThrow();
    });

    it('should reject response with negative processing time', () => {
      const invalidResponse = { ...validResponse, processingTime: -1 };
      expect(() => morpheusContextResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('morpheusErrorResponseSchema', () => {
    const validError = {
      error: {
        code: 'INVALID_QUERY',
        message: 'Query parameter is invalid',
        details: { field: 'query', value: '' },
      },
      timestamp: '2024-01-15T10:30:00Z',
      requestId: 'req-123-456',
    };

    it('should validate complete error response', () => {
      expect(() => morpheusErrorResponseSchema.parse(validError)).not.toThrow();
    });

    it('should validate error without optional fields', () => {
      const minimalError = {
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error',
        },
        timestamp: '2024-01-15T10:30:00Z',
      };

      expect(() => morpheusErrorResponseSchema.parse(minimalError)).not.toThrow();
    });

    it('should reject error with invalid timestamp format', () => {
      const invalidError = { ...validError, timestamp: 'invalid-date' };
      expect(() => morpheusErrorResponseSchema.parse(invalidError)).toThrow();
    });
  });

  describe('contextExtractionResultSchema', () => {
    const validResult = {
      success: true,
      context: {
        entities: ['User'],
        workflows: ['login'],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      },
      errors: [],
      warnings: ['Low confidence for some entities'],
      metadata: {
        filesProcessed: 15,
        processingTime: 500,
        confidence: 0.8,
      },
    };

    it('should validate complete extraction result', () => {
      expect(() => contextExtractionResultSchema.parse(validResult)).not.toThrow();
    });

    it('should validate failed extraction result', () => {
      const failedResult = {
        success: false,
        errors: ['Failed to connect to Morpheus service'],
        warnings: [],
      };

      expect(() => contextExtractionResultSchema.parse(failedResult)).not.toThrow();
    });

    it('should apply default empty arrays', () => {
      const minimalResult = { success: true };
      const parsed = contextExtractionResultSchema.parse(minimalResult);
      
      expect(parsed.errors).toEqual([]);
      expect(parsed.warnings).toEqual([]);
    });

    it('should reject result with negative files processed', () => {
      const invalidResult = {
        ...validResult,
        metadata: { ...validResult.metadata!, filesProcessed: -1 },
      };
      expect(() => contextExtractionResultSchema.parse(invalidResult)).toThrow();
    });

    it('should reject result with confidence > 1', () => {
      const invalidResult = {
        ...validResult,
        metadata: { ...validResult.metadata!, confidence: 1.5 },
      };
      expect(() => contextExtractionResultSchema.parse(invalidResult)).toThrow();
    });
  });
});