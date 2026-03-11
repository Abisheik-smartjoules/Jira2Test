import { z } from 'zod';

const environmentSchema = z.object({
  // Server configuration
  PORT: z.string().default('4007'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Jira configuration
  JIRA_BASE_URL: z.string().url('Invalid Jira base URL'),
  JIRA_USERNAME: z.string().email('Invalid Jira username email'),
  JIRA_API_TOKEN: z.string().min(1, 'Jira API token is required'),
  JIRA_BOARD_ID: z.string().min(1, 'Jira board ID is required'),

  // Google Sheets configuration
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1, 'Google Sheets spreadsheet ID is required'),
  GOOGLE_SHEETS_SHEET_NAME: z.string().default('Test Scenarios'),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().min(1, 'Google service account key path is required'),

  // AI configuration (optional - will use mock if not provided)
  // Supports OpenAI, Groq, and other OpenAI-compatible APIs
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(), // For Groq or other providers
  OPENAI_MODEL: z.string().optional(), // Model name (e.g., llama-3.3-70b-versatile for Groq)

  // Morpheus MCP configuration
  MORPHEUS_MCP_URL: z.string().url('Invalid Morpheus MCP URL'),
  MORPHEUS_MCP_TOKEN: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(): Environment {
  try {
    return environmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingFields.join('\n')}`);
    }
    throw error;
  }
}

export function getEnvironment(): Environment {
  return validateEnvironment();
}