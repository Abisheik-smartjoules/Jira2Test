import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TabSelector } from './TabSelector';

describe('TabSelector', () => {
  it('renders both Stories and Tasks tabs', () => {
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    expect(screen.getByRole('tab', { name: /stories/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    const storiesTab = screen.getByRole('tab', { name: /stories/i });
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    
    expect(storiesTab).toHaveAttribute('aria-selected', 'true');
    expect(tasksTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onTabChange when Stories tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="tasks" onTabChange={onTabChange} />);
    
    const storiesTab = screen.getByRole('tab', { name: /stories/i });
    await user.click(storiesTab);
    
    expect(onTabChange).toHaveBeenCalledWith('stories');
  });

  it('calls onTabChange when Tasks tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    await user.click(tasksTab);
    
    expect(onTabChange).toHaveBeenCalledWith('tasks');
  });

  it('supports keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    const storiesTab = screen.getByRole('tab', { name: /stories/i });
    storiesTab.focus();
    
    // Arrow right should move to Tasks tab
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /tasks/i })).toHaveFocus();
    
    // Arrow left should move back to Stories tab
    await user.keyboard('{ArrowLeft}');
    expect(storiesTab).toHaveFocus();
  });

  it('activates tab when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    tasksTab.focus();
    
    await user.keyboard('{Enter}');
    
    expect(onTabChange).toHaveBeenCalledWith('tasks');
  });

  it('wraps focus from last tab to first tab with ArrowRight', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="tasks" onTabChange={onTabChange} />);
    
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    tasksTab.focus();
    
    await user.keyboard('{ArrowRight}');
    
    expect(screen.getByRole('tab', { name: /stories/i })).toHaveFocus();
  });

  it('wraps focus from first tab to last tab with ArrowLeft', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    const storiesTab = screen.getByRole('tab', { name: /stories/i });
    storiesTab.focus();
    
    await user.keyboard('{ArrowLeft}');
    
    expect(screen.getByRole('tab', { name: /tasks/i })).toHaveFocus();
  });

  it('has proper ARIA attributes for accessibility', () => {
    const onTabChange = vi.fn();
    render(<TabSelector activeTab="stories" onTabChange={onTabChange} />);
    
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    const storiesTab = screen.getByRole('tab', { name: /stories/i });
    const tasksTab = screen.getByRole('tab', { name: /tasks/i });
    
    expect(storiesTab).toHaveAttribute('aria-selected', 'true');
    expect(tasksTab).toHaveAttribute('aria-selected', 'false');
  });
});
