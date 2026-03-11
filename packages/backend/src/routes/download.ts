/**
 * Download endpoint handler
 */

import { Router, Request, Response } from 'express';
import { downloadParamsSchema } from '../validation/api-schemas.js';
import { getFeatureFile } from '../utils/file-storage.js';
import { createLogger } from '../utils/logger.js';

const router = Router();
const logger = createLogger();

/**
 * Convert feature title to kebab-case filename
 */
function generateFilename(storyId: string, featureContent: string): string {
  // Extract feature title from the first line only
  const lines = featureContent.split('\n');
  const featureLine = lines.find(line => line.trim().startsWith('Feature:'));
  
  if (!featureLine) {
    return `${storyId}_feature.feature`;
  }
  
  // Extract title from the feature line
  const titleMatch = featureLine.match(/^Feature:\s*(.*)$/);
  let featureTitle = titleMatch?.[1]?.trim() || '';
  
  // Handle empty title
  if (!featureTitle) {
    return `${storyId}_feature.feature`;
  }
  
  // Convert to kebab-case
  const kebabTitle = featureTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  return `${storyId}_${kebabTitle || 'feature'}.feature`;
}

/**
 * GET /api/download/:storyId - Download feature file
 */
router.get('/:storyId', async (req: Request, res: Response) => {
  try {
    // Validate story ID parameter
    const paramsResult = downloadParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid story ID format',
        message: 'Story ID must be in format: PROJECT-123'
      });
    }

    const { storyId } = paramsResult.data;
    
    logger.info(`Download requested for story ${storyId}`);

    // Retrieve feature file content
    const featureContent = getFeatureFile(storyId);
    
    // Generate filename
    const filename = generateFilename(storyId, featureContent);
    
    logger.info(`Serving download for ${storyId}`, { filename });

    // Set download headers
    res.setHeader('Content-Type', 'application/octet-stream; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(featureContent, 'utf8'));
    
    // Send file content
    res.send(featureContent);

  } catch (error) {
    logger.error('Download failed:', error);

    // Handle specific error types
    if (error instanceof Error && error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Feature file not found',
        message: `No feature file exists for story ${req.params.storyId}`
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Download failed',
      message: 'An unexpected error occurred during download'
    });
  }
});

export { router as downloadRouter };