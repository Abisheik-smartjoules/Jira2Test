import { describe, it, expect } from 'vitest';
import { createLogger } from './logger.js';

describe('Logger', () => {
  it('should create a logger instance', () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });
});