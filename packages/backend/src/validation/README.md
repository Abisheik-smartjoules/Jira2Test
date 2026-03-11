# Validation System

This directory contains comprehensive Zod validation schemas for the Jira2Test backend. The validation system provides type-safe input validation, external API response validation, and runtime type checking throughout the application.

## Overview

The validation system is organized into focused modules:

- **`validation-utils.ts`** - Common validation patterns and middleware helpers
- **`api-schemas.ts`** - API request/response validation schemas
- **`jira-schemas.ts`** - Jira API integration validation schemas
- **`gherkin-schemas.ts`** - Gherkin feature file validation schemas
- **`morpheus-schemas.ts`** - Morpheus MCP integration validation schemas
- **`sheets-schemas.ts`** - Google Sheets API validation schemas
- **`integration-example.ts`** - Practical usage examples

## Key Features

### 🔒 Type Safety
All schemas provide full TypeScript type inference, ensuring compile-time and runtime type safety.

### 🚀 Express Middleware
Ready-to-use middleware for validating request bodies, query parameters, and path parameters.

### 🛡️ External API Validation
Schemas for validating responses from external services (Jira, Morpheus MCP, Google Sheets).

### 📝 Comprehensive Error Messages
Detailed, user-friendly error messages for validation failures.

### 🧪 Extensive Test Coverage
196 unit tests covering edge cases, boundary conditions, and error scenarios.

## Usage Examples

### Basic Request Validation

```typescript
import { validateRequest, generateRequestSchema } from './validation/index.js';

app.post('/api/generate', 
  validateRequest(generateRequestSchema),
  (req, res) => {
    // req.validatedBody is now type-safe
    const { storyId } = req.validatedBody;
    // ... handle request
  }
);
```

### Query Parameter Validation

```typescript
import { validateQuery, storiesQuerySchema } from './validation/index.js';

app.get('/api/stories',
  validateQuery(storiesQuerySchema),
  (req, res) => {
    // req.validatedQuery is type-safe
    const { status, search } = req.validatedQuery;
    // ... handle request
  }
);
```

### External API Response Validation

```typescript
import { safeValidate, jiraSearchResponseSchema } from './validation/index.js';

async function fetchJiraData(query: string) {
  const response = await fetch(`/jira/api/search?jql=${query}`);
  const data = await response.json();
  
  const result = safeValidate(jiraSearchResponseSchema, data);
  if (!result.success) {
    throw new Error(`Invalid Jira response: ${result.error}`);
  }
  
  return result.data; // Type-safe validated data
}
```

### Custom Business Logic Validation

```typescript
import { commonSchemas } from './validation/index.js';

const customSchema = z.object({
  storyId: commonSchemas.storyId,
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  assignee: commonSchemas.email,
});

const result = safeValidate(customSchema, userInput);
```

## Schema Categories

### Common Patterns (`commonSchemas`)

- **`storyId`** - Validates story ID format (e.g., "PROJ-123")
- **`nonEmptyString`** - Non-empty string validation
- **`url`** - HTTP/HTTPS URL validation
- **`email`** - Email address validation
- **`positiveInt`** - Positive integer validation
- **`nonNegativeInt`** - Non-negative integer validation

### API Schemas

- **Request/Response envelopes** - Consistent API response format
- **Generation status tracking** - Multi-step process status
- **Error classification** - Structured error handling

### Domain-Specific Schemas

#### Jira Integration
- Story and issue validation
- Search response validation
- Configuration validation

#### Gherkin Features
- Feature file structure validation
- Scenario and step validation
- Examples table validation
- Round-trip parsing validation

#### Morpheus MCP
- Codebase context validation
- Search request/response validation
- Error handling validation

#### Google Sheets
- Row data validation
- API response validation
- Sync operation validation

## Error Handling

The validation system provides multiple error handling approaches:

### Safe Validation
```typescript
const result = safeValidate(schema, data);
if (result.success) {
  // Use result.data (type-safe)
} else {
  // Handle result.error (formatted message)
}
```

### Express Middleware
```typescript
// Automatically returns 400 with error details for invalid requests
app.post('/api/endpoint', validateRequest(schema), handler);
```

### Custom Error Formatting
```typescript
try {
  const data = schema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formatted = formatValidationError(error);
    // Use formatted error message
  }
}
```

## Testing

The validation system includes comprehensive test coverage:

```bash
# Run validation tests
npm test validation

# Run with coverage
npm run test:coverage -- validation
```

### Test Categories

- **Schema validation** - Valid and invalid input scenarios
- **Edge cases** - Boundary values, empty inputs, special characters
- **Error handling** - Error message formatting and recovery
- **Middleware integration** - Express middleware behavior
- **Type safety** - TypeScript type inference validation

## Best Practices

### 1. Always Validate External Data
```typescript
// ✅ Good - Validate external API responses
const result = safeValidate(externalApiSchema, apiResponse);

// ❌ Bad - Trust external data
const data = apiResponse; // No validation
```

### 2. Use Middleware for Route Validation
```typescript
// ✅ Good - Declarative validation
app.post('/api/generate', validateRequest(generateRequestSchema), handler);

// ❌ Bad - Manual validation in handler
app.post('/api/generate', (req, res) => {
  if (!req.body.storyId) { /* manual validation */ }
});
```

### 3. Leverage Type Inference
```typescript
// ✅ Good - Let TypeScript infer types
type GenerateRequest = z.infer<typeof generateRequestSchema>;

// ❌ Bad - Duplicate type definitions
interface GenerateRequest {
  storyId: string; // Duplicates schema definition
}
```

### 4. Handle Validation Errors Gracefully
```typescript
// ✅ Good - Graceful degradation
const result = safeValidate(morpheusResponseSchema, response);
if (!result.success) {
  console.warn('Invalid Morpheus response, using defaults');
  return getDefaultContext();
}

// ❌ Bad - Fail hard on validation errors
const data = morpheusResponseSchema.parse(response); // Throws on error
```

### 5. Use Appropriate Validation Granularity
```typescript
// ✅ Good - Validate at boundaries
const validatedInput = validateUserInput(rawInput);
const result = processData(validatedInput);

// ❌ Bad - Validate everywhere
function processData(data: unknown) {
  const validated = schema.parse(data); // Redundant validation
  // ...
}
```

## Security Considerations

### Input Sanitization
All user inputs are validated before processing to prevent:
- SQL injection attacks
- XSS vulnerabilities
- Path traversal attacks
- Data corruption

### External API Validation
External service responses are validated to ensure:
- Data integrity
- Type safety
- Error handling
- Security boundaries

### Error Message Safety
Validation errors are formatted to avoid:
- Information leakage
- Sensitive data exposure
- Internal system details

## Performance Considerations

### Schema Compilation
Schemas are compiled once and reused for optimal performance.

### Validation Caching
Common validation patterns are cached to reduce overhead.

### Selective Validation
Use `safeValidate` for non-critical paths to avoid throwing exceptions.

### Batch Validation
For multiple items, use batch validation patterns to minimize overhead.

## Contributing

When adding new validation schemas:

1. **Create focused schemas** - One schema per domain concept
2. **Add comprehensive tests** - Cover valid, invalid, and edge cases
3. **Document usage** - Include examples and best practices
4. **Follow naming conventions** - Use descriptive, consistent names
5. **Consider performance** - Optimize for common use cases

### Schema Naming Convention
- **Schemas**: `entityNameSchema` (e.g., `jiraStorySchema`)
- **Types**: `EntityName` (e.g., `JiraStory`)
- **Validators**: `validateEntityName` (e.g., `validateRequest`)

### Test Structure
```typescript
describe('EntitySchema', () => {
  describe('valid cases', () => {
    // Test valid inputs
  });
  
  describe('invalid cases', () => {
    // Test invalid inputs
  });
  
  describe('edge cases', () => {
    // Test boundary conditions
  });
});
```