import { Search, Filter, User, CheckCircle, Clock, AlertCircle, Circle, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { JiraIssue, IssueFilters, IssueType } from '../types';

interface IssueBoardProps {
  issues: JiraIssue[];
  issueType: IssueType;
  onIssueSelect: (issueId: string) => void;
  filters: IssueFilters;
  onFilterChange: (filters: IssueFilters) => void;
  isLoading: boolean;
  selectedIssueId?: string;
}

const statusIcons = {
  'To Do': Circle,
  'In Progress': Clock,
  'Ready for QA': AlertCircle,
  'Done': CheckCircle,
};

const statusColors = {
  'To Do': 'text-gray-500',
  'In Progress': 'text-blue-500',
  'Ready for QA': 'text-yellow-500',
  'Done': 'text-green-500',
};

export function IssueBoard({
  issues,
  issueType,
  onIssueSelect,
  filters,
  onFilterChange,
  isLoading,
  selectedIssueId,
}: IssueBoardProps): JSX.Element {
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const matchesStatus = filters.status === 'All' || issue.status === filters.status;
    
    // Enhanced search: search across ID, title, description, and assignee
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = 
      filters.search === '' ||
      issue.id.toLowerCase().includes(searchLower) ||
      issue.title.toLowerCase().includes(searchLower) ||
      issue.assignee.toLowerCase().includes(searchLower) ||
      (issue.description && issue.description.toLowerCase().includes(searchLower));
    
    // Multi-select assignee filter
    const matchesAssignees = 
      filters.assignees.length === 0 ||
      filters.assignees.includes(issue.assignee);
    
    return matchesStatus && matchesSearch && matchesAssignees;
  });

  // Get unique assignees for the dropdown
  const uniqueAssignees = Array.from(new Set(issues.map(issue => issue.assignee))).sort();

  const handleFilterChange = (newFilters: Partial<IssueFilters>) => {
    onFilterChange({ ...filters, ...newFilters });
  };

  const toggleAssignee = (assignee: string) => {
    const newAssignees = filters.assignees.includes(assignee)
      ? filters.assignees.filter(a => a !== assignee)
      : [...filters.assignees, assignee];
    handleFilterChange({ assignees: newAssignees });
  };

  const clearAssigneeFilter = () => {
    handleFilterChange({ assignees: [] });
    setIsAssigneeDropdownOpen(false);
  };

  // Type-specific labels
  const title = issueType === 'story' ? 'Jira Stories' : 'Jira Tasks';
  const loadingMessage = issueType === 'story' ? 'Loading stories...' : 'Loading tasks...';
  const emptyMessage = issueType === 'story' 
    ? 'No stories found matching your criteria.' 
    : 'No tasks found matching your criteria.';
  const searchPlaceholder = issueType === 'story' ? 'Search stories...' : 'Search tasks...';

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">{loadingMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {title} <span className="text-primary-600">({filteredIssues.length})</span>
        </h3>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by ID, title, assignee, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              className="input-field pl-10 pr-4 py-2.5 w-80"
            />
          </div>
          
          {/* Multi-select Assignee Filter */}
          <div className="relative" ref={assigneeDropdownRef}>
            <button
              onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg transition-colors ${
                filters.assignees.length > 0
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">
                {filters.assignees.length === 0
                  ? 'All Assignees'
                  : `${filters.assignees.length} Selected`}
              </span>
              {filters.assignees.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAssigneeFilter();
                  }}
                  className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>

            {isAssigneeDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
                <div className="p-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Select Assignees</span>
                  {filters.assignees.length > 0 && (
                    <button
                      onClick={clearAssigneeFilter}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="py-1">
                  {uniqueAssignees.map((assignee) => (
                    <label
                      key={assignee}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.assignees.includes(assignee)}
                        onChange={() => toggleAssignee(assignee)}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{assignee}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as IssueFilters['status'] })}
              className="input-field pl-10 pr-8 py-2.5 appearance-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Ready for QA">Ready for QA</option>
            </select>
          </div>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIssues.map((issue) => {
            const StatusIcon = statusIcons[issue.status];
            const isSelected = selectedIssueId === issue.id;
            
            return (
              <div
                key={issue.id}
                onClick={() => onIssueSelect(issue.id)}
                className={`group relative border rounded-2xl p-5 transition-all duration-300 cursor-pointer
                  ${
                    isSelected
                      ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-accent-50 shadow-medium scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-soft hover:scale-[1.01]'
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center text-sm font-semibold text-primary-700 bg-primary-100 px-3 py-1.5 rounded-lg">
                    {issue.id}
                  </span>
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-gray-50">
                    <StatusIcon className={`h-4 w-4 ${statusColors[issue.status]}`} />
                    <span className={`text-xs font-medium ${statusColors[issue.status]}`}>
                      {issue.status}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                  {issue.title}
                </h4>
                
                {issue.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {issue.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium">{issue.assignee}</span>
                  </div>
                  
                  <button
                    onClick={() => onIssueSelect(issue.id)}
                    className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Backward compatibility: StoryBoard component
import type { JiraStory, StoryFilters } from '../types';

interface StoryBoardProps {
  stories: JiraStory[];
  onStorySelect: (storyId: string) => void;
  filters: StoryFilters;
  onFilterChange: (filters: StoryFilters) => void;
  isLoading: boolean;
  selectedStoryId?: string;
}

export function StoryBoard({
  stories,
  onStorySelect,
  filters,
  onFilterChange,
  isLoading,
  selectedStoryId,
}: StoryBoardProps): JSX.Element {
  return (
    <IssueBoard
      issues={stories}
      issueType="story"
      onIssueSelect={onStorySelect}
      filters={filters}
      onFilterChange={onFilterChange}
      isLoading={isLoading}
      selectedIssueId={selectedStoryId}
    />
  );
}
