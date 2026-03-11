import Prism from 'prismjs';
import 'prismjs/components/prism-gherkin';
import 'prismjs/themes/prism.css';

// Define Gherkin language if not already defined
if (!Prism.languages.gherkin) {
  Prism.languages.gherkin = {
    'feature': {
      pattern: /^(\s*)Feature:.*/m,
      lookbehind: true,
      alias: 'keyword'
    },
    'scenario': {
      pattern: /^(\s*)(Scenario|Scenario Outline):.*/m,
      lookbehind: true,
      alias: 'keyword'
    },
    'step': {
      pattern: /^(\s*)(Given|When|Then|And|But)\s.*/m,
      lookbehind: true,
      inside: {
        'keyword': /^(Given|When|Then|And|But)/,
        'string': /"[^"]*"/,
        'number': /\b\d+\b/
      }
    },
    'tag': {
      pattern: /@\w+/,
      alias: 'symbol'
    },
    'comment': {
      pattern: /^\s*#.*/m,
      alias: 'comment'
    },
    'examples': {
      pattern: /^(\s*)Examples:/m,
      lookbehind: true,
      alias: 'keyword'
    },
    'table': {
      pattern: /^\s*\|.*\|$/m,
      inside: {
        'punctuation': /\|/
      }
    }
  };
}

export { Prism };

export function highlightGherkin(code: string): string {
  return Prism.highlight(code, Prism.languages.gherkin, 'gherkin');
}