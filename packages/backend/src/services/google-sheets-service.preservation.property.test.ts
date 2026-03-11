/**
 * Preservation Property Tests for Google Sheets Service
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 * 
 * These tests verify that non-buggy behavior remains unchanged after the fix.
 * They should PASS on unfixed code to establish baseline behavior.
 * 
 * Property 2: Preservation - Non-Buggy Behavior Unchanged
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

describe('Preservation Property Tests: Non-Buggy Behavior', () => {
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

  /**
   * Property 2.1: Return Value Structure
   * **Validates: Requirement 3.1**
   * 
   * WHEN scenarios are successfully synced
   * THEN return { rowsAdded: number, rowsSkipped: number, scenarios: Array }
   */
  describe('2.1 Return Value Structure', () => {
    it('should return correct structure with rowsAdded, rowsSkipped, and scenarios array', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'precondition' },
            { keyword: 'When' as const, text: 'action' },
            { keyword: 'Then' as const, text: 'result' },
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
          tableRange: 'Test Scenarios!A1:N1',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N1',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      // Verify return value structure
      expect(result).toHaveProperty('rowsAdded');
      expect(result).toHaveProperty('rowsSkipped');
      expect(result).toHaveProperty('scenarios');
      
      expect(typeof result.rowsAdded).toBe('number');
      expect(typeof result.rowsSkipped).toBe('number');
      expect(Array.isArray(result.scenarios)).toBe(true);
      
      // Verify scenarios array structure
      expect(result.scenarios[0]).toHaveProperty('testCaseId');
      expect(result.scenarios[0]).toHaveProperty('scenarioTitle');
      expect(result.scenarios[0]).toHaveProperty('tags');
      expect(result.scenarios[0]).toHaveProperty('acReference');
      expect(result.scenarios[0]).toHaveProperty('status');
    });

    it('should return correct structure when all scenarios are skipped', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Duplicate scenario',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [['PROJ-123', 'Test Feature', 'Duplicate scenario']],
            },
          ],
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(0);
      expect(result.rowsSkipped).toBe(1);
      expect(result.scenarios).toHaveLength(0);
    });
  });

  /**
   * Property 2.2: Test Case ID Format
   * **Validates: Requirement 3.2**
   * 
   * WHEN generating test case IDs
   * THEN use format {StoryID}-TC-{number} with zero-padded numbers (e.g., PROJ-123-TC-01)
   */
  describe('2.2 Test Case ID Format', () => {
    it('should generate test case IDs with correct format and zero-padding', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'First scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
        {
          id: 'scenario-2',
          title: 'Second scenario',
          tags: ['smoke'],
          acReference: 'AC-2',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
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
          tableRange: 'Test Scenarios!A1:N2',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N2',
            updatedRows: 2,
            updatedColumns: 14,
            updatedCells: 28,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      // Verify format: {StoryID}-TC-{number}
      expect(result.scenarios[0].testCaseId).toMatch(/^PROJ-123-TC-\d{2}$/);
      expect(result.scenarios[1].testCaseId).toMatch(/^PROJ-123-TC-\d{2}$/);
      
      // Verify zero-padding
      expect(result.scenarios[0].testCaseId).toBe('PROJ-123-TC-01');
      expect(result.scenarios[1].testCaseId).toBe('PROJ-123-TC-02');
    });

    it('should maintain zero-padding for double-digit test case numbers', async () => {
      const testCaseId = googleSheetsService.generateTestCaseId('PROJ-456', 15);
      expect(testCaseId).toBe('PROJ-456-TC-15');
      expect(testCaseId).toMatch(/^PROJ-456-TC-\d{2}$/);
    });

    it('should handle triple-digit test case numbers correctly', async () => {
      const testCaseId = googleSheetsService.generateTestCaseId('PROJ-789', 123);
      expect(testCaseId).toBe('PROJ-789-TC-123');
      expect(testCaseId).toMatch(/^PROJ-789-TC-\d+$/);
    });
  });

  /**
   * Property 2.3: Step Formatting
   * **Validates: Requirement 3.3**
   * 
   * WHEN formatting scenario steps for the sheet
   * THEN separate Given/When/Then steps into appropriate columns
   */
  describe('2.3 Step Formatting', () => {
    it('should separate Given/When/Then steps into appropriate columns', async () => {
      const steps = [
        { keyword: 'Given' as const, text: 'user is logged in' },
        { keyword: 'And' as const, text: 'user has permissions' },
        { keyword: 'When' as const, text: 'user clicks button' },
        { keyword: 'And' as const, text: 'user confirms action' },
        { keyword: 'Then' as const, text: 'action is performed' },
        { keyword: 'And' as const, text: 'success message is shown' },
      ];

      const givenSteps = googleSheetsService.formatStepsForSheet(steps, 'Given');
      const whenSteps = googleSheetsService.formatStepsForSheet(steps, 'When');
      const thenSteps = googleSheetsService.formatStepsForSheet(steps, 'Then');

      // Verify Given steps include And steps that follow Given
      expect(givenSteps).toBe('Given user is logged in\nAnd user has permissions');
      
      // Verify When steps include And steps that follow When
      expect(whenSteps).toBe('When user clicks button\nAnd user confirms action');
      
      // Verify Then steps include And steps that follow Then
      expect(thenSteps).toBe('Then action is performed\nAnd success message is shown');
    });

    it('should handle steps with only primary keywords (no And/But)', async () => {
      const steps = [
        { keyword: 'Given' as const, text: 'precondition' },
        { keyword: 'When' as const, text: 'action' },
        { keyword: 'Then' as const, text: 'result' },
      ];

      const givenSteps = googleSheetsService.formatStepsForSheet(steps, 'Given');
      const whenSteps = googleSheetsService.formatStepsForSheet(steps, 'When');
      const thenSteps = googleSheetsService.formatStepsForSheet(steps, 'Then');

      expect(givenSteps).toBe('Given precondition');
      expect(whenSteps).toBe('When action');
      expect(thenSteps).toBe('Then result');
    });

    it('should handle empty steps gracefully', async () => {
      const result = googleSheetsService.formatStepsForSheet([], 'Given');
      expect(result).toBe('');
    });
  });

  /**
   * Property 2.4: Error Handling
   * **Validates: Requirement 3.4**
   * 
   * WHEN API errors occur (authentication, quota, network)
   * THEN provide user-friendly error messages
   */
  describe('2.4 Error Handling', () => {
    it('should provide user-friendly authentication error message', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
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

    it('should provide user-friendly quota exceeded error message', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
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

    it('should provide user-friendly network error message for timeout', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      const timeoutError = new Error('ETIMEDOUT');
      timeoutError.name = 'ETIMEDOUT';
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(timeoutError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Network error connecting to Google Sheets. Please check your connection and try again.'
      );
    });

    it('should provide user-friendly network error message for connection reset', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      const connectionError = new Error('Connection reset');
      (connectionError as any).code = 'ECONNRESET';
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(connectionError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Network error connecting to Google Sheets. Please check your connection and try again.'
      );
    });

    it('should provide user-friendly network error message for DNS failure', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      const dnsError = new Error('DNS lookup failed');
      (dnsError as any).code = 'ENOTFOUND';
      mockSheets.spreadsheets.values.batchGet.mockRejectedValueOnce(dnsError);

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature')).rejects.toThrow(
        'Network error connecting to Google Sheets. Please check your connection and try again.'
      );
    });
  });

  /**
   * Property 2.5: Input Validation
   * **Validates: Requirement 3.5**
   * 
   * WHEN validating inputs
   * THEN reject empty or invalid Story ID and Feature Name values
   */
  describe('2.5 Input Validation', () => {
    it('should reject empty Story ID', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      await expect(googleSheetsService.syncScenarios(scenarios, '', 'Test Feature')).rejects.toThrow(
        'Story ID is required and cannot be empty'
      );
    });

    it('should reject whitespace-only Story ID', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      await expect(googleSheetsService.syncScenarios(scenarios, '   ', 'Test Feature')).rejects.toThrow(
        'Story ID is required and cannot be empty'
      );
    });

    it('should reject empty Feature Name', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', '')).rejects.toThrow(
        'Feature name is required and cannot be empty'
      );
    });

    it('should reject whitespace-only Feature Name', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test scenario',
          tags: ['smoke'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      await expect(googleSheetsService.syncScenarios(scenarios, 'PROJ-123', '   ')).rejects.toThrow(
        'Feature name is required and cannot be empty'
      );
    });

    it('should handle empty scenarios array gracefully', async () => {
      const result = await googleSheetsService.syncScenarios([], 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(0);
      expect(result.rowsSkipped).toBe(0);
      expect(result.scenarios).toHaveLength(0);
    });
  });

  /**
   * Property 2.6: Special Characters
   * **Validates: Requirement 3.6**
   * 
   * WHEN processing scenarios with special characters or Unicode
   * THEN handle them correctly without corruption
   */
  describe('2.6 Special Characters', () => {
    it('should handle Unicode characters correctly', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test with Unicode: 测试 émojis',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has credentials with special chars: àáâãäå' },
            { keyword: 'When' as const, text: 'user submits form' },
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
          tableRange: 'Test Scenarios!A1:N1',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N1',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Unicode Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.scenarios[0].scenarioTitle).toBe('Test with Unicode: 测试 émojis');
    });

    it('should handle emoji characters correctly', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test with emoji 🚀 🎉',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user clicks 👍 button' },
            { keyword: 'When' as const, text: 'system processes request' },
            { keyword: 'Then' as const, text: 'success icon 🎉 is displayed' },
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
          tableRange: 'Test Scenarios!A1:N1',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N1',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Emoji Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.scenarios[0].scenarioTitle).toBe('Test with emoji 🚀 🎉');
    });

    it('should handle HTML special characters correctly', async () => {
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
          tableRange: 'Test Scenarios!A1:N1',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N1',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Special Chars Feature');

      expect(result.rowsAdded).toBe(1);
      expect(result.scenarios[0].scenarioTitle).toBe('Test with "quotes" & special chars <script>');
    });

    it('should handle newlines and tabs in scenario text', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Test with whitespace',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [
            { keyword: 'Given' as const, text: 'user has\tmultiple\tfields' },
            { keyword: 'When' as const, text: 'user submits form' },
            { keyword: 'Then' as const, text: 'system processes correctly' },
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
          tableRange: 'Test Scenarios!A1:N1',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N1',
            updatedRows: 1,
            updatedColumns: 14,
            updatedCells: 14,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Whitespace Feature');

      expect(result.rowsAdded).toBe(1);
    });
  });

  /**
   * Property 2.7: Batch Operations
   * **Validates: Requirement 3.7**
   * 
   * WHEN multiple scenarios are synced in a single operation
   * THEN perform batch operations efficiently (single API call)
   */
  describe('2.7 Batch Operations', () => {
    it('should sync multiple scenarios in a single API call', async () => {
      const scenarios = Array.from({ length: 10 }, (_, i) => ({
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
          tableRange: 'Test Scenarios!A1:N10',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N10',
            updatedRows: 10,
            updatedColumns: 14,
            updatedCells: 140,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Batch Feature');

      expect(result.rowsAdded).toBe(10);
      expect(result.scenarios).toHaveLength(10);
      
      // Verify single batch operation (not multiple individual calls)
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1);
      
      // Verify all scenarios are in a single append call
      const appendCall = mockSheets.spreadsheets.values.append.mock.calls[0];
      expect(appendCall[0].requestBody.values).toHaveLength(10);
    });

    it('should handle large batch of scenarios efficiently (50 scenarios)', async () => {
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
          tableRange: 'Test Scenarios!A1:N50',
          updates: {
            spreadsheetId: mockConfig.spreadsheetId,
            updatedRange: 'Test Scenarios!A1:N50',
            updatedRows: 50,
            updatedColumns: 14,
            updatedCells: 700,
          },
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Large Batch Feature');

      expect(result.rowsAdded).toBe(50);
      expect(result.scenarios).toHaveLength(50);
      
      // Verify single batch operation for efficiency
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1);
    });

    it('should batch only new scenarios when some are duplicates', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Existing scenario',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
        {
          id: 'scenario-2',
          title: 'New scenario 1',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-2',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
        {
          id: 'scenario-3',
          title: 'New scenario 2',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-3',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [['PROJ-123', 'Test Feature', 'Existing scenario']],
            },
          ],
        },
      });

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

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(2);
      expect(result.rowsSkipped).toBe(1);
      
      // Verify single batch operation for new scenarios only
      expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1);
      
      const appendCall = mockSheets.spreadsheets.values.append.mock.calls[0];
      expect(appendCall[0].requestBody.values).toHaveLength(2);
    });

    it('should not make append call when all scenarios are duplicates', async () => {
      const scenarios = [
        {
          id: 'scenario-1',
          title: 'Duplicate 1',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-1',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
        {
          id: 'scenario-2',
          title: 'Duplicate 2',
          tags: ['smoke', 'PROJ-123'],
          acReference: 'AC-2',
          type: 'happy' as const,
          steps: [{ keyword: 'Given' as const, text: 'test' }],
        },
      ];

      mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
        data: {
          spreadsheetId: mockConfig.spreadsheetId,
          valueRanges: [
            {
              range: 'Test Scenarios!B:D',
              values: [
                ['PROJ-123', 'Test Feature', 'Duplicate 1'],
                ['PROJ-123', 'Test Feature', 'Duplicate 2'],
              ],
            },
          ],
        },
      });

      const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

      expect(result.rowsAdded).toBe(0);
      expect(result.rowsSkipped).toBe(2);
      
      // Verify no append call when all are duplicates (efficiency)
      expect(mockSheets.spreadsheets.values.append).not.toHaveBeenCalled();
    });
  });
});
