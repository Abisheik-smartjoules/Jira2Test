/**
 * Stories endpoint handler
 */

import { Router, Request, Response } from 'express';
import { JiraService } from '../services/jira-service.js';
import { storiesQuerySchema } from '../validation/api-schemas.js';
import { createLogger } from '../utils/logger.js';
import { getEnvironment } from '../config/environment.js';

const router = Router();
const logger = createLogger();

/**
 * GET /api/stories - Fetch all stories from Jira board
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const queryResult = storiesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        message: queryResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      });
    }

    const { status, search } = queryResult.data;
    
    // Get environment configuration
    const env = getEnvironment();
    
    // Initialize Jira service with proper configuration
    const jiraService = new JiraService({
      baseUrl: env.JIRA_BASE_URL,
      username: env.JIRA_USERNAME,
      apiToken: env.JIRA_API_TOKEN,
      boardId: env.JIRA_BOARD_ID
    });
    
    // Fetch stories from Jira
    let stories = await jiraService.getStoriesFromBoard();
    
    // Apply filters
    if (status && status !== 'All') {
      stories = stories.filter(story => story.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      stories = stories.filter(story => 
        story.title.toLowerCase().includes(searchLower) ||
        story.id.toLowerCase().includes(searchLower)
      );
    }

    logger.info(`Fetched ${stories.length} stories from Jira`, {
      filters: { status, search },
      totalCount: stories.length
    });

    res.json({
      success: true,
      data: { stories }
    });

  } catch (error) {
    logger.error('Failed to fetch stories:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Please check your Jira credentials'
        });
      }
      
      if (error.message.includes('network') || error.message.includes('connection')) {
        return res.status(500).json({
          success: false,
          error: 'Unable to connect to Jira',
          message: 'Failed to fetch stories from Jira'
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Unable to connect to Jira',
      message: 'Failed to fetch stories from Jira'
    });
  }
});

/**
 * GET /api/stories/statuses - Fetch all possible statuses from Jira board configuration
 */
router.get('/statuses', async (req: Request, res: Response) => {
  try {
    // Get environment configuration
    const env = getEnvironment();
    
    // Initialize Jira service with proper configuration
    const jiraService = new JiraService({
      baseUrl: env.JIRA_BASE_URL,
      username: env.JIRA_USERNAME,
      apiToken: env.JIRA_API_TOKEN,
      boardId: env.JIRA_BOARD_ID
    });
    
    // Fetch board statuses
    const statuses = await jiraService.getBoardStatuses();

    logger.info(`Fetched ${statuses.length} statuses from Jira board configuration`, {
      statuses
    });

    res.json({
      success: true,
      data: { statuses }
    });

  } catch (error) {
    logger.error('Failed to fetch board statuses:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Please check your Jira credentials'
        });
      }
      
      if (error.message.includes('network') || error.message.includes('connection')) {
        return res.status(500).json({
          success: false,
          error: 'Unable to connect to Jira',
          message: 'Failed to fetch board statuses from Jira'
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Unable to connect to Jira',
      message: 'Failed to fetch board statuses from Jira'
    });
  }
});

export { router as storiesRouter };