import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { IssueBoard } from './IssueBoard';
import type { JiraIssue, IssueFilters } from '../types';

describe('IssueBoard - Task Error Handling', () => {
  const mockOnIssueSelect = vi.fn();
  const mockOnFilterChange = vi.fn();

  const defaultFilters: IssueFilters = {
    status: 'All',
    search: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States for Tasks', () => {
    it('displays "Loading tasks..." when loading tasks', () => {
      render(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
      expect(screen.getByText('Jira Tasks')).toBeInTheDocument();
    });

    it('displays loading spinner with proper styling', () => {
      render(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={true}
        />
      );

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('border-primary-600');
    });
  });

  describe('Empty States for Tasks', () => {
    it('displays "No tasks found matching your criteria" when no tasks match filters', () => {
      render(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('No tasks found matching your criteria.')).toBeInTheDocument();
    });

    it('displays empty state when all tasks are filtered out', () => {
      const tasks: JiraIssue[] = [
        {
          id: 'PROJ-1',
          title: 'Task 1',
          status: 'To Do',
          assignee: 'John Doe',
          issueType: 'task',
        },
      ];

      render(
        <IssueBoard
          issues={tasks}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={{ status: 'Done', search: '' }}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('No tasks found matching your criteria.')).toBeInTheDocument();
    });
  });

  describe('Task Display', () => {
    it('displays tasks correctly when loaded', () => {
      const tasks: JiraIssue[] = [
        {
          id: 'PROJ-1',
          title: 'Implement feature',
          status: 'In Progress',
          assignee: 'John Doe',
          description: 'Task description',
          issueType: 'task',
        },
        {
          id: 'PROJ-2',
          title: 'Fix bug',
          status: 'To Do',
          assignee: 'Jane Smith',
          issueType: 'task',
        },
      ];

      render(
        <IssueBoard
          issues={tasks}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Jira Tasks (2)')).toBeInTheDocument();
      expect(screen.getByText('Implement feature')).toBeInTheDocument();
      expect(screen.getByText('Fix bug')).toBeInTheDocument();
    });

    it('displays correct placeholder text for task search', () => {
      render(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Comparison with Stories', () => {
    it('displays different messages for stories vs tasks', () => {
      const { rerender } = render(
        <IssueBoard
          issues={[]}
          issueType="story"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading stories...')).toBeInTheDocument();
      expect(screen.getByText('Jira Stories')).toBeInTheDocument();

      rerender(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={true}
        />
      );

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
      expect(screen.getByText('Jira Tasks')).toBeInTheDocument();
    });

    it('displays different empty state messages for stories vs tasks', () => {
      const { rerender } = render(
        <IssueBoard
          issues={[]}
          issueType="story"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('No stories found matching your criteria.')).toBeInTheDocument();

      rerender(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('No tasks found matching your criteria.')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('handles empty task list gracefully', () => {
      render(
        <IssueBoard
          issues={[]}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('No tasks found matching your criteria.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /select/i })).not.toBeInTheDocument();
    });

    it('handles tasks with missing optional fields', () => {
      const tasks: JiraIssue[] = [
        {
          id: 'PROJ-1',
          title: 'Task without description',
          status: 'To Do',
          assignee: 'John Doe',
          issueType: 'task',
          // description is optional and missing
        },
      ];

      render(
        <IssueBoard
          issues={tasks}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      expect(screen.getByText('Task without description')).toBeInTheDocument();
      expect(screen.getByText('PROJ-1')).toBeInTheDocument();
    });

    it('handles tasks with very long titles', () => {
      const tasks: JiraIssue[] = [
        {
          id: 'PROJ-1',
          title: 'This is a very long task title that should be truncated with line-clamp-2 class to prevent overflow and maintain proper layout in the card component',
          status: 'To Do',
          assignee: 'John Doe',
          issueType: 'task',
        },
      ];

      render(
        <IssueBoard
          issues={tasks}
          issueType="task"
          onIssueSelect={mockOnIssueSelect}
          filters={defaultFilters}
          onFilterChange={mockOnFilterChange}
          isLoading={false}
        />
      );

      const titleElement = screen.getByText(/This is a very long task title/);
      expect(titleElement).toHaveClass('line-clamp-2');
    });
  });
});
