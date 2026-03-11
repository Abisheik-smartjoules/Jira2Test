/**
 * Application configuration models
 */

import { JiraConfig } from './jira.js';
import { MorpheusConfig } from './morpheus.js';
import { GoogleSheetsConfig } from './sheets.js';

export interface AppConfig {
  jira: JiraConfig;
  morpheus: MorpheusConfig;
  googleSheets: GoogleSheetsConfig;
  openai: OpenAIConfig;
  server: ServerConfig;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  logLevel: LogLevel;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';