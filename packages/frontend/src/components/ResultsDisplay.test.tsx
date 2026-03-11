import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultsDisplay } from './ResultsDisplay';
import type { FeatureFile, SyncResults } from '../types';

// Mock Prism.js
vi.mock('../lib/prism', () => ({
  highlightGherkin: vi.fn((code: string) => `<span class="highlighted">${code}</span>`)
}));

describe('ResultsDisplay', () => {
  const mockFeatureFile: FeatureFile = {
    feature: {
      title: 'User Authentication',
      description: ['As a user', 'I want to authenticate', 'So that I can access the system'],
      tags: ['@authentication']
    },
    scenarios: [
      {
        id: 'scenario-1',
        title: 'Valid user can log in',
        tags: ['@smoke', '@PROJ-123'],
        acReference: 'AC-1',
        type: 'happy',
        steps: [
          { keyword: 'Given', text: 'user has valid credentials' },
          { keyword: 'When', text: 'user submits login form' },
          { keyword: 'Then', text: 'user is redirected to dashboard' }
        ]
      },
      {
        id: 'scenario-2',
        title: 'Invalid user cannot log in',
        tags: ['@negative', '@PROJ-123'],
        acReference: 'AC-2',
        type: 'negative',
        steps: [
          { keyword: 'Given', text: 'user has invalid credentials' },
          { keyword: 'When', text: 'user submits login form' },
          { keyword: 'Then', text: 'user sees error message' }
        ]
      }
    ],
    metadata: {
      storyId: 'PROJ-123',
      generatedAt: new Date('2024-01-15T10:00:00Z'),
      version: '1.0'
    }
  };

  const mockSyncResults: SyncResults = {
    rowsAdded: 2,
    rowsSkipped: 0,
    scenarios: [
      {
        testCaseId: 'PROJ-123-TC-01',
        scenarioTitle: 'Valid user can log in',
        tags: '@smoke @PROJ-123',
        acReference: 'AC-1',
        status: 'Not Executed'
      },
      {
        testCaseId: 'PROJ-123-TC-02',
        scenarioTitle: 'Invalid user cannot log in',
        tags: '@negative @PROJ-123',
        acReference: 'AC-2',
        status: 'Not Executed'
      }
    ]
  };

  const mockOnDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Success Message and Download', () => {
    it('should display success message with scenario count', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      expect(screen.getByText('Feature file generated successfully with 2 scenarios')).toBeInTheDocument();
    });

    it('should render download button and call onDownload when clicked', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      expect(downloadButton).toBeInTheDocument();

      fireEvent.click(downloadButton);
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should render download button for task-generated feature files', () => {
      const taskFeatureFile: FeatureFile = {
        ...mockFeatureFile,
        metadata: {
          storyId: 'TASK-456',
          generatedAt: new Date('2024-01-15T10:00:00Z'),
          version: '1.0'
        }
      };

      render(
        <ResultsDisplay
          featureFile={taskFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      expect(downloadButton).toBeInTheDocument();

      fireEvent.click(downloadButton);
      expect(mockOnDownload).toHaveBeenCalledTimes(1);
    });

    it('should display download button after task generation', () => {
      const taskFeatureFile: FeatureFile = {
        feature: {
          title: 'Implement User Dashboard',
          description: ['As a developer', 'I want to implement the dashboard', 'So users can view their data'],
          tags: ['@task', '@dashboard']
        },
        scenarios: [
          {
            id: 'scenario-1',
            title: 'Dashboard displays user data',
            tags: ['@happy', '@TASK-789'],
            acReference: 'AC-1',
            type: 'happy',
            steps: [
              { keyword: 'Given', text: 'user is logged in' },
              { keyword: 'When', text: 'user navigates to dashboard' },
              { keyword: 'Then', text: 'user sees their data' }
            ]
          }
        ],
        metadata: {
          storyId: 'TASK-789',
          generatedAt: new Date('2024-01-15T10:00:00Z'),
          version: '1.0'
        }
      };

      const taskSyncResults: SyncResults = {
        rowsAdded: 1,
        rowsSkipped: 0,
        scenarios: [
          {
            testCaseId: 'TASK-789-TC-01',
            scenarioTitle: 'Dashboard displays user data',
            tags: '@happy @TASK-789',
            acReference: 'AC-1',
            status: 'Not Executed'
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={taskFeatureFile}
          syncResults={taskSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /download \.feature file/i })).toBeInTheDocument();
    });
  });

  describe('Google Sheets Sync Results', () => {
    it('should display sync success message with row counts', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Successfully synced to Google Sheets')).toBeInTheDocument();
      expect(screen.getByText('Added 2 new test scenarios')).toBeInTheDocument();
    });

    it('should display skipped rows when present', () => {
      const syncResultsWithSkipped: SyncResults = {
        ...mockSyncResults,
        rowsSkipped: 1
      };

      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={syncResultsWithSkipped}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Added 2 new test scenarios (1 duplicates skipped)')).toBeInTheDocument();
    });

    it('should not display skipped message when no rows skipped', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.queryByText(/duplicates skipped/)).not.toBeInTheDocument();
    });
  });

  describe('Scenario Summary Table', () => {
    it('should render table headers correctly', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Test Case ID')).toBeInTheDocument();
      expect(screen.getByText('Scenario Title')).toBeInTheDocument();
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('AC Reference')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should display scenario data in table rows', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Check first scenario
      expect(screen.getByText('PROJ-123-TC-01')).toBeInTheDocument();
      expect(screen.getByText('Valid user can log in')).toBeInTheDocument();
      expect(screen.getByText('AC-1')).toBeInTheDocument();

      // Check second scenario
      expect(screen.getByText('PROJ-123-TC-02')).toBeInTheDocument();
      expect(screen.getByText('Invalid user cannot log in')).toBeInTheDocument();
      expect(screen.getByText('AC-2')).toBeInTheDocument();
    });

    it('should display tags with proper styling', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Check that tags are displayed
      expect(screen.getByText('@smoke')).toBeInTheDocument();
      expect(screen.getByText('@negative')).toBeInTheDocument();
      expect(screen.getAllByText('@PROJ-123')).toHaveLength(2);
    });

    it('should display test type badges with correct styling', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      const statusBadges = screen.getAllByText('Not Executed');
      expect(statusBadges).toHaveLength(2);
      
      // Check styling classes
      statusBadges.forEach(badge => {
        expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });
  });

  describe('Feature File Content Display', () => {
    it('should display feature file content with syntax highlighting', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generated Feature File')).toBeInTheDocument();
      
      // Check that the highlighted content is rendered
      const codeElement = document.querySelector('code.language-gherkin');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('language-gherkin');
    });

    it('should format feature file content correctly', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // The formatted content should include the feature title
      expect(screen.getByText(/Feature: User Authentication/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scenarios array', () => {
      const emptyFeatureFile: FeatureFile = {
        ...mockFeatureFile,
        scenarios: []
      };

      const emptySyncResults: SyncResults = {
        rowsAdded: 0,
        rowsSkipped: 0,
        scenarios: []
      };

      render(
        <ResultsDisplay
          featureFile={emptyFeatureFile}
          syncResults={emptySyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Feature file generated successfully with 0 scenarios')).toBeInTheDocument();
      expect(screen.getByText('Added 0 new test scenarios')).toBeInTheDocument();
    });

    it('should handle scenarios with examples tables', () => {
      const featureWithExamples: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            ...mockFeatureFile.scenarios[0],
            examples: {
              headers: ['username', 'password'],
              rows: [
                ['user1', 'pass1'],
                ['user2', 'pass2']
              ]
            }
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithExamples}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle scenarios with assumptions', () => {
      const featureWithAssumptions: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            ...mockFeatureFile.scenarios[0],
            assumptions: ['User database is available', 'Network connection is stable']
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithAssumptions}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Should still render without errors
      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle regression test type styling', () => {
      const syncResultsWithRegression: SyncResults = {
        ...mockSyncResults,
        scenarios: [
          {
            ...mockSyncResults.scenarios[0],
            status: 'Not Executed'
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={syncResultsWithRegression}
          onDownload={mockOnDownload}
        />
      );

      const statusBadge = screen.getByText('Not Executed');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('should handle empty feature description', () => {
      const featureWithEmptyDescription: FeatureFile = {
        ...mockFeatureFile,
        feature: {
          ...mockFeatureFile.feature,
          description: []
        }
      };

      render(
        <ResultsDisplay
          featureFile={featureWithEmptyDescription}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle scenarios without AC reference', () => {
      const featureWithoutAC: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            ...mockFeatureFile.scenarios[0],
            acReference: ''
          }
        ]
      };

      const syncResultsWithoutAC: SyncResults = {
        ...mockSyncResults,
        scenarios: [
          {
            ...mockSyncResults.scenarios[0],
            acReference: ''
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithoutAC}
          syncResults={syncResultsWithoutAC}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle tags without @ symbol', () => {
      const syncResultsWithInvalidTags: SyncResults = {
        rowsAdded: 1,
        rowsSkipped: 0,
        scenarios: [
          {
            testCaseId: 'PROJ-123-TC-03',
            scenarioTitle: 'Test scenario with invalid tags',
            tags: 'invalid-tag @valid-tag',
            acReference: 'AC-3',
            status: 'Not Executed'
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={syncResultsWithInvalidTags}
          onDownload={mockOnDownload}
        />
      );

      // Should display the valid tag
      expect(screen.getByText('@valid-tag')).toBeInTheDocument();
      
      // Should not display invalid tags as tag badges
      expect(screen.queryByText('invalid-tag')).not.toBeInTheDocument();
    });

    it('should handle empty tags string', () => {
      const syncResultsWithEmptyTags: SyncResults = {
        ...mockSyncResults,
        scenarios: [
          {
            ...mockSyncResults.scenarios[0],
            tags: ''
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={syncResultsWithEmptyTags}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle large number of scenarios', () => {
      const manyScenarios = Array.from({ length: 50 }, (_, i) => ({
        id: `scenario-${i}`,
        title: `Test scenario ${i}`,
        tags: [`@test${i}`, '@PROJ-123'],
        acReference: `AC-${i}`,
        type: 'happy' as const,
        steps: [
          { keyword: 'Given' as const, text: `given step ${i}` },
          { keyword: 'When' as const, text: `when step ${i}` },
          { keyword: 'Then' as const, text: `then step ${i}` }
        ]
      }));

      const featureWithManyScenarios: FeatureFile = {
        ...mockFeatureFile,
        scenarios: manyScenarios
      };

      const syncResultsWithMany: SyncResults = {
        rowsAdded: 50,
        rowsSkipped: 0,
        scenarios: manyScenarios.map((scenario, i) => ({
          testCaseId: `PROJ-123-TC-${String(i + 1).padStart(2, '0')}`,
          scenarioTitle: scenario.title,
          tags: scenario.tags.join(' '),
          acReference: scenario.acReference,
          status: 'Not Executed'
        }))
      };

      render(
        <ResultsDisplay
          featureFile={featureWithManyScenarios}
          syncResults={syncResultsWithMany}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Feature file generated successfully with 50 scenarios')).toBeInTheDocument();
      expect(screen.getByText('Added 50 new test scenarios')).toBeInTheDocument();
    });

    it('should handle complex examples tables', () => {
      const featureWithComplexExamples: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            ...mockFeatureFile.scenarios[0],
            examples: {
              headers: ['username', 'password', 'expected_result', 'error_message'],
              rows: [
                ['valid_user', 'valid_pass', 'success', ''],
                ['invalid_user', 'valid_pass', 'failure', 'User not found'],
                ['valid_user', 'invalid_pass', 'failure', 'Invalid password'],
                ['', '', 'failure', 'Username required']
              ]
            }
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithComplexExamples}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle multiple assumptions', () => {
      const featureWithMultipleAssumptions: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            ...mockFeatureFile.scenarios[0],
            assumptions: [
              'Database is available and populated with test data',
              'External API services are running',
              'User has appropriate permissions',
              'Network connectivity is stable'
            ]
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithMultipleAssumptions}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Check download button has accessible name
      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      expect(downloadButton).toBeInTheDocument();

      // Check table has proper structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Check table headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5);
    });

    it('should support keyboard navigation', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      const downloadButton = screen.getByRole('button', { name: /download \.feature file/i });
      
      // Button should be focusable
      downloadButton.focus();
      expect(downloadButton).toHaveFocus();

      // Should trigger download on Enter key
      fireEvent.keyDown(downloadButton, { key: 'Enter', code: 'Enter' });
      // Note: We can't easily test this without more complex setup
    });

    it('should have proper heading hierarchy', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 3, name: 'Generation Complete!' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Google Sheets Synchronization' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Scenario Summary' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Generated Feature File' })).toBeInTheDocument();
    });

    it('should provide meaningful text alternatives', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Icons should have meaningful context through surrounding text
      const successIcon = document.querySelector('.text-green-500');
      expect(successIcon).toBeInTheDocument();
    });
  });

  describe('Prism.js Integration', () => {
    it('should render highlighted content from prism', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Check that the mocked highlighted content is rendered
      const highlightedElement = document.querySelector('.highlighted');
      expect(highlightedElement).toBeInTheDocument();
    });

    it('should render code with proper CSS classes', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      const codeElement = document.querySelector('code.language-gherkin');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement).toHaveClass('language-gherkin');
    });

    it('should handle feature file formatting', () => {
      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Should render the feature file content section
      expect(screen.getByText('Generated Feature File')).toBeInTheDocument();
      
      // Should have a pre element for code display
      const preElement = document.querySelector('pre');
      expect(preElement).toBeInTheDocument();
    });
  });

  describe('Feature File Formatting', () => {
    it('should format feature with all step keywords', () => {
      const featureWithAllKeywords: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            id: 'scenario-1',
            title: 'Complex scenario with all keywords',
            tags: ['@complex', '@PROJ-123'],
            acReference: 'AC-1',
            type: 'happy',
            steps: [
              { keyword: 'Given', text: 'initial condition' },
              { keyword: 'And', text: 'additional condition' },
              { keyword: 'When', text: 'action is performed' },
              { keyword: 'And', text: 'additional action' },
              { keyword: 'Then', text: 'expected result' },
              { keyword: 'And', text: 'additional result' },
              { keyword: 'But', text: 'exception case' }
            ]
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithAllKeywords}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle special characters in scenario content', () => {
      const featureWithSpecialChars: FeatureFile = {
        ...mockFeatureFile,
        feature: {
          title: 'Feature with "quotes" & special chars',
          description: ['Description with <HTML> & special chars', 'Line with émojis 🚀 and unicode'],
          tags: ['@special']
        },
        scenarios: [
          {
            id: 'scenario-1',
            title: 'Scenario with "quotes" & <brackets>',
            tags: ['@special-chars', '@PROJ-123'],
            acReference: 'AC-1',
            type: 'happy',
            steps: [
              { keyword: 'Given', text: 'text with "quotes" and <brackets>' },
              { keyword: 'When', text: 'action with émojis 🎯' },
              { keyword: 'Then', text: 'result with & ampersands' }
            ]
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithSpecialChars}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle empty steps array', () => {
      const featureWithEmptySteps: FeatureFile = {
        ...mockFeatureFile,
        scenarios: [
          {
            id: 'scenario-1',
            title: 'Scenario with no steps',
            tags: ['@empty', '@PROJ-123'],
            acReference: 'AC-1',
            type: 'happy',
            steps: []
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={featureWithEmptySteps}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed sync results gracefully', () => {
      const malformedSyncResults: SyncResults = {
        rowsAdded: -1, // Invalid negative value
        rowsSkipped: NaN, // Invalid NaN value
        scenarios: []
      };

      render(
        <ResultsDisplay
          featureFile={mockFeatureFile}
          syncResults={malformedSyncResults}
          onDownload={mockOnDownload}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle missing scenario properties', () => {
      const incompleteFeatureFile: FeatureFile = {
        feature: {
          title: '',
          description: [],
          tags: []
        },
        scenarios: [
          {
            id: '',
            title: '',
            tags: [],
            acReference: '',
            type: 'happy',
            steps: []
          }
        ],
        metadata: {
          storyId: '',
          generatedAt: new Date(),
          version: ''
        }
      };

      const incompleteSyncResults: SyncResults = {
        rowsAdded: 0,
        rowsSkipped: 0,
        scenarios: [
          {
            testCaseId: '',
            scenarioTitle: '',
            tags: '',
            acReference: '',
            status: ''
          }
        ]
      };

      render(
        <ResultsDisplay
          featureFile={incompleteFeatureFile}
          syncResults={incompleteSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });

    it('should handle null/undefined values gracefully', () => {
      const featureWithNulls: FeatureFile = {
        feature: {
          title: 'Test Feature',
          description: ['Test description'],
          tags: ['@test']
        },
        scenarios: [
          {
            id: 'test-1',
            title: 'Test scenario',
            tags: ['@test'],
            acReference: 'AC-1',
            type: 'happy',
            steps: [
              { keyword: 'Given', text: 'test step' }
            ],
            // @ts-ignore - Testing runtime behavior with undefined
            examples: undefined,
            // @ts-ignore - Testing runtime behavior with undefined
            assumptions: undefined
          }
        ],
        metadata: {
          storyId: 'TEST-1',
          generatedAt: new Date(),
          version: '1.0'
        }
      };

      render(
        <ResultsDisplay
          featureFile={featureWithNulls}
          syncResults={mockSyncResults}
          onDownload={mockOnDownload}
        />
      );

      expect(screen.getByText('Generation Complete!')).toBeInTheDocument();
    });
  });
});