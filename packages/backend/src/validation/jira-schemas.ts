/**
 * Jira API validation schemas
 */

import { z } from 'zod';
import { commonSchemas } from './validation-utils.js';

/**
 * Jira story status schema - accepts any string to support all Jira board statuses
 */
export const jiraStoryStatusSchema = z.string();

/**
 * Jira task status schema - accepts any string to support all Jira board statuses
 */
export const jiraTaskStatusSchema = z.string();

/**
 * Jira story schema
 */
export const jiraStorySchema = z.object({
  id: commonSchemas.storyId,
  title: commonSchemas.nonEmptyString,
  status: jiraStoryStatusSchema,
  assignee: commonSchemas.nonEmptyString,
  description: z.string().optional(),
  issueType: z.literal('story'),
});

/**
 * Jira task schema
 */
export const jiraTaskSchema = z.object({
  id: commonSchemas.issueId,
  title: commonSchemas.nonEmptyString,
  status: jiraTaskStatusSchema,
  assignee: commonSchemas.nonEmptyString,
  description: z.string().optional(),
  issueType: z.literal('task'),
});

/**
 * Story details schema (extended story information)
 */
export const storyDetailsSchema = z.object({
  id: commonSchemas.storyId,
  title: commonSchemas.nonEmptyString,
  description: z.string().default(''),
  acceptanceCriteria: z.array(z.string()).default([]),
  status: commonSchemas.nonEmptyString,
  assignee: commonSchemas.nonEmptyString,
  issueType: z.literal('story'),
});

/**
 * Task details schema (extended task information)
 */
export const taskDetailsSchema = z.object({
  id: commonSchemas.issueId,
  title: commonSchemas.nonEmptyString,
  description: z.string().default(''),
  acceptanceCriteria: z.array(z.string()).default([]),
  status: commonSchemas.nonEmptyString,
  assignee: commonSchemas.nonEmptyString,
  issueType: z.literal('task'),
});

/**
 * Story filters schema
 */
export const storyFiltersSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Task filters schema (same as story filters)
 */
export const taskFiltersSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Generic issue filters schema
 */
export const issueFiltersSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
});

/**
 * Discriminated union for Jira issues (stories and tasks)
 */
export const jiraIssueUnionSchema = z.discriminatedUnion('issueType', [
  jiraStorySchema,
  jiraTaskSchema,
]);

/**
 * Discriminated union for issue details (story and task details)
 */
export const issueDetailsUnionSchema = z.discriminatedUnion('issueType', [
  storyDetailsSchema,
  taskDetailsSchema,
]);

/**
 * Jira API response schemas for external validation
 */
export const jiraIssueFieldsSchema = z.object({
  summary: commonSchemas.nonEmptyString,
  description: z.union([
    z.string(),
    z.object({}).passthrough(), // Atlassian Document Format (ADF)
    z.null(),
  ]).optional(),
  status: z.object({
    name: z.string(),
  }),
  assignee: z.object({
    displayName: z.string(),
  }).nullable().optional(),
  customfield_10000: z.string().optional(), // Acceptance criteria field
});

export const jiraIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  fields: jiraIssueFieldsSchema,
});

export const jiraSearchResponseSchema = z.object({
  issues: z.array(jiraIssueSchema),
  total: commonSchemas.nonNegativeInt,
  startAt: commonSchemas.nonNegativeInt,
  maxResults: commonSchemas.nonNegativeInt,
});

export const jiraBoardResponseSchema = z.object({
  values: z.array(z.object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
  })),
});

/**
 * Jira configuration schema
 */
export const jiraConfigSchema = z.object({
  baseUrl: commonSchemas.url,
  username: commonSchemas.email,
  apiToken: commonSchemas.nonEmptyString,
  boardId: commonSchemas.nonEmptyString,
});

/**
 * Type exports
 */
export type JiraStory = z.infer<typeof jiraStorySchema>;
export type JiraTask = z.infer<typeof jiraTaskSchema>;
export type StoryDetails = z.infer<typeof storyDetailsSchema>;
export type TaskDetails = z.infer<typeof taskDetailsSchema>;
export type StoryFilters = z.infer<typeof storyFiltersSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type IssueFilters = z.infer<typeof issueFiltersSchema>;
export type JiraStoryStatus = z.infer<typeof jiraStoryStatusSchema>;
export type JiraTaskStatus = z.infer<typeof jiraTaskStatusSchema>;
export type JiraSearchResponse = z.infer<typeof jiraSearchResponseSchema>;
export type JiraIssue = z.infer<typeof jiraIssueSchema>;
export type JiraIssueUnion = z.infer<typeof jiraIssueUnionSchema>;
export type IssueDetailsUnion = z.infer<typeof issueDetailsUnionSchema>;
export type JiraConfig = z.infer<typeof jiraConfigSchema>;