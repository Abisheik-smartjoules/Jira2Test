import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render the main heading', () => {
    render(<App />);
    expect(screen.getByText('Jira2Test')).toBeInTheDocument();
  });

  it('should render the generation form heading', () => {
    render(<App />);
    expect(screen.getByText('Generate Gherkin Feature Files')).toBeInTheDocument();
  });
});