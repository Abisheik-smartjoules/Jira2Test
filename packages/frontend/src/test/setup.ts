import '@testing-library/jest-dom';

// Mock Prism.js for tests
vi.mock('prismjs', () => ({
  default: {
    highlight: vi.fn((code: string) => code),
    languages: {
      gherkin: {}
    }
  }
}));

// Mock Prism CSS import
vi.mock('prismjs/themes/prism.css', () => ({}));
vi.mock('prismjs/components/prism-gherkin', () => ({}));