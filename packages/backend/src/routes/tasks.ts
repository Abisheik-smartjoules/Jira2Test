/**
 * Tasks endpoint handler
 */

import { Router, Request, Response } from 'express';
import { JiraService } from '../services/jira-service.js';
import { tasksQuerySchema } from '../validation/api-schemas.js';
import { createLogger } from '../utils/logger.js';
import { getEnvironment } from '../config/environment.js';

const router = Router();
const logger = createLogger();

/**
 * GET /api/tasks - Fetch all tasks from Jira board
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const queryResult = tasksQuerySchema.safeParse(req.query);
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
    
    // Fetch tasks from Jira
    let tasks = await jiraService.getTasksFromBoard();
    
    // Apply filters
    if (status && status !== 'All') {
      tasks = tasks.filter(task => task.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.id.toLowerCase().includes(searchLower)
      );
    }

    logger.info(`Fetched ${tasks.length} tasks from Jira`, {
      filters: { status, search },
      totalCount: tasks.length
    });

    res.json({
      success: true,
      data: { tasks }
    });

  } catch (error) {
    logger.error('Failed to fetch tasks:', error);

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
          message: 'Failed to fetch tasks from Jira'
        });
      }
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Unable to connect to Jira',
      message: 'Failed to fetch tasks from Jira'
    });
  }
});

export { router as tasksRouter };
