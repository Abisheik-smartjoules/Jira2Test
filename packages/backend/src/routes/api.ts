/**
 * API routes for Jira2Test
 */

import { Router } from 'express';
import { storiesRouter } from './stories.js';
import { tasksRouter } from './tasks.js';
import { generateRouter } from './generate.js';
import { downloadRouter } from './download.js';

const router = Router();

// Mount route handlers
router.use('/stories', storiesRouter);
router.use('/tasks', tasksRouter);
router.use('/generate', generateRouter);
router.use('/download', downloadRouter);

export { router as apiRouter };