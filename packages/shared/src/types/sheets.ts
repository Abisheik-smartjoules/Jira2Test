/**
 * Google Sheets integration models for test scenario synchronization
 */

export interface SyncResults {
  rowsAdded: number;
  rowsSkipped: number;
  scenarios: ScenarioSummary[];
}

export interface ScenarioSummary {
  testCaseId: string;
  scenarioTitle: string;
  tags: string;
  acReference: string;
  status: string;
}

export interface SheetRow {
  testCaseId: string;        // PROJ-123-TC-01
  jiraStoryId: string;       // PROJ-123
  featureName: string;       // User Authentication
  scenarioTitle: string;     // Valid user can log in
  tags: string;              // @smoke @PROJ-123
  acReference: string;       // AC-1
  givenSteps: string;        // Given user has valid credentials
  whenSteps: string;         // When user submits login form
  thenSteps: string;         // Then user is redirected to dashboard
  testType: string;          // smoke | negative | regression
  status: string;            // Not Executed (default)
  automationStatus: string;  // Pending - Phase 2 (default)
  createdDate: string;       // 2024-01-15
  notes: string;             // Optional notes field
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  serviceAccountKey: string;
}