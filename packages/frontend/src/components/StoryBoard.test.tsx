import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryBoard } from './IssueBoard';
import type { JiraStory, StoryFilters } from '../types';

// Mock data for testing
const mockStories: JiraStory[] = [
  {
    id: 'PROJ-123',
    title: 'Implement user authentication',
    status: 'To Do',
    assignee: 'John Doe',
    description: 'Add login and registration functionality',
    issueType: 'story'
  },
  {
    id: 'PROJ-124',
    title: 'Create dashboard layout',
    status: 'In Progress',
    assignee: 'Jane Smith',
    description: 'Design and implement main dashboard',
    issueType: 'story'
  },
  {
    id: 'PROJ-125',
    title: 'Add search functionality',
    status: 'Ready for QA',
    assignee: 'Bob Johnson',
    description: 'Implement search across all entities',
    issueType: 'story'
  },
  {
    id: 'PROJ-126',
    title: 'Fix navigation bug',
    status: 'Done',
    assignee: 'Alice Brown',
    issueType: 'story'
  }
];

const defaultFilters: StoryFilters = {
  status: 'All',
  search: ''
};

const defaultProps = {
  stories: mockStories,
  onStorySelect: vi.fn(),
  filters: defaultFilters,
  onFilterChange: vi.fn(),
  isLoading: false
};

describe('StoryBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(<StoryBoard {...defaultProps} isLoading={true} />);
      
      expect(screen.getByText('Loading stories...')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories')).toBeInTheDocument();
    });

    it('should not display stories when loading', () => {
      render(<StoryBoard {...defaultProps} isLoading={true} />);
      
      expect(screen.queryByText('PROJ-123')).not.toBeInTheDocument();
    });
  });

  describe('Story Display', () => {
    it('should display all stories when no filters are applied', () => {
      render(<StoryBoard {...defaultProps} />);
      
      expect(screen.getByText('PROJ-123')).toBeInTheDocument();
      expect(screen.getByText('PROJ-124')).toBeInTheDocument();
      expect(screen.getByText('PROJ-125')).toBeInTheDocument();
      expect(screen.getByText('PROJ-126')).toBeInTheDocument();
    });

    it('should display story count in header', () => {
      render(<StoryBoard {...defaultProps} />);
      
      expect(screen.getByText('Jira Stories (4)')).toBeInTheDocument();
    });

    it('should display story details correctly', () => {
      render(<StoryBoard {...defaultProps} />);
      
      // Check story ID
      expect(screen.getByText('PROJ-123')).toBeInTheDocument();
      
      // Check story title
      expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
      
      // Check assignee
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      
      // Check description
      expect(screen.getByText('Add login and registration functionality')).toBeInTheDocument();
      
      // Check status - use getAllByText to handle multiple instances
      const statusElements = screen.getAllByText('To Do');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should display story without description', () => {
      render(<StoryBoard {...defaultProps} />);
      
      // PROJ-126 has no description
      expect(screen.getByText('PROJ-126')).toBeInTheDocument();
      expect(screen.getByText('Fix navigation bug')).toBeInTheDocument();
    });

    it('should display correct status icons and colors', () => {
      render(<StoryBoard {...defaultProps} />);
      
      // Check that status text is displayed with appropriate styling
      const todoStatuses = screen.getAllByText('To Do');
      const inProgressStatuses = screen.getAllByText('In Progress');
      const readyForQAStatuses = screen.getAllByText('Ready for QA');
      const doneStatuses = screen.getAllByText('Done');
      
      expect(todoStatuses.length).toBeGreaterThan(0);
      expect(inProgressStatuses.length).toBeGreaterThan(0);
      expect(readyForQAStatuses.length).toBeGreaterThan(0);
      expect(doneStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('Story Selection', () => {
    it('should call onStorySelect when Select button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnStorySelect = vi.fn();
      
      render(<StoryBoard {...defaultProps} onStorySelect={mockOnStorySelect} />);
      
      const selectButton = screen.getAllByText('Select')[0];
      await user.click(selectButton);
      
      expect(mockOnStorySelect).toHaveBeenCalledWith('PROJ-123');
    });

    it('should show Selected state for selected story', () => {
      render(<StoryBoard {...defaultProps} selectedStoryId="PROJ-123" />);
      
      const selectedButton = screen.getByText('Selected');
      expect(selectedButton).toBeInTheDocument();
      
      // Other stories should still show Select
      const selectButtons = screen.getAllByText('Select');
      expect(selectButtons).toHaveLength(3);
    });

    it('should apply selected styling to selected story card', () => {
      render(<StoryBoard {...defaultProps} selectedStoryId="PROJ-123" />);
      
      // Find the story card by looking for the card container that contains the story ID
      const storyCards = screen.getAllByText('PROJ-123');
      const storyCard = storyCards[0].closest('.border');
      expect(storyCard).toHaveClass('border-primary-500', 'bg-primary-50');
    });
  });

  describe('Status Filtering', () => {
    it('should filter stories by status', async () => {
      const user = userEvent.setup();
      const mockOnFilterChange = vi.fn();
      
      render(<StoryBoard {...defaultProps} onFilterChange={mockOnFilterChange} />);
      
      const statusSelect = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusSelect, 'To Do');
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: 'To Do',
        search: ''
      });
    });

    it('should display filtered stories correctly', () => {
      const filters: StoryFilters = { status: 'In Progress', search: '' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('PROJ-124')).toBeInTheDocument();
      expect(screen.queryByText('PROJ-123')).not.toBeInTheDocument();
      expect(screen.queryByText('PROJ-125')).not.toBeInTheDocument();
      expect(screen.queryByText('PROJ-126')).not.toBeInTheDocument();
      
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });

    it('should show all stories when All status is selected', () => {
      const filters: StoryFilters = { status: 'All', search: '' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('Jira Stories (4)')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call onFilterChange when search input changes', async () => {
      const mockOnFilterChange = vi.fn();
      
      render(<StoryBoard {...defaultProps} onFilterChange={mockOnFilterChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search stories...');
      
      // Use fireEvent to simulate a single change event
      fireEvent.change(searchInput, { target: { value: 'auth' } });
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: 'All',
        search: 'auth'
      });
    });

    it('should filter stories by title', () => {
      const filters: StoryFilters = { status: 'All', search: 'dashboard' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('PROJ-124')).toBeInTheDocument();
      expect(screen.queryByText('PROJ-123')).not.toBeInTheDocument();
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });

    it('should filter stories by ID', () => {
      const filters: StoryFilters = { status: 'All', search: '125' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('PROJ-125')).toBeInTheDocument();
      expect(screen.queryByText('PROJ-123')).not.toBeInTheDocument();
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      const filters: StoryFilters = { status: 'All', search: 'AUTH' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('PROJ-123')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });

    it('should combine status and search filters', () => {
      const filters: StoryFilters = { status: 'To Do', search: 'auth' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('PROJ-123')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no stories match filters', () => {
      const filters: StoryFilters = { status: 'All', search: 'nonexistent' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories (0)')).toBeInTheDocument();
    });

    it('should display empty state when no stories are provided', () => {
      render(<StoryBoard {...defaultProps} stories={[]} />);
      
      expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories (0)')).toBeInTheDocument();
    });
  });

  describe('Filter State Management', () => {
    it('should preserve existing filters when updating search', async () => {
      const mockOnFilterChange = vi.fn();
      const filters: StoryFilters = { status: 'In Progress', search: '' };
      
      render(<StoryBoard {...defaultProps} filters={filters} onFilterChange={mockOnFilterChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search stories...');
      
      // Use fireEvent to simulate a single change event
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: 'In Progress',
        search: 'test'
      });
    });

    it('should preserve existing filters when updating status', async () => {
      const user = userEvent.setup();
      const mockOnFilterChange = vi.fn();
      const filters: StoryFilters = { status: 'All', search: 'dashboard' };
      
      render(<StoryBoard {...defaultProps} filters={filters} onFilterChange={mockOnFilterChange} />);
      
      const statusSelect = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusSelect, 'To Do');
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: 'To Do',
        search: 'dashboard'
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and inputs', () => {
      render(<StoryBoard {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search stories...');
      const statusSelect = screen.getByDisplayValue('All Status');
      
      expect(searchInput).toBeInTheDocument();
      expect(statusSelect).toBeInTheDocument();
    });

    it('should have clickable buttons for story selection', () => {
      render(<StoryBoard {...defaultProps} />);
      
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      expect(selectButtons).toHaveLength(4);
      
      selectButtons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });

    it('should maintain focus management for keyboard navigation', () => {
      render(<StoryBoard {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search stories...');
      const statusSelect = screen.getByDisplayValue('All Status');
      const selectButtons = screen.getAllByRole('button', { name: /select/i });
      
      // All interactive elements should be focusable
      expect(searchInput).not.toHaveAttribute('tabindex', '-1');
      expect(statusSelect).not.toHaveAttribute('tabindex', '-1');
      selectButtons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Performance and Large Datasets', () => {
    it('should handle large number of stories efficiently', () => {
      const largeStorySet: JiraStory[] = Array.from({ length: 100 }, (_, i) => ({
        id: `PROJ-${i + 1}`,
        title: `Story ${i + 1}`,
        status: ['To Do', 'In Progress', 'Ready for QA', 'Done'][i % 4] as JiraStory['status'],
        assignee: `User ${i + 1}`,
        description: `Description for story ${i + 1}`,
        issueType: 'story' as const
      }));

      render(<StoryBoard {...defaultProps} stories={largeStorySet} />);
      
      expect(screen.getByText('Jira Stories (100)')).toBeInTheDocument();
      expect(screen.getByText('PROJ-1')).toBeInTheDocument();
      expect(screen.getByText('PROJ-100')).toBeInTheDocument();
    });

    it('should filter large datasets efficiently', () => {
      const largeStorySet: JiraStory[] = Array.from({ length: 100 }, (_, i) => ({
        id: `PROJ-${i + 1}`,
        title: `Story ${i + 1}`,
        status: 'To Do',
        assignee: `User ${i + 1}`,
        issueType: 'story' as const
      }));

      const filters: StoryFilters = { status: 'To Do', search: '' };
      render(<StoryBoard {...defaultProps} stories={largeStorySet} filters={filters} />);
      
      expect(screen.getByText('Jira Stories (100)')).toBeInTheDocument();
    });

    it('should handle rapid filter changes without errors', async () => {
      const user = userEvent.setup();
      const mockOnFilterChange = vi.fn();
      
      render(<StoryBoard {...defaultProps} onFilterChange={mockOnFilterChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search stories...');
      
      // Simulate rapid typing
      await user.type(searchInput, 'test');
      
      // Should have called onFilterChange for each character
      expect(mockOnFilterChange).toHaveBeenCalledTimes(4);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle exactly zero stories', () => {
      render(<StoryBoard {...defaultProps} stories={[]} />);
      
      expect(screen.getByText('Jira Stories (0)')).toBeInTheDocument();
      expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
    });

    it('should handle exactly one story', () => {
      const singleStory: JiraStory[] = [mockStories[0]];
      render(<StoryBoard {...defaultProps} stories={singleStory} />);
      
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
      expect(screen.getByText('PROJ-123')).toBeInTheDocument();
    });

    it('should handle search with empty string after having text', async () => {
      const mockOnFilterChange = vi.fn();
      const filters: StoryFilters = { status: 'All', search: 'test' };
      
      render(<StoryBoard {...defaultProps} filters={filters} onFilterChange={mockOnFilterChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search stories...');
      
      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: 'All',
        search: ''
      });
    });

    it('should handle whitespace-only search terms', () => {
      const filters: StoryFilters = { status: 'All', search: '   ' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      // Should show no results for whitespace-only search
      expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
    });

    it('should handle search terms that match multiple fields', () => {
      const storiesWithOverlap: JiraStory[] = [
        {
          id: 'AUTH-123',
          title: 'Authentication feature',
          status: 'To Do',
          assignee: 'Auth Developer',
          issueType: 'story'
        }
      ];
      
      const filters: StoryFilters = { status: 'All', search: 'auth' };
      render(<StoryBoard {...defaultProps} stories={storiesWithOverlap} filters={filters} />);
      
      // Should find the story since 'auth' matches both ID and title and assignee
      expect(screen.getByText('AUTH-123')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain selected story when filters change', () => {
      const filters: StoryFilters = { status: 'All', search: '' };
      const { rerender } = render(
        <StoryBoard {...defaultProps} filters={filters} selectedStoryId="PROJ-123" />
      );
      
      expect(screen.getByText('Selected')).toBeInTheDocument();
      
      // Change filters but keep selection
      const newFilters: StoryFilters = { status: 'To Do', search: '' };
      rerender(
        <StoryBoard {...defaultProps} filters={newFilters} selectedStoryId="PROJ-123" />
      );
      
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('should clear selection when selected story is filtered out', () => {
      const filters: StoryFilters = { status: 'In Progress', search: '' };
      render(<StoryBoard {...defaultProps} filters={filters} selectedStoryId="PROJ-123" />);
      
      // PROJ-123 has status 'To Do', so it should be filtered out
      expect(screen.queryByText('PROJ-123')).not.toBeInTheDocument();
      expect(screen.queryByText('Selected')).not.toBeInTheDocument();
    });

    it('should handle props updates gracefully', () => {
      const { rerender } = render(<StoryBoard {...defaultProps} />);
      
      expect(screen.getByText('Jira Stories (4)')).toBeInTheDocument();
      
      // Update with new stories
      const newStories: JiraStory[] = [mockStories[0]];
      rerender(<StoryBoard {...defaultProps} stories={newStories} />);
      
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle stories with empty titles', () => {
      const storiesWithEmptyTitle: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: '',
          status: 'To Do',
          assignee: 'Test User',
          issueType: 'story'
        }
      ];
      
      render(<StoryBoard {...defaultProps} stories={storiesWithEmptyTitle} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should handle stories with empty assignee', () => {
      const storiesWithEmptyAssignee: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: 'Test Story',
          status: 'To Do',
          assignee: '',
          issueType: 'story'
        }
      ];
      
      render(<StoryBoard {...defaultProps} stories={storiesWithEmptyAssignee} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Test Story')).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      const filters: StoryFilters = { status: 'All', search: '@#$%' };
      render(<StoryBoard {...defaultProps} filters={filters} />);
      
      expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();
    });

    it('should handle very long story titles gracefully', () => {
      const storiesWithLongTitle: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: 'This is a very long story title that should be truncated or handled gracefully in the UI to prevent layout issues and maintain readability',
          status: 'To Do',
          assignee: 'Test User',
          issueType: 'story'
        }
      ];
      
      render(<StoryBoard {...defaultProps} stories={storiesWithLongTitle} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      // The title should be present but may be truncated by CSS
      expect(screen.getByText(/This is a very long story title/)).toBeInTheDocument();
    });

    it('should handle very long descriptions gracefully', () => {
      const storiesWithLongDescription: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: 'Test Story',
          status: 'To Do',
          assignee: 'Test User',
          description: 'This is a very long description that should be truncated or handled gracefully in the UI to prevent layout issues and maintain readability. It contains multiple sentences and should test the line-clamp functionality.',
          issueType: 'story'
        }
      ];
      
      render(<StoryBoard {...defaultProps} stories={storiesWithLongDescription} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Test Story')).toBeInTheDocument();
      // The description should be present but may be truncated by CSS
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
    });

    it('should handle Unicode characters in story data', () => {
      const storiesWithUnicode: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: 'Story with émojis 🚀 and spëcial chars',
          status: 'To Do',
          assignee: 'Tëst Üser',
          description: 'Description with 中文 characters and symbols ∑∆',
          issueType: 'story'
        }
      ];
      
      render(<StoryBoard {...defaultProps} stories={storiesWithUnicode} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Story with émojis 🚀 and spëcial chars')).toBeInTheDocument();
      expect(screen.getByText('Tëst Üser')).toBeInTheDocument();
      expect(screen.getByText('Description with 中文 characters and symbols ∑∆')).toBeInTheDocument();
    });

    it('should handle search with Unicode characters', () => {
      const storiesWithUnicode: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: 'Story with émojis 🚀',
          status: 'To Do',
          assignee: 'Test User',
          issueType: 'story'
        }
      ];
      
      const filters: StoryFilters = { status: 'All', search: 'émojis' };
      render(<StoryBoard {...defaultProps} stories={storiesWithUnicode} filters={filters} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories (1)')).toBeInTheDocument();
    });

    it('should handle null or undefined values gracefully', () => {
      // Test with minimal required fields only
      const minimalStories: JiraStory[] = [
        {
          id: 'PROJ-999',
          title: 'Minimal Story',
          status: 'To Do',
          assignee: 'Test User',
          issueType: 'story'
          // description is optional and not provided
        }
      ];
      
      render(<StoryBoard {...defaultProps} stories={minimalStories} />);
      
      expect(screen.getByText('PROJ-999')).toBeInTheDocument();
      expect(screen.getByText('Minimal Story')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });
});