/**
 * MorpheusService unit tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { MorpheusService } from './morpheus-service.js';
import type { MorpheusConfig, MorpheusContextResponse } from '../validation/morpheus-schemas.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('MorpheusService', () => {
  let morpheusService: MorpheusService;
  let mockConfig: MorpheusConfig;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://morpheus-api.example.com',
      apiKey: 'test-api-key',
      timeout: 30000,
    };

    // Mock axios.create to return a mock instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
    };
    
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
    
    morpheusService = new MorpheusService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCodebaseContext', () => {
    it('should extract codebase context from story details', async () => {
      const mockResponse: MorpheusContextResponse = {
        context: {
          entities: ['User', 'Order', 'Product'],
          workflows: ['checkout-flow', 'user-registration'],
          businessRules: ['discount-calculation', 'inventory-validation'],
          apiEndpoints: ['/api/users', '/api/orders'],
          uiComponents: ['UserForm', 'OrderSummary'],
        },
        sourceFiles: ['src/models/User.ts', 'src/services/OrderService.ts'],
        confidence: 0.85,
        processingTime: 1200,
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const storyDetails = {
        id: 'TEST-123',
        title: 'User checkout flow',
        description: 'As a user, I want to checkout my cart so that I can complete my purchase',
        acceptanceCriteria: ['User can add items to cart', 'User can proceed to checkout'],
        status: 'To Do',
        assignee: 'John Doe',
      };

      const result = await morpheusService.getCodebaseContext(storyDetails);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/context/extract',
        expect.objectContaining({
          storyId: 'TEST-123',
          keywords: expect.arrayContaining(['user', 'checkout', 'cart', 'purchase']),
          contextTypes: ['entities', 'workflows', 'businessRules', 'apiEndpoints', 'uiComponents'],
        })
      );

      expect(result).toEqual({
        entities: ['User', 'Order', 'Product'],
        workflows: ['checkout-flow', 'user-registration'],
        businessRules: ['discount-calculation', 'inventory-validation'],
        apiEndpoints: ['/api/users', '/api/orders'],
        uiComponents: ['UserForm', 'OrderSummary'],
      });
    });

    it('should extract keywords from story title and description', async () => {
      const mockResponse: MorpheusContextResponse = {
        context: {
          entities: [],
          workflows: [],
          businessRules: [],
          apiEndpoints: [],
          uiComponents: [],
        },
        sourceFiles: [],
        confidence: 0.5,
        processingTime: 800,
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const storyDetails = {
        id: 'TEST-456',
        title: 'Payment processing integration',
        description: 'Implement Stripe payment gateway for credit card transactions',
        acceptanceCriteria: ['Support Visa and MasterCard', 'Handle payment failures'],
        status: 'In Progress',
        assignee: 'Jane Smith',
      };

      await morpheusService.getCodebaseContext(storyDetails);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/context/extract',
        expect.objectContaining({
          keywords: expect.arrayContaining(['payment', 'processing', 'stripe', 'gateway', 'credit', 'card']),
        })
      );
    });

    it('should handle empty context gracefully', async () => {
      const mockResponse: MorpheusContextResponse = {
        context: {
          entities: [],
          workflows: [],
          businessRules: [],
          apiEndpoints: [],
          uiComponents: [],
        },
        sourceFiles: [],
        confidence: 0.1,
        processingTime: 500,
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const storyDetails = {
        id: 'TEST-789',
        title: 'Simple bug fix',
        description: 'Fix typo in error message',
        acceptanceCriteria: [],
        status: 'To Do',
        assignee: 'Bob Wilson',
      };

      const result = await morpheusService.getCodebaseContext(storyDetails);

      expect(result).toEqual({
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      });
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      const storyDetails = {
        id: 'TEST-ERROR',
        title: 'Test story',
        description: 'Test description',
        acceptanceCriteria: [],
        status: 'To Do',
        assignee: 'Test User',
      };

      // Service now returns empty context instead of throwing
      const result = await morpheusService.getCodebaseContext(storyDetails);
      expect(result).toEqual({
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      });
    });

    it('should handle service unavailable errors', async () => {
      const serviceError = {
        response: { status: 503 },
        message: 'Service unavailable',
      };
      mockAxiosInstance.post.mockRejectedValueOnce(serviceError);

      const storyDetails = {
        id: 'TEST-503',
        title: 'Test story',
        description: 'Test description',
        acceptanceCriteria: [],
        status: 'To Do',
        assignee: 'Test User',
      };

      // Service now returns empty context instead of throwing
      const result = await morpheusService.getCodebaseContext(storyDetails);
      expect(result).toEqual({
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ECONNABORTED', message: 'timeout' };
      mockAxiosInstance.post.mockRejectedValueOnce(timeoutError);

      const storyDetails = {
        id: 'TEST-TIMEOUT',
        title: 'Test story',
        description: 'Test description',
        acceptanceCriteria: [],
        status: 'To Do',
        assignee: 'Test User',
      };

      // Service now returns empty context instead of throwing
      const result = await morpheusService.getCodebaseContext(storyDetails);
      expect(result).toEqual({
        entities: [],
        workflows: [],
        businessRules: [],
        apiEndpoints: [],
        uiComponents: [],
      });
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords from text', () => {
      const text = 'User authentication with OAuth2 and JWT tokens for secure API access';
      const keywords = morpheusService.extractKeywords(text);

      expect(keywords).toEqual(
        expect.arrayContaining(['user', 'authentication', 'oauth2', 'jwt', 'tokens', 'secure', 'api', 'access'])
      );
      expect(keywords).not.toContain('with');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('for');
    });

    it('should handle empty text', () => {
      const keywords = morpheusService.extractKeywords('');
      expect(keywords).toEqual([]);
    });

    it('should filter out common stop words', () => {
      const text = 'The user can login and logout from the system';
      const keywords = morpheusService.extractKeywords(text);

      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('can');
      expect(keywords).not.toContain('and');
      expect(keywords).not.toContain('from');
      expect(keywords).toContain('user');
      expect(keywords).toContain('login');
      expect(keywords).toContain('logout');
      expect(keywords).toContain('system');
    });
  });

  describe('configuration', () => {
    it('should use correct API configuration', () => {
      // Create a new service to test constructor behavior
      vi.clearAllMocks();
      
      const testConfig: MorpheusConfig = {
        baseUrl: 'https://custom-morpheus.example.com',
        apiKey: 'custom-api-key',
        timeout: 45000,
      };

      new MorpheusService(testConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom-morpheus.example.com',
          timeout: 45000,
          headers: expect.objectContaining({
            'Authorization': 'Bearer custom-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});