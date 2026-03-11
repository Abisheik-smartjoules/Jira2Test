import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export function createLogger(): winston.Logger {
  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // Sanitize sensitive information from logs
        const sanitizedMeta = sanitizeLogData(meta);
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...sanitizedMeta,
        });
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }));
    logger.add(new winston.transports.File({
      filename: 'logs/combined.log',
    }));
  }

  return logger;
}

function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'apikey', 'api_key', 'secret', 'auth',
    'authorization', 'credential', 'key', 'private'
  ];

  const sanitized = { ...data };

  for (const [key, value] of Object.entries(sanitized)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    }
  }

  return sanitized;
}