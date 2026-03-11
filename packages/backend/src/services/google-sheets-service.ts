/**
 * Google Sheets service for test scenario synchronization
 */

import { google } from 'googleapis';
import type { SyncResults } from '@jira2test/shared';
import type { 
  GoogleSheetsConfig
} from '../validation/sheets-schemas.js';
import { 
  googleSheetsConfigSchema,
  sheetsAppendResponseSchema, 
  sheetsBatchGetResponseSchema 
} from '../validation/sheets-schemas.js';

export class GoogleSheetsService {
  private sheets: any;
  private config: GoogleSheetsConfig;
  private authPromise: Promise<void>;

  constructor(config: GoogleSheetsConfig) {
    this.config = googleSheetsConfigSchema.parse(config);
    this.authPromise = this.initializeAuth();
  }

  /**
   * Create GoogleSheetsService from environment variables
   */
  static fromEnvironment(env: {
    GOOGLE_SHEETS_SPREADSHEET_ID: string;
    GOOGLE_SHEETS_SHEET_NAME?: string;
    GOOGLE_SERVICE_ACCOUNT_KEY: string;
  }): GoogleSheetsService {
    return new GoogleSheetsService({
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      sheetName: env.GOOGLE_SHEETS_SHEET_NAME || 'Test Scenarios',
      serviceAccountKey: env.GOOGLE_SERVICE_ACCOUNT_KEY,
    });
  }

  /**
   * Initialize Google Sheets authentication
   */
  private async initializeAuth(): Promise<void> {
    try {
      let serviceAccountKey;
      
      // Handle both file path and direct JSON string
      if (this.config.serviceAccountKey.startsWith('{')) {
        // Direct JSON string
        serviceAccountKey = JSON.parse(this.config.serviceAccountKey);
      } else {
        // File path - read from file system
        const fs = await import('fs/promises');
        const keyContent = await fs.readFile(this.config.serviceAccountKey, 'utf8');
        serviceAccountKey = JSON.parse(keyContent);
      }
      
      // Validate required fields in service account key
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!serviceAccountKey[field]) {
          throw new Error(`Missing required field '${field}' in service account key`);
        }
      }
      
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth: auth });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format in service account key');
      }
      throw error;
    }
  }

  /**
   * Sync scenarios to Google Sheets with duplicate detection
   */
  async syncScenarios(
    scenarios: Array<{
      id: string;
      title: string;
      tags: string[];
      acReference: string;
      type: 'happy' | 'negative' | 'edge';
      steps: Array<{
        keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
        text: string;
      }>;
    }>,
    storyId: string,
    featureName: string
  ): Promise<SyncResults> {
    // Handle empty scenarios array
    if (!scenarios || scenarios.length === 0) {
      return {
        rowsAdded: 0,
        rowsSkipped: 0,
        scenarios: [],
      };
    }

    // Validate inputs
    if (!storyId?.trim()) {
      throw new Error('Story ID is required and cannot be empty');
    }
    if (!featureName?.trim()) {
      throw new Error('Feature name is required and cannot be empty');
    }

    try {
      // Ensure authentication is complete
      await this.authPromise;

      // Ensure header row exists
      await this.ensureHeaderRow();

      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(scenarios, storyId, featureName);
      
      if (duplicateCheck.newScenarios.length === 0) {
        return {
          rowsAdded: 0,
          rowsSkipped: scenarios.length,
          scenarios: [],
        };
      }

      // Get next test case ID
      const nextTestCaseNumber = await this.getNextTestCaseNumber(storyId);
      
      // Prepare rows for new scenarios only
      const newScenarios = scenarios.filter(s => duplicateCheck.newScenarios.includes(s.title));
      const rows = newScenarios.map((scenario, index) => {
        const testCaseId = this.generateTestCaseId(storyId, nextTestCaseNumber + index);
        return this.createSheetRow(scenario, storyId, featureName, testCaseId);
      });

      // Append to sheet
      const appendResponse = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: `'${this.config.sheetName}'!A:L`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });

      // Validate response
      const validatedResponse = sheetsAppendResponseSchema.parse(appendResponse.data);

      // Create scenario summaries
      const scenarioSummaries = newScenarios.map((scenario, index) => ({
        testCaseId: this.generateTestCaseId(storyId, nextTestCaseNumber + index),
        scenarioTitle: scenario.title,
        tags: scenario.tags.join(' '),
        acReference: scenario.acReference,
        status: 'Not Executed',
      }));

      return {
        rowsAdded: validatedResponse.updates.updatedRows,
        rowsSkipped: scenarios.length - newScenarios.length,
        scenarios: scenarioSummaries,
      };
    } catch (error) {
      if (this.isAuthenticationError(error)) {
        throw new Error('Google Sheets authentication failed. Please check service account credentials.');
      }
      if (this.isQuotaExceededError(error)) {
        throw new Error('Google Sheets API quota exceeded. Please try again later.');
      }
      if (this.isNetworkError(error)) {
        throw new Error('Network error connecting to Google Sheets. Please check your connection and try again.');
      }
      throw new Error(`Failed to sync scenarios to Google Sheets: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Ensure header row exists in the sheet
   */
  private async ensureHeaderRow(): Promise<void> {
    try {
      // Check if sheet has any data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `'${this.config.sheetName}'!A1:L1`,
      });

      const firstRow = response.data.values?.[0];
      
      // If first row is empty or doesn't have proper headers, add them
      if (!firstRow || firstRow.length === 0 || !this.hasValidHeaders(firstRow)) {
        const headers = [
          'Test Case ID',
          'Jira Story ID',
          'Feature Name',
          'Scenario Title',
          'Tags',
          'AC Reference',
          'Step Definition',
          'Test Type',
          'Status',
          'Automation Status',
          'Created Date',
          'Notes',
        ];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `'${this.config.sheetName}'!A1:L1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });
      }
    } catch (error) {
      // If sheet doesn't exist or other error, let it propagate
      throw new Error(`Failed to ensure header row: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Check if the first row has valid headers
   */
  private hasValidHeaders(row: string[]): boolean {
    const expectedHeaders = [
      'Test Case ID',
      'Jira Story ID',
      'Feature Name',
      'Scenario Title',
      'Tags',
      'AC Reference',
      'Step Definition',
      'Test Type',
      'Status',
      'Automation Status',
      'Created Date',
      'Notes',
    ];

    // Check if at least the first few critical headers match
    const criticalHeaders = expectedHeaders.slice(0, 7); // First 7 columns are critical
    
    for (let i = 0; i < criticalHeaders.length; i++) {
      if (!row[i] || row[i].trim() !== criticalHeaders[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check for duplicate scenarios in the sheet
   */
  private async checkForDuplicates(
    scenarios: Array<{ title: string }>,
    storyId: string,
    featureName: string
  ): Promise<{ duplicates: Array<{ scenarioTitle: string; existingTestCaseId: string }>; newScenarios: string[] }> {
    // Ensure authentication is complete
    await this.authPromise;

    const response = await this.sheets.spreadsheets.values.batchGet({
      spreadsheetId: this.config.spreadsheetId,
      ranges: [`'${this.config.sheetName}'!B:D`], // jiraStoryId, featureName, scenarioTitle columns
    });

    const validatedResponse = sheetsBatchGetResponseSchema.parse(response.data);
    const allRows = validatedResponse.valueRanges[0]?.values || [];
    
    // Skip header row (first row)
    const existingRows = allRows.slice(1);

    const duplicates: Array<{ scenarioTitle: string; existingTestCaseId: string }> = [];
    const newScenarios: string[] = [];

    for (const scenario of scenarios) {
      const isDuplicate = existingRows.some(row => 
        row[0] === storyId && 
        row[1] === featureName && 
        row[2] === scenario.title
      );

      if (isDuplicate) {
        duplicates.push({
          scenarioTitle: scenario.title,
          existingTestCaseId: 'EXISTING-ID', // Would need to fetch actual ID
        });
      } else {
        newScenarios.push(scenario.title);
      }
    }

    return { duplicates, newScenarios };
  }

  /**
   * Get the next available test case number for a story
   */
  private async getNextTestCaseNumber(storyId: string): Promise<number> {
    try {
      // Ensure authentication is complete
      await this.authPromise;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `'${this.config.sheetName}'!A:A`, // testCaseId column
      });

      const allIds = response.data.values || [];
      // Skip header row (first row)
      const existingIds = allIds.slice(1);
      
      const storyTestCases = existingIds
        .flat()
        .filter((id: string) => id && id.startsWith(`${storyId}-TC-`))
        .map((id: string) => {
          const match = id.match(/-TC-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((num: number) => num > 0);

      return storyTestCases.length > 0 ? Math.max(...storyTestCases) + 1 : 1;
    } catch (error) {
      // If we can't read existing IDs, start from 1
      return 1;
    }
  }

  /**
   * Create a sheet row from scenario data
   */
  private createSheetRow(
    scenario: {
      title: string;
      tags: string[];
      acReference: string;
      type: 'happy' | 'negative' | 'edge';
      steps: Array<{
        keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
        text: string;
      }>;
    },
    storyId: string,
    featureName: string,
    testCaseId: string
  ): string[] {
    // Combine all steps into a single column
    const allSteps = scenario.steps
      .map(step => `${step.keyword} ${step.text}`)
      .join('\n');
    
    const testType = this.mapScenarioTypeToTestType(scenario.type);
    const tags = scenario.tags.join(' ');
    const createdDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    return [
      testCaseId,
      storyId,
      featureName,
      scenario.title,
      tags,
      scenario.acReference,
      allSteps, // Single column for all steps
      testType,
      'Not Executed',
      'Pending - Phase 2',
      createdDate,
      '', // notes
    ];
  }

  /**
   * Generate test case ID in format PROJ-123-TC-01
   */
  generateTestCaseId(storyId: string, number: number): string {
    return `${storyId}-TC-${number.toString().padStart(2, '0')}`;
  }

  /**
   * Format steps for sheet display
   */
  formatStepsForSheet(
    steps: Array<{
      keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
      text: string;
    }>,
    startKeyword: 'Given' | 'When' | 'Then'
  ): string {
    const relevantSteps = [];
    let collecting = false;

    for (const step of steps) {
      if (step.keyword === startKeyword) {
        collecting = true;
      } else if (['Given', 'When', 'Then'].includes(step.keyword) && step.keyword !== startKeyword) {
        collecting = false;
      }

      if (collecting) {
        relevantSteps.push(`${step.keyword} ${step.text}`);
      }
    }

    return relevantSteps.join('\n');
  }

  /**
   * Map scenario type to test type
   */
  private mapScenarioTypeToTestType(type: 'happy' | 'negative' | 'edge'): string {
    const typeMap = {
      happy: 'smoke',
      negative: 'negative',
      edge: 'regression',
    };
    return typeMap[type];
  }

  /**
   * Check if error is a network error (timeout, connection issues)
   */
  private isNetworkError(error: any): boolean {
    return error.code === 'ETIMEDOUT' || 
           error.code === 'ECONNRESET' || 
           error.code === 'ENOTFOUND' ||
           error.name === 'ETIMEDOUT';
  }

  /**
   * Check if error is an authentication error (401)
   */
  private isAuthenticationError(error: any): boolean {
    return error.response?.status === 401;
  }

  /**
   * Check if error is a quota exceeded error (429)
   */
  private isQuotaExceededError(error: any): boolean {
    return error.response?.status === 429;
  }

  /**
   * Extract error message from various error types
   */
  private getErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null) {
      if (error.message) {
        return error.message;
      }
      if (error.code) {
        return error.code;
      }
    }
    return String(error);
  }
}