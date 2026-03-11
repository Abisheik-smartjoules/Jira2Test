/**
 * Unit tests for Google Sheets validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  testCaseIdSchema,
  scenarioSummarySchema,
  syncResultsSchema,
  sheetRowSchema,
  googleSheetsConfigSchema,
  sheetsValueRangeSchema,
  sheetsAppendResponseSchema,
  sheetsBatchGetResponseSchema,
  appendScenariosRequestSchema,
  checkDuplicatesRequestSchema,
  duplicateCheckResultSchema,
  sheetsOperationResultSchema,
} from './sheets-schemas.js';

describe('Sheets Schemas', () => {
  describe('testCaseIdSchema', () => {
    it('should validate correct test case ID format', () => {
      const validIds = ['PROJ-123-TC-01', 'ABC-456-TC-99', 'XYZ-1-TC-10'];
      
      validIds.forEach(id => {
        expect(() => testCaseIdSchema.parse(id)).not.toThrow();
      });
    });

    it('should reject invalid test case ID formats', () => {
      const invalidIds = [
        'PROJ-123-TC-1',    // Missing leading zero
        'proj-123-TC-01',   // Lowercase project
        'PROJ-123-tc-01',   // Lowercase TC
        'PROJ-123-TC01',    // Missing hyphen
        'PROJ-TC-01',       // Missing story number
        'PROJ-123-TC-',     // Missing test number
        '',                 // Empty string
      ];

      invalidIds.forEach(id => {
        expect(() => testCaseIdSchema.parse(id)).toThrow();
      });
    });
  });

  describe('scenarioSummarySchema', () => {
    const validSummary = {
      testCaseId: 'PROJ-123-TC-01',
      scenarioTitle: 'User can log in successfully',
      tags: '@smoke @PROJ-123',
      acReference: 'AC-1',
      status: 'Not Executed',
    };

    it('should validate complete scenario summary', () => {
      expect(() => scenarioSummarySchema.parse(validSummary)).not.toThrow();
    });

    it('should apply default status', () => {
      const { status, ...summaryWithoutStatus } = validSummary;
      const parsed = scenarioSummarySchema.parse(summaryWithoutStatus);
      expect(parsed.status).toBe('Not Executed');
    });

    it('should reject summary with invalid test case ID', () => {
      const invalidSummary = { ...validSummary, testCaseId: 'invalid-id' };
      expect(() => scenarioSummarySchema.parse(invalidSummary)).toThrow();
    });

    it('should reject summary with empty scenario title', () => {
      const invalidSummary = { ...validSummary, scenarioTitle: '' };
      expect(() => scenarioSummarySchema.parse(invalidSummary)).toThrow();
    });

    it('should reject summary with invalid AC reference', () => {
      const invalidSummary = { ...validSummary, acReference: 'AC1' };
      expect(() => scenarioSummarySchema.parse(invalidSummary)).toThrow();
    });
  });

  describe('syncResultsSchema', () => {
    const validResults = {
      rowsAdded: 5,
      rowsSkipped: 2,
      scenarios: [
        {
          testCaseId: 'PROJ-123-TC-01',
          scenarioTitle: 'Test scenario',
          tags: '@smoke',
          acReference: 'AC-1',
          status: 'Not Executed',
        },
      ],
    };

    it('should validate complete sync results', () => {
      expect(() => syncResultsSchema.parse(validResults)).not.toThrow();
    });

    it('should validate results with empty scenarios array', () => {
      const resultsWithEmptyScenarios = { ...validResults, scenarios: [] };
      expect(() => syncResultsSchema.parse(resultsWithEmptyScenarios)).not.toThrow();
    });

    it('should reject results with negative rows added', () => {
      const invalidResults = { ...validResults, rowsAdded: -1 };
      expect(() => syncResultsSchema.parse(invalidResults)).toThrow();
    });

    it('should reject results with negative rows skipped', () => {
      const invalidResults = { ...validResults, rowsSkipped: -1 };
      expect(() => syncResultsSchema.parse(invalidResults)).toThrow();
    });
  });

  describe('sheetRowSchema', () => {
    const validRow = {
      testCaseId: 'PROJ-123-TC-01',
      jiraStoryId: 'PROJ-123',
      featureName: 'User Authentication',
      scenarioTitle: 'User can log in successfully',
      tags: '@smoke @PROJ-123',
      acReference: 'AC-1',
      givenSteps: 'Given user has valid credentials',
      whenSteps: 'When user submits login form',
      thenSteps: 'Then user is redirected to dashboard',
      testType: 'smoke',
      status: 'Not Executed',
      automationStatus: 'Pending - Phase 2',
      createdDate: '2024-01-15',
      notes: 'Initial test case',
    };

    it('should validate complete sheet row', () => {
      expect(() => sheetRowSchema.parse(validRow)).not.toThrow();
    });

    it('should apply default values', () => {
      const minimalRow = {
        testCaseId: 'PROJ-123-TC-01',
        jiraStoryId: 'PROJ-123',
        featureName: 'Test Feature',
        scenarioTitle: 'Test Scenario',
        tags: '@test',
        acReference: 'AC-1',
        givenSteps: 'Given something',
        whenSteps: 'When something happens',
        thenSteps: 'Then something occurs',
        testType: 'smoke',
        createdDate: '2024-01-15',
      };

      const parsed = sheetRowSchema.parse(minimalRow);
      expect(parsed.status).toBe('Not Executed');
      expect(parsed.automationStatus).toBe('Pending - Phase 2');
      expect(parsed.notes).toBe('');
    });

    it('should validate all test types', () => {
      const testTypes = ['smoke', 'negative', 'regression'];
      
      testTypes.forEach(testType => {
        const row = { ...validRow, testType };
        expect(() => sheetRowSchema.parse(row)).not.toThrow();
      });
    });

    it('should reject row with invalid test case ID', () => {
      const invalidRow = { ...validRow, testCaseId: 'invalid-id' };
      expect(() => sheetRowSchema.parse(invalidRow)).toThrow();
    });

    it('should reject row with invalid story ID', () => {
      const invalidRow = { ...validRow, jiraStoryId: 'invalid-id' };
      expect(() => sheetRowSchema.parse(invalidRow)).toThrow();
    });

    it('should reject row with invalid date format', () => {
      const invalidRow = { ...validRow, createdDate: '01/15/2024' };
      expect(() => sheetRowSchema.parse(invalidRow)).toThrow();
    });

    it('should reject row with invalid test type', () => {
      const invalidRow = { ...validRow, testType: 'invalid' };
      expect(() => sheetRowSchema.parse(invalidRow)).toThrow();
    });

    it('should reject row with invalid AC reference', () => {
      const invalidRow = { ...validRow, acReference: 'AC1' };
      expect(() => sheetRowSchema.parse(invalidRow)).toThrow();
    });
  });

  describe('googleSheetsConfigSchema', () => {
    const validConfig = {
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetName: 'Test Scenarios',
      serviceAccountKey: '/path/to/service-account.json',
    };

    it('should validate complete config', () => {
      expect(() => googleSheetsConfigSchema.parse(validConfig)).not.toThrow();
    });

    it('should apply default sheet name', () => {
      const { sheetName, ...configWithoutSheetName } = validConfig;
      const parsed = googleSheetsConfigSchema.parse(configWithoutSheetName);
      expect(parsed.sheetName).toBe('Test Scenarios');
    });

    it('should reject config with empty spreadsheet ID', () => {
      const invalidConfig = { ...validConfig, spreadsheetId: '' };
      expect(() => googleSheetsConfigSchema.parse(invalidConfig)).toThrow();
    });

    it('should reject config with empty service account key', () => {
      const invalidConfig = { ...validConfig, serviceAccountKey: '' };
      expect(() => googleSheetsConfigSchema.parse(invalidConfig)).toThrow();
    });
  });

  describe('sheetsValueRangeSchema', () => {
    const validRange = {
      range: 'Sheet1!A1:C3',
      majorDimension: 'ROWS',
      values: [
        ['Header1', 'Header2', 'Header3'],
        ['Value1', 'Value2', 'Value3'],
      ],
    };

    it('should validate complete value range', () => {
      expect(() => sheetsValueRangeSchema.parse(validRange)).not.toThrow();
    });

    it('should validate range without optional fields', () => {
      const minimalRange = { range: 'Sheet1!A1:A1' };
      expect(() => sheetsValueRangeSchema.parse(minimalRange)).not.toThrow();
    });

    it('should validate both major dimensions', () => {
      const rowsRange = { ...validRange, majorDimension: 'ROWS' };
      const colsRange = { ...validRange, majorDimension: 'COLUMNS' };
      
      expect(() => sheetsValueRangeSchema.parse(rowsRange)).not.toThrow();
      expect(() => sheetsValueRangeSchema.parse(colsRange)).not.toThrow();
    });

    it('should reject range with invalid major dimension', () => {
      const invalidRange = { ...validRange, majorDimension: 'INVALID' };
      expect(() => sheetsValueRangeSchema.parse(invalidRange)).toThrow();
    });
  });

  describe('sheetsAppendResponseSchema', () => {
    const validResponse = {
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      tableRange: 'Sheet1!A1:C3',
      updates: {
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        updatedRange: 'Sheet1!A2:C3',
        updatedRows: 2,
        updatedColumns: 3,
        updatedCells: 6,
      },
    };

    it('should validate complete append response', () => {
      expect(() => sheetsAppendResponseSchema.parse(validResponse)).not.toThrow();
    });

    it('should reject response with negative updated values', () => {
      const invalidResponse = {
        ...validResponse,
        updates: { ...validResponse.updates, updatedRows: -1 },
      };
      expect(() => sheetsAppendResponseSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('appendScenariosRequestSchema', () => {
    const validRequest = {
      scenarios: [
        {
          id: 'scenario-1',
          title: 'User can log in',
          tags: ['@smoke', '@PROJ-123'],
          acReference: 'AC-1',
          type: 'happy',
          steps: [
            { keyword: 'Given', text: 'user exists' },
            { keyword: 'When', text: 'user logs in' },
            { keyword: 'Then', text: 'user sees dashboard' },
          ],
        },
      ],
      storyId: 'PROJ-123',
      featureName: 'User Authentication',
    };

    it('should validate complete append request', () => {
      expect(() => appendScenariosRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should validate all scenario types', () => {
      const types = ['happy', 'negative', 'edge'];
      
      types.forEach(type => {
        const request = {
          ...validRequest,
          scenarios: [{ ...validRequest.scenarios[0], type }],
        };
        expect(() => appendScenariosRequestSchema.parse(request)).not.toThrow();
      });
    });

    it('should reject request with invalid story ID', () => {
      const invalidRequest = { ...validRequest, storyId: 'invalid-id' };
      expect(() => appendScenariosRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with empty feature name', () => {
      const invalidRequest = { ...validRequest, featureName: '' };
      expect(() => appendScenariosRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('checkDuplicatesRequestSchema', () => {
    const validRequest = {
      storyId: 'PROJ-123',
      scenarioTitles: ['User can log in', 'User can log out'],
    };

    it('should validate complete duplicates check request', () => {
      expect(() => checkDuplicatesRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject request with invalid story ID', () => {
      const invalidRequest = { ...validRequest, storyId: 'invalid-id' };
      expect(() => checkDuplicatesRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with empty scenario titles', () => {
      const invalidRequest = { ...validRequest, scenarioTitles: [''] };
      expect(() => checkDuplicatesRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('duplicateCheckResultSchema', () => {
    const validResult = {
      duplicates: [
        {
          scenarioTitle: 'User can log in',
          existingTestCaseId: 'PROJ-123-TC-01',
        },
      ],
      newScenarios: ['User can log out', 'User can reset password'],
    };

    it('should validate complete duplicate check result', () => {
      expect(() => duplicateCheckResultSchema.parse(validResult)).not.toThrow();
    });

    it('should validate result with no duplicates', () => {
      const noDuplicatesResult = {
        duplicates: [],
        newScenarios: ['All scenarios are new'],
      };
      expect(() => duplicateCheckResultSchema.parse(noDuplicatesResult)).not.toThrow();
    });

    it('should validate result with no new scenarios', () => {
      const noNewScenariosResult = {
        duplicates: [
          {
            scenarioTitle: 'Existing scenario',
            existingTestCaseId: 'PROJ-123-TC-01',
          },
        ],
        newScenarios: [],
      };
      expect(() => duplicateCheckResultSchema.parse(noNewScenariosResult)).not.toThrow();
    });
  });

  describe('sheetsOperationResultSchema', () => {
    const validResult = {
      success: true,
      syncResults: {
        rowsAdded: 3,
        rowsSkipped: 1,
        scenarios: [],
      },
      metadata: {
        operationType: 'append',
        executionTime: 500,
        apiCallsUsed: 2,
      },
    };

    it('should validate complete operation result', () => {
      expect(() => sheetsOperationResultSchema.parse(validResult)).not.toThrow();
    });

    it('should validate failed operation result', () => {
      const failedResult = {
        success: false,
        error: 'Failed to connect to Google Sheets API',
      };
      expect(() => sheetsOperationResultSchema.parse(failedResult)).not.toThrow();
    });

    it('should validate all operation types', () => {
      const operationTypes = ['append', 'update', 'check'];
      
      operationTypes.forEach(operationType => {
        const result = {
          ...validResult,
          metadata: { ...validResult.metadata!, operationType },
        };
        expect(() => sheetsOperationResultSchema.parse(result)).not.toThrow();
      });
    });

    it('should reject result with negative execution time', () => {
      const invalidResult = {
        ...validResult,
        metadata: { ...validResult.metadata!, executionTime: -1 },
      };
      expect(() => sheetsOperationResultSchema.parse(invalidResult)).toThrow();
    });

    it('should reject result with negative API calls used', () => {
      const invalidResult = {
        ...validResult,
        metadata: { ...validResult.metadata!, apiCallsUsed: -1 },
      };
      expect(() => sheetsOperationResultSchema.parse(invalidResult)).toThrow();
    });
  });
});