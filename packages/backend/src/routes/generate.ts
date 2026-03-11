/**
 * Generate endpoint handler
 */

import { Router, Request, Response } from 'express';
import { JiraService } from '../services/jira-service.js';
import { MorpheusService } from '../services/morpheus-service.js';
import { GherkinGeneratorService } from '../services/gherkin-generator.js';
import { GoogleSheetsService } from '../services/google-sheets-service.js';
import { generateRequestSchema } from '../validation/api-schemas.js';
import { storeFeatureFile } from '../utils/file-storage.js';
import { createLogger } from '../utils/logger.js';
import { getEnvironment } from '../config/environment.js';

const router = Router();
const logger = createLogger();

/**
 * POST /api/generate - Generate Gherkin feature file
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const bodyResult = generateRequestSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: bodyResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }

    const { issueId, issueType } = bodyResult.data;
    
    logger.info(`Starting generation for ${issueType} ${issueId}`);

    // Get environment configuration
    const env = getEnvironment();

    // Initialize services with proper configuration
    const jiraService = new JiraService({
      baseUrl: env.JIRA_BASE_URL,
      username: env.JIRA_USERNAME,
      apiToken: env.JIRA_API_TOKEN,
      boardId: env.JIRA_BOARD_ID
    });

    const morpheusService = new MorpheusService({
      baseUrl: env.MORPHEUS_MCP_URL,
      apiKey: env.MORPHEUS_MCP_TOKEN,
      timeout: 30000
    });

    const gherkinService = new GherkinGeneratorService({
      apiKey: env.OPENAI_API_KEY || 'mock-api-key',
      baseURL: env.OPENAI_BASE_URL,
      model: env.OPENAI_MODEL,
    });

    // Step 1: Fetch issue details from Jira
    logger.info(`Fetching ${issueType} details for ${issueId}`);
    const issueDetails = issueType === 'story' 
      ? await jiraService.getStoryDetails(issueId)
      : await jiraService.getTaskDetails(issueId);

    // Step 2: Get codebase context from Morpheus
    logger.info(`Getting codebase context for ${issueId}`);
    const context = await morpheusService.getCodebaseContext(issueDetails);

    // Step 3: Generate Gherkin feature file
    logger.info(`Generating Gherkin scenarios for ${issueId}`);
    const featureFile = await gherkinService.generateFeatureFile(issueDetails, context);

    // Step 4: Sync scenarios to Google Sheets (optional)
    let syncResults = { rowsAdded: 0, rowsSkipped: 0, scenarios: [] };
    try {
      const sheetsService = new GoogleSheetsService({
        spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
        sheetName: env.GOOGLE_SHEETS_SHEET_NAME,
        serviceAccountKey: env.GOOGLE_SERVICE_ACCOUNT_KEY
      });
      logger.info(`Syncing scenarios to Google Sheets for ${issueId}`);
      syncResults = await sheetsService.syncScenarios(featureFile.scenarios, issueId, issueDetails.title);
    } catch (sheetsError) {
      logger.warn(`Google Sheets sync skipped: ${sheetsError instanceof Error ? sheetsError.message : 'Unknown error'}`);
    }

    // Step 5: Store feature file for download
    storeFeatureFile(issueId, featureFile);

    logger.info(`Generation completed successfully for ${issueId}`, {
      scenarioCount: featureFile.scenarios.length,
      rowsAdded: syncResults.rowsAdded,
      rowsSkipped: syncResults.rowsSkipped
    });

    res.json({
      success: true,
      data: {
        featureFile,
        syncResults
      }
    });

  } catch (error) {
    logger.error('Generation failed:', error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      logger.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'NotFoundError') {
        return res.status(404).json({
          success: false,
          error: `${req.body.issueType === 'story' ? 'Story' : 'Task'} not found`,
          message: `${req.body.issueType === 'story' ? 'Story' : 'Task'} ${req.body.issueId} does not exist in Jira`
        });
      }

      if (error.name === 'AuthenticationError') {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Please check your API credentials'
        });
      }

      // Service-specific error handling
      if (error.message.includes('Jira') || error.message.includes('jira') || 
          error.message.includes('connection') || error.message.includes('timeout')) {
        return res.status(500).json({
          success: false,
          error: 'Unable to connect to Jira',
          message: 'Failed to fetch story details from Jira'
        });
      }

      if (error.message.includes('Morpheus') || error.message.includes('morpheus')) {
        return res.status(500).json({
          success: false,
          error: 'Unable to access codebase context',
          message: 'Failed to get context from Morpheus MCP'
        });
      }

      if (error.message.includes('Sheets') || error.message.includes('sheets')) {
        return res.status(500).json({
          success: false,
          error: 'Unable to sync to Google Sheets',
          message: 'Failed to synchronize scenarios to Google Sheets'
        });
      }
    }

    // Generic error response with more details in development
    res.status(500).json({
      success: false,
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred during generation'
    });
  }
});

export { router as generateRouter };