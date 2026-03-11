# Jira2Test

A full-stack TypeScript web application that generates domain-aware Gherkin feature files from Jira user stories. The system integrates with Jira API, Morpheus MCP for codebase context, and Google Sheets for test scenario tracking.

## Features

- 🎯 **Domain-Aware Generation**: Uses Morpheus MCP to understand your codebase and generate realistic Gherkin scenarios
- 📋 **Jira Integration**: Fetches user stories directly from your Jira board
- 📊 **Google Sheets Sync**: Automatically syncs generated test scenarios to Google Sheets for tracking
- 🧪 **Comprehensive Coverage**: Generates happy path, negative, and edge case scenarios
- 🎨 **Modern UI**: Clean React interface with syntax highlighting and progress tracking
- 🔒 **Security First**: Environment-based configuration with no hardcoded secrets

## Architecture

This is a monorepo containing:

- **Frontend** (`packages/frontend`): React + TypeScript + Vite + Tailwind CSS
- **Backend** (`packages/backend`): Node.js + Express + TypeScript

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Jira account with API access
- Google Cloud project with Sheets API enabled
- OpenAI API key
- Morpheus MCP instance

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Jira2Test
npm install
```

### 2. Environment Setup

Copy the example environment files and configure them:

```bash
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env
```

### 3. Configure Environment Variables

Edit the `.env` files with your actual credentials:

#### Jira Configuration
- `JIRA_BASE_URL`: Your Jira instance URL (e.g., https://company.atlassian.net)
- `JIRA_USERNAME`: Your Jira email address
- `JIRA_API_TOKEN`: Generate from Jira Account Settings > Security > API tokens
- `JIRA_BOARD_ID`: Find in your Jira board URL

#### Google Sheets Configuration
- `GOOGLE_SHEETS_SPREADSHEET_ID`: From the Google Sheets URL
- `GOOGLE_SHEETS_SHEET_NAME`: Name of the sheet tab (default: "Test Scenarios")
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Path to your service account JSON file

#### OpenAI Configuration
- `OPENAI_API_KEY`: Your OpenAI API key

#### Morpheus MCP Configuration
- `MORPHEUS_MCP_URL`: URL of your Morpheus MCP instance
- `MORPHEUS_MCP_TOKEN`: Authentication token (if required)

### 4. Google Sheets Setup

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create a service account and download the JSON key file
4. Share your Google Sheet with the service account email
5. Set up the sheet with these columns:
   - Test Case ID, Jira Story ID, Feature Name, Scenario Title, Tags, AC Reference, Step Definition, Test Type, Status, Automation Status, Created Date, Notes

### 5. Run the Application

```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:frontend  # Frontend on http://localhost:4000
npm run dev:backend   # Backend on http://localhost:4007
```

## Development

### Project Structure

```
Jira2Test/
├── packages/
│   ├── frontend/          # React application
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── services/      # API client services
│   │   │   ├── types/         # TypeScript type definitions
│   │   │   └── utils/         # Utility functions
│   │   └── package.json
│   └── backend/           # Express.js API
│       ├── src/
│       │   ├── controllers/   # Route handlers
│       │   ├── services/      # Business logic
│       │   ├── models/        # Data models
│       │   ├── config/        # Configuration
│       │   └── utils/         # Utility functions
│       └── package.json
├── package.json           # Root package.json (workspaces)
└── README.md
```

### Available Scripts

```bash
# Development
npm run dev                # Start both frontend and backend
npm run dev:frontend       # Start frontend only
npm run dev:backend        # Start backend only

# Building
npm run build              # Build both packages
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only

# Testing
npm run test               # Run all tests
npm run test:frontend      # Run frontend tests
npm run test:backend       # Run backend tests

# Code Quality
npm run lint               # Lint all packages
npm run format             # Format all code with Prettier

# Cleanup
npm run clean              # Clean all build artifacts
```

### Testing

The project uses Vitest for testing with comprehensive coverage requirements:

```bash
# Run tests with coverage
npm run test

# Run tests in watch mode
npm run test:frontend -- --watch
npm run test:backend -- --watch
```

### Code Quality

The project enforces strict code quality standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured for TypeScript with React-specific rules
- **Prettier**: Consistent code formatting
- **Security**: Environment-based configuration, input validation, sanitized logging

## Usage

1. **View Stories**: The application loads and displays all Jira user stories from your configured board
2. **Select Story**: Click "Select" on a story card or manually enter a story ID
3. **Generate**: Click "Generate Gherkin" to start the process
4. **Review**: Review the generated feature file with syntax highlighting
5. **Download**: Download the .feature file for use in your testing framework
6. **Track**: Generated scenarios are automatically synced to your Google Sheet

## API Endpoints

- `GET /api/stories` - Fetch all stories from Jira board
- `POST /api/generate` - Generate Gherkin feature file for a story
- `GET /api/download/:storyId` - Download generated feature file

## Security

- ✅ No hardcoded secrets (environment variables only)
- ✅ Input validation with Zod schemas
- ✅ Sanitized logging (credentials redacted)
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Rate limiting ready
- ✅ Error messages don't leak internal details

## Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new functionality
3. Ensure all tests pass before submitting
4. Use conventional commit messages
5. Update documentation as needed

## License

MIT License - see LICENSE file for details