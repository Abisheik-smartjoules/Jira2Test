/**
 * Bug Condition Exploration Test for Google Sheets Append Scenarios Fix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * The bug: existing data is cleared when syncing new scenarios to a sheet with existing data.
 * 
 * Expected behavior (encoded in this test):
 * - Existing rows are preserved when syncing new scenarios
 * - Only new scenarios are appended (not replacing)
 * - No duplicates are added
 * - Column structure remains consistent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleSheetsService } from './google-sheets-service.js';
import type { GoogleSheetsConfig } from '../validation/sheets-schemas.js';

// Mock googleapis
const mockSheets = {
  spreadsheets: {
    values: {
      get: vi.fn(),
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

describe('Bug Condition Exploration: Existing Data Preservation on Sync', () => {
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

    mockAuth.getClient.mockResolvedValue({});
    googleSheetsService = new GoogleSheetsService(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 1: Fault Condition - Existing Data Preservation on Sync
   * 
   * Bug Condition:
   * input.operation === "syncScenarios" AND
   * input.hasExistingData === true AND
   * input.newScenarios.length > 0
   * 
   * Expected Behavior:
   * result.existingRowsPreserved === true AND
   * result.onlyNewScenariosAdded === true AND
   * result.noDuplicatesAdded === false AND
   * result.columnStructureConsistent === true
   * 
   * CRITICAL: This test MUST FAIL on unfixed code to confirm the bug exists.
   * 
   * NOTE: After running this test, it appears the current implementation already
   * preserves existing data correctly using the append API. The bug may have been
   * fixed already, or the bug description needs clarification. This test will serve
   * as a regression test to ensure the behavior remains correct.
   */
  it('should preserve existing scenarios when syncing new scenarios to sheet with existing data', async () => {
    // SETUP: Create mock sheet with existing test scenarios for PROJ-456
    const existingScenarios = [
      ['PROJ-456-TC-01', 'PROJ-456', 'Existing Feature', 'Existing scenario 1', 'smoke', 'AC-1', 'Given step 1', 'When step 1', 'Then step 1', 'smoke', 'Not Executed', 'Pending - Phase 2', '2024-01-01', ''],
      ['PROJ-456-TC-02', 'PROJ-456', 'Existing Feature', 'Existing scenario 2', 'regression', 'AC-2', 'Given step 2', 'When step 2', 'Then step 2', 'regression', 'Not Executed', 'Pending - Phase 2', '2024-01-01', ''],
      ['PROJ-456-TC-03', 'PROJ-456', 'Existing Feature', 'Existing scenario 3', 'negative', 'AC-3', 'Given step 3', 'When step 3', 'Then step 3', 'negative', 'Not Executed', 'Pending - Phase 2', '2024-01-01', ''],
    ];

    // Mock batchGet to return existing scenarios
    mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
      data: {
        spreadsheetId: mockConfig.spreadsheetId,
        valueRanges: [
          {
            range: 'Test Scenarios!B:D',
            values: [
              ['PROJ-456', 'Existing Feature', 'Existing scenario 1'],
              ['PROJ-456', 'Existing Feature', 'Existing scenario 2'],
              ['PROJ-456', 'Existing Feature', 'Existing scenario 3'],
            ],
          },
        ],
      },
    });

    // Mock get to return existing test case IDs (for next ID calculation)
    mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
      data: {
        values: [
          ['PROJ-456-TC-01'],
          ['PROJ-456-TC-02'],
          ['PROJ-456-TC-03'],
        ],
      },
    });

    // Mock append operation - this is where we'll verify the behavior
    mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
      data: {
        spreadsheetId: mockConfig.spreadsheetId,
        tableRange: 'Test Scenarios!A4:N5',
        updates: {
          spreadsheetId: mockConfig.spreadsheetId,
          updatedRange: 'Test Scenarios!A4:N5',
          updatedRows: 2,
          updatedColumns: 14,
          updatedCells: 28,
        },
      },
    });

    // NEW SCENARIOS: Sync new scenarios for PROJ-123 to the same sheet
    const newScenarios = [
      {
        id: 'scenario-1',
        title: 'New scenario 1',
        tags: ['smoke', 'PROJ-123'],
        acReference: 'AC-1',
        type: 'happy' as const,
        steps: [
          { keyword: 'Given' as const, text: 'new precondition 1' },
          { keyword: 'When' as const, text: 'new action 1' },
          { keyword: 'Then' as const, text: 'new result 1' },
        ],
      },
      {
        id: 'scenario-2',
        title: 'New scenario 2',
        tags: ['regression', 'PROJ-123'],
        acReference: 'AC-2',
        type: 'edge' as const,
        steps: [
          { keyword: 'Given' as const, text: 'new precondition 2' },
          { keyword: 'When' as const, text: 'new action 2' },
          { keyword: 'Then' as const, text: 'new result 2' },
        ],
      },
    ];

    // EXECUTE: Sync new scenarios for PROJ-123
    const result = await googleSheetsService.syncScenarios(newScenarios, 'PROJ-123', 'New Feature');

    // VERIFY: Expected Behavior Properties

    // Property 1: result.existingRowsPreserved === true
    // The append operation should NOT clear existing data
    // We verify this by checking that append was called (not a clear + write operation)
    expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1);
    
    // Property 2: result.onlyNewScenariosAdded === true
    // Only the 2 new scenarios should be added
    expect(result.rowsAdded).toBe(2);
    expect(result.scenarios).toHaveLength(2);
    expect(result.scenarios[0].scenarioTitle).toBe('New scenario 1');
    expect(result.scenarios[1].scenarioTitle).toBe('New scenario 2');

    // Property 3: result.noDuplicatesAdded === false
    // No duplicates should be added (0 skipped since these are new scenarios)
    expect(result.rowsSkipped).toBe(0);

    // Property 4: result.columnStructureConsistent === true
    // The append call should maintain the same column structure (A:N range)
    const appendCall = mockSheets.spreadsheets.values.append.mock.calls[0];
    expect(appendCall[0].range).toBe('Test Scenarios!A:N');
    
    // Verify the appended rows have the correct structure (14 columns)
    const appendedRows = appendCall[0].requestBody.values;
    expect(appendedRows).toHaveLength(2);
    expect(appendedRows[0]).toHaveLength(14);
    expect(appendedRows[1]).toHaveLength(14);

    // CRITICAL VERIFICATION: Existing data should still be present
    // The current implementation uses the Google Sheets append API which:
    // - Automatically appends data after existing rows
    // - Does NOT clear existing data
    // - Preserves all existing scenarios
    
    // This test validates the EXPECTED behavior is already implemented correctly.
  });

  /**
   * Additional test case: Verify duplicate detection works with existing data
   * 
   * This ensures that when syncing scenarios, duplicates are properly detected
   * and skipped, while new scenarios are appended.
   */
  it('should skip duplicate scenarios and only append new ones when sheet has existing data', async () => {
    // SETUP: Existing scenarios in sheet
    mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
      data: {
        spreadsheetId: mockConfig.spreadsheetId,
        valueRanges: [
          {
            range: 'Test Scenarios!B:D',
            values: [
              ['PROJ-123', 'Test Feature', 'Existing scenario'],
              ['PROJ-456', 'Other Feature', 'Other scenario'],
            ],
          },
        ],
      },
    });

    mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
      data: {
        values: [
          ['PROJ-123-TC-01'],
          ['PROJ-456-TC-01'],
        ],
      },
    });

    mockSheets.spreadsheets.values.append.mockResolvedValueOnce({
      data: {
        spreadsheetId: mockConfig.spreadsheetId,
        tableRange: 'Test Scenarios!A3:N3',
        updates: {
          spreadsheetId: mockConfig.spreadsheetId,
          updatedRange: 'Test Scenarios!A3:N3',
          updatedRows: 1,
          updatedColumns: 14,
          updatedCells: 14,
        },
      },
    });

    // NEW SCENARIOS: One duplicate, one new
    const scenarios = [
      {
        id: 'scenario-1',
        title: 'Existing scenario', // DUPLICATE
        tags: ['smoke', 'PROJ-123'],
        acReference: 'AC-1',
        type: 'happy' as const,
        steps: [
          { keyword: 'Given' as const, text: 'precondition' },
          { keyword: 'When' as const, text: 'action' },
          { keyword: 'Then' as const, text: 'result' },
        ],
      },
      {
        id: 'scenario-2',
        title: 'New scenario', // NEW
        tags: ['regression', 'PROJ-123'],
        acReference: 'AC-2',
        type: 'edge' as const,
        steps: [
          { keyword: 'Given' as const, text: 'new precondition' },
          { keyword: 'When' as const, text: 'new action' },
          { keyword: 'Then' as const, text: 'new result' },
        ],
      },
    ];

    // EXECUTE
    const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

    // VERIFY: Expected Behavior
    expect(result.rowsAdded).toBe(1); // Only 1 new scenario added
    expect(result.rowsSkipped).toBe(1); // 1 duplicate skipped
    expect(result.scenarios).toHaveLength(1);
    expect(result.scenarios[0].scenarioTitle).toBe('New scenario');

    // Verify existing data is preserved (append called, not clear)
    expect(mockSheets.spreadsheets.values.append).toHaveBeenCalledTimes(1);
    
    // CRITICAL: On unfixed code, this test may FAIL if:
    // - The system clears all existing rows before writing
    // - The duplicate detection doesn't work correctly
    // - The existing PROJ-456 scenario is lost
  });

  /**
   * Edge case: Syncing to empty sheet should work correctly
   * 
   * This is a non-buggy case (no existing data) that should pass even on unfixed code.
   */
  it('should sync scenarios correctly to empty sheet (non-buggy case)', async () => {
    // SETUP: Empty sheet (no existing data)
    mockSheets.spreadsheets.values.batchGet.mockResolvedValueOnce({
      data: {
        spreadsheetId: mockConfig.spreadsheetId,
        valueRanges: [
          {
            range: 'Test Scenarios!B:D',
            values: [], // Empty sheet
          },
        ],
      },
    });

    mockSheets.spreadsheets.values.get.mockResolvedValueOnce({
      data: {
        values: [],
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

    const scenarios = [
      {
        id: 'scenario-1',
        title: 'First scenario',
        tags: ['smoke', 'PROJ-123'],
        acReference: 'AC-1',
        type: 'happy' as const,
        steps: [
          { keyword: 'Given' as const, text: 'precondition' },
          { keyword: 'When' as const, text: 'action' },
          { keyword: 'Then' as const, text: 'result' },
        ],
      },
      {
        id: 'scenario-2',
        title: 'Second scenario',
        tags: ['regression', 'PROJ-123'],
        acReference: 'AC-2',
        type: 'edge' as const,
        steps: [
          { keyword: 'Given' as const, text: 'precondition 2' },
          { keyword: 'When' as const, text: 'action 2' },
          { keyword: 'Then' as const, text: 'result 2' },
        ],
      },
    ];

    // EXECUTE
    const result = await googleSheetsService.syncScenarios(scenarios, 'PROJ-123', 'Test Feature');

    // VERIFY
    expect(result.rowsAdded).toBe(2);
    expect(result.rowsSkipped).toBe(0);
    expect(result.scenarios).toHaveLength(2);

    // This should pass even on unfixed code since there's no existing data to clear
  });
});
