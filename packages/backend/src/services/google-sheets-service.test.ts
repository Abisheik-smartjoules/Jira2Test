/**
 * GoogleSheetsService integration tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleSheetsService } from './google-sheets-service.js';
import type { GoogleSheetsConfig } from '../validation/sheets-schemas.js';

// Mock googleapis
const mockSheets = {
  spreadsheets: {
    values: {
      get: vi.fn(),
      update: vi.fn(),
      append: vi.fn(),
      batchGet: vi.fn(),
    },
  },
};

const mockAuth = {
  getClient: vi.fn(),
};

vi.mock('googleapis', () => ({
  google: {
    sheets: vi.fn(() => mockSheets),
    auth: {
      GoogleAuth: vi.fn(() => mockAuth),
    },
  },
}));

describe('GoogleSheetsService', () => {
  let googleSheetsService: GoogleSheetsService;
  let mockConfig: GoogleSheetsConfig;

  beforeEach(() => {
    mockConfig = {
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetName: 'Test Scenarios',
      serviceAccountKey: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'key-id',
        private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        client_email: 'test@test-project.iam.gserviceaccount.com',
        client_id: '123456789',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      }),
    };

    vi.clearAllMocks();
    
    mockAuth.getClient.mockResolvedValue({});
    
    // Default mock for ensureHeaderRow - returns existing headers
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: {
        values: [['Test Case ID', 'Jira Story ID', 'Feature Name', 'Scenario Title', 'Tags', 'AC Reference', 'Step Definition', 'Test Type', 'Status', 'Automation Status', 'Created Date', 'Notes']],
      },
    });
    
    googleSheetsService = new GoogleSheetsService(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('syncScenarios', () => {
    it('should sync scenarios to Google Sheets successfully', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Valid user can log in',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has valid credentials' },
            { keyword: 'When' as const, text: 'user submits login form' },
            { keyword: 'Then' as const, text: 'user is redirected to dashboard' },
          ],
        },
        {
          id: 'scenario-2',
          title: 'Invalid credentials show error',
          tags: ['negative', 'PROJ-123'],
          acReference: 'AC-2',
          type: 'negative' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has invalid credentials' },
            { keyword: 'When' as const, text: 'user submits login form' },
            { keyword: 'Then' as const, text: 'error message is displayed' },
          ],
        },
      ];

      // Mock existing data check (no duplicates)
      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [
                ['PROJ-456', 'Different Feature', 'Different scenario'],
              ],
            },
          ],
        },
      });

      // Mock append operation
      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:N3',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:N3',
            updatedRows: 2,
            updatedColumns: 14,
            updatedCells: 28,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'User Authentication');

      expect(result.rowsAdded).toBe(2);
      expect(result.rowsSkipped).toBe(0);
      expect(result.scenarios).toHaveLength(2);
      expect(result.scenarios[0].testCaseId).toBe('PROJ-123-TC-01');
      expect(result.scenarios[1].testCaseId).toBe('PROJ-123-TC-02');
    });

    it('should skip duplicate scenarios', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Valid user can log in',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has valid credentials' },
            { keyword: 'When' as const, text: 'user submits login form' },
            { keyword: 'Then' as const, text: 'user is redirected to dashboard' },
          ],
        },
      ];

      // Mock ensureHeaderRow call
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: [['Test Case ID', 'Jira Story ID', 'Feature Name', 'Scenario Title', 'Tags', 'AC Reference', 'Step Definition', 'Test Type', 'Status', 'Automation Status', 'Created Date', 'Notes']],
        },
      });

      // Mock existing data check (duplicate found)
      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [
                ['Jira Story ID', 'Feature Name', 'Scenario Title'], // Header row
                ['PROJ-123', 'User Authentication', 'Valid user can log in'],
              ],
            },
          ],
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'User Authentication');

      expect(result.rowsAdded).toBe(0);
      expect(result.rowsSkipped).toBe(1);
      expect(result.scenarios).toHaveLength(0);
      expect(mockSheets.spreadsheets.values.append).not.toHaveBeenCalled();
    });

    it('should generate correct test case IDs', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'First scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      // Mock ensureHeaderRow call
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: [['Test Case ID', 'Jira Story ID', 'Feature Name', 'Scenario Title', 'Tags', 'AC Reference', 'Step Definition', 'Test Type', 'Status', 'Automation Status', 'Created Date', 'Notes']],
        },
      });

      // Mock existing data with some test cases
      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [
                ['PROJ-123', 'Other Feature', 'Other scenario'],
                ['PROJ-456', 'Different Feature', 'Different scenario'],
              ],
            },
          ],
        },
      });

      // Mock getting existing test case IDs for the story
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: [
            ['Test Case ID'], // Header row
            ['PROJ-123-TC-01'],
            ['PROJ-123-TC-03'], // Gap in numbering
          ],
        },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:B2',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:B2',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      expect(result.scenarios[0].testCaseId).toBe('PROJ-123-TC-04'); // Next available number
    });

    it('should handle API errors gracefully', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      const error = new Error('Sheets API error');
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(error);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Failed to sync scenarios to Google Sheets: Sheets API error'
      );
    });

    it('should handle authentication errors', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      const authError = {
        response: { status: 401 },
        message: 'Authentication failed',
      };
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(authError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Google Sheets authentication failed. Please check service account credentials.'
      );
    });

    it('should handle quota exceeded errors', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      const quotaError = {
        response: { status: 429 },
        message: 'Quota exceeded',
      };
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(quotaError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Google Sheets API quota exceeded. Please try again later.'
      );
    });
  });

  describe('generateTestCaseId', () => {
    it('should generate test case ID with correct format', () => {
      const testCaseId = googleSheetsService.generateTestCaseId('PROJ-123', 1);
      expect(testCaseId).toBe('PROJ-123-TC-01');
    });

    it('should handle double-digit numbers', () => {
      const testCaseId = googleSheetsService.generateTestCaseId('PROJ-456', 15);
      expect(testCaseId).toBe('PROJ-456-TC-15');
    });
  });

  describe('formatStepsForSheet', () => {
    it('should format steps correctly', () => {
      const steps = [
        { keyword: 'Given' as const, text: 'user is logged in' },
        { keyword: 'And' as const, text: 'user has permissions' },
        { keyword: 'When' as const, text: 'user clicks button' },
        { keyword: 'Then' as const, text: 'action is performed' },
      ];

      const result = googleSheetsService.formatStepsForSheet(steps, 'Given');

      expect(result).toBe('Given user is logged in\nAnd user has permissions');
    });

    it('should handle empty steps', () => {
      const result = googleSheetsService.formatStepsForSheet([], 'Given');
      expect(result).toBe('');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty scenarios array', async () => {
      const result = await googleSheetsService.syncScenarios([], 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(0);
      expect(result.rowsSkipped).toBe(0);
      expect(result.scenarios).toHaveLength(0);
      expect(mockSheets.spreadsheets.values.batchGet).not.toHaveBeenCalled();
    });

    it('should handle scenarios with special characters', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test with "quotes" & special chars <script>',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has "special" credentials' },
            { keyword: 'When' as const, text: 'user submits form with & symbols' },
            { keyword: 'Then' as const, text: 'system handles <tags> correctly' },
          ],
        },
      ];

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [{ range: 'Test Scenarios!B:D', values: [] }],
        },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:N2',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:N2',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.scenarios[0].scenarioTitle).toBe('Test with "quotes" & special chars <script>');
    });

    it('should handle network timeout errors', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      const timeoutError = new Error('ETIMEDOUT');
      timeoutError.name = 'ETIMEDOUT';
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(timeoutError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Network error connecting to Google Sheets. Please check your connection and try again.'
      );
    });

    it('should handle invalid service account credentials', async () => {
      const invalidConfig = {
        ...mockConfig,
        serviceAccountKey: 'invalid-json',
      };

      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      await expect(async () => {
        const service = new GoogleSheetsService(invalidConfig);
        // Try to use the service with actual scenarios to trigger authentication
        await service.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');
      }).rejects.toThrow('Failed to sync scenarios to Google Sheets');
    });

    it('should validate required inputs', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      await expect(googleSheetsService.syncScenarios(scenarios, '', 'Test Feature')).rejects.toThrow(
        'Story ID is required and cannot be empty'
      );

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', '')).rejects.toThrow(
        'Feature name is required and cannot be empty'
      );
    });
  });

  describe('batch operations', () => {
    it('should handle large number of scenarios efficiently', async () => {
      const scenarios = Array.from({ length: 50 }, (_, i) => ({
        id: `scenario-${i + 1}`,
        title: `Test scenario ${i + 1}`,
        tags: ['regression', 'PROJ-123'],
        acReference: `AC-${i + 1}`,
        type: 'edge' as const,
        steps: [
          { keyword: 'Given' as const, text: `precondition ${i + 1}` },
          { keyword: 'When' as const, text: `action ${i + 1}` },
          { keyword: 'Then' as const, text: `result ${i + 1}` },
        ],
      }));

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [{ range: 'Test Scenarios!B:D', values: [] }],
        },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:N51',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:N51',
            updatedRows: 50,
            updatedColumns: 14,
            updatedCells: 700,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Large Feature');

      expect(result.rowsAdded).toBe(50);
      expect(result.scenarios).toHaveLength(50);
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1); // Single batch operation
    });
  });

  describe('configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(googleSheetsService).toBeDefined();
      // Configuration is tested through successful API calls in other tests
    });

    it('should validate configuration schema', () => {
      const invalidConfig = {
        spreadsheetId: '',
        sheetName: 'Test Scenarios',
        serviceAccountKey: mockConfig.serviceAccountKey,
      };

      expect(() => new GoogleSheetsService(invalidConfig)).toThrow();
    });

    it('should create service from environment variables', () => {
      const env = {
        GOOGLE_SHEETS_SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        GOOGLE_SHEETS_SHEET_NAME: 'Custom Sheet Name',
        GOOGLE_SERVICE_ACCOUNT_KEY: mockConfig.serviceAccountKey,
      };

      const service = GoogleSheetsService.fromEnvironment(env);
      expect(service).toBeDefined();
    });

    it('should use default sheet name when not provided in environment', () => {
      const env = {
        GOOGLE_SHEETS_SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        GOOGLE_SERVICE_ACCOUNT_KEY: mockConfig.serviceAccountKey,
      };

      const service = GoogleSheetsService.fromEnvironment(env);
      expect(service).toBeDefined();
    });
  });

  describe('additional integration scenarios', () => {
    it('should handle malformed API responses gracefully', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      // Mock malformed response from batchGet
      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          // Missing required fields
          valueRanges: null,
        },
      });

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow();
    });

    it('should handle connection reset errors', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      const connectionError = new Error('Connection reset');
      connectionError.code = 'ECONNRESET';
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(connectionError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Network error connecting to Google Sheets. Please check your connection and try again.'
      );
    });

    it('should handle scenarios with complex step structures', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Complex scenario with multiple step types',
          tags: ['regression', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'edge' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user is on the login page' },
            { keyword: 'And' as const, text: 'user has valid credentials' },
            { keyword: 'And' as const, text: 'system is in maintenance mode' },
            { keyword: 'When' as const, text: 'user attempts to log in' },
            { keyword: 'And' as const, text: 'user waits for system response' },
            { keyword: 'Then' as const, text: 'maintenance message is displayed' },
            { keyword: 'And' as const, text: 'login form remains visible' },
            { keyword: 'But' as const, text: 'user cannot proceed to dashboard' },
          ],
        },
      ];

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [{ range: 'Test Scenarios!B:D', values: [] }],
        },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:N2',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:N2',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Complex Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.scenarios[0].scenarioTitle).toBe('Complex scenario with multiple step types');
    });

    it('should handle partial duplicate scenarios correctly', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Existing scenario',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
        {
          id: 'scenario-2',
          title: 'New scenario',
          tags: ['negative', 'PROJ-123'],
          acReference: 'AC-2',
          type: 'negative' as const,
          steps: [{ keyword: 'Given' as const, text: 'different test step' }],
        },
      ];

      // Mock ensureHeaderRow call
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: [['Test Case ID', 'Jira Story ID', 'Feature Name', 'Scenario Title', 'Tags', 'AC Reference', 'Step Definition', 'Test Type', 'Status', 'Automation Status', 'Created Date', 'Notes']],
        },
      });

      // Mock existing data with one duplicate
      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [
                ['Jira Story ID', 'Feature Name', 'Scenario Title'], // Header row
                ['PROJ-123', 'Test Feature', 'Existing scenario'],
              ],
            },
          ],
        },
      });

      // Mock getNextTestCaseNumber call
      mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
        data: {
          values: [
            ['Test Case ID'], // Header row
            ['PROJ-123-TC-01'],
          ],
        },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:N2',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:N2',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.rowsSkipped).toBe(1);
      expect(result.scenarios).toHaveLength(1);
      expect(result.scenarios[0].scenarioTitle).toBe('New scenario');
    });

    it('should handle service account key with missing required fields', async () => {
      const incompleteServiceAccountKey = JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        // Missing private_key and client_email
      });

      const invalidConfig = {
        ...mockConfig,
        serviceAccountKey: incompleteServiceAccountKey,
      };

      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      await expect(async () => {
        const service = new GoogleSheetsService(invalidConfig);
        await service.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');
      }).rejects.toThrow("Missing required field 'private_key' in service account key");
    });

    it('should handle scenarios with Unicode and emoji characters', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test with Unicode: 测试 🚀 émojis',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has credentials with special chars: àáâãäå' },
            { keyword: 'When' as const, text: 'user submits form with emoji 🎉' },
            { keyword: 'Then' as const, text: 'system displays success message: ✅ 成功' },
          ],
        },
      ];

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [{ range: 'Test Scenarios!B:D', values: [] }],
        },
      });

      mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          tableRange: 'Test Scenarios!A2:N2',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A2:N2',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Unicode Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.scenarios[0].scenarioTitle).toBe('Test with Unicode: 测试 🚀 émojis');
    });

    it('should handle API rate limiting with retry logic simulation', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test step' }],
        },
      ];

      // First call fails with rate limit, second succeeds
      mockSheets.spreadsheets.values.batchGet
        .mockRejectedValueOnce({
          response: { status: 429 },
          message: 'Rate limit exceeded',
        })
        .mockResolvedValueOnce({
          data: {
            spreadsheetId: mockConfig.spreadsheetId,
            valueRanges: [{ range: 'Test Scenarios!B:D', values: [] }],
          },
        });

      // Test that the service properly handles rate limiting
      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Google Sheets API quota exceeded. Please try again later.'
      );
    });
  });
});