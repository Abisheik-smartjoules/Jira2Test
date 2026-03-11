/**
 * Unit tests for Gherkin validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  stepKeywordSchema,
  scenarioTypeSchema,
  stepSchema,
  examplesTableSchema,
  scenarioSchema,
  featureSchema,
  fileMetadataSchema,
  featureFileSchema,
  gherkinParseResultSchema,
  gherkinGenerationInputSchema,
} from './gherkin-schemas.js';

describe('Gherkin Schemas', () => {
  describe('stepKeywordSchema', () => {
    it('should validate all valid step keywords', () => {
      const validKeywords = ['Given', 'When', 'Then', 'And', 'But'];
      
      validKeywords.forEach(keyword => {
        expect(() => stepKeywordSchema.parse(keyword)).not.toThrow();
      });
    });

    it('should reject invalid step keywords', () => {
      expect(() => stepKeywordSchema.parse('given')).toThrow();
      expect(() => stepKeywordSchema.parse('GIVEN')).toThrow();
      expect(() => stepKeywordSchema.parse('If')).toThrow();
    });
  });

  describe('scenarioTypeSchema', () => {
    it('should validate all scenario types', () => {
      const validTypes = ['happy', 'negative', 'edge'];
      
      validTypes.forEach(type => {
        expect(() => scenarioTypeSchema.parse(type)).not.toThrow();
      });
    });

    it('should reject invalid scenario types', () => {
      expect(() => scenarioTypeSchema.parse('positive')).toThrow();
      expect(() => scenarioTypeSchema.parse('HAPPY')).toThrow();
    });
  });

  describe('stepSchema', () => {
    it('should validate valid step', () => {
      const validStep = {
        keyword: 'Given',
        text: 'user is logged in',
      };

      expect(() => stepSchema.parse(validStep)).not.toThrow();
    });

    it('should reject step with empty text', () => {
      const invalidStep = {
        keyword: 'Given',
        text: '',
      };

      expect(() => stepSchema.parse(invalidStep)).toThrow();
    });

    it('should reject step with invalid keyword', () => {
      const invalidStep = {
        keyword: 'If',
        text: 'user is logged in',
      };

      expect(() => stepSchema.parse(invalidStep)).toThrow();
    });
  });

  describe('examplesTableSchema', () => {
    it('should validate valid examples table', () => {
      const validTable = {
        headers: ['username', 'password'],
        rows: [
          ['john', 'secret123'],
          ['jane', 'password456'],
        ],
      };

      expect(() => examplesTableSchema.parse(validTable)).not.toThrow();
    });

    it('should reject table with empty headers', () => {
      const invalidTable = {
        headers: [],
        rows: [['value1', 'value2']],
      };

      expect(() => examplesTableSchema.parse(invalidTable)).toThrow();
    });

    it('should reject table with empty rows', () => {
      const invalidTable = {
        headers: ['col1', 'col2'],
        rows: [],
      };

      expect(() => examplesTableSchema.parse(invalidTable)).toThrow();
    });

    it('should reject table with mismatched column counts', () => {
      const invalidTable = {
        headers: ['col1', 'col2'],
        rows: [
          ['value1', 'value2'],
          ['value3'], // Missing second column
        ],
      };

      expect(() => examplesTableSchema.parse(invalidTable)).toThrow();
    });

    it('should reject table with empty header names', () => {
      const invalidTable = {
        headers: ['col1', ''],
        rows: [['value1', 'value2']],
      };

      expect(() => examplesTableSchema.parse(invalidTable)).toThrow();
    });
  });

  describe('scenarioSchema', () => {
    const validScenario = {
      id: 'scenario-1',
      title: 'User can log in successfully',
      tags: ['@smoke', '@PROJ-123'],
      acReference: 'AC-1',
      type: 'happy',
      steps: [
        { keyword: 'Given', text: 'user has valid credentials' },
        { keyword: 'When', text: 'user submits login form' },
        { keyword: 'Then', text: 'user is redirected to dashboard' },
      ],
    };

    it('should validate complete scenario', () => {
      expect(() => scenarioSchema.parse(validScenario)).not.toThrow();
    });

    it('should validate scenario with examples', () => {
      const scenarioWithExamples = {
        ...validScenario,
        examples: {
          headers: ['username', 'password'],
          rows: [['john', 'secret123']],
        },
      };

      expect(() => scenarioSchema.parse(scenarioWithExamples)).not.toThrow();
    });

    it('should validate scenario with assumptions', () => {
      const scenarioWithAssumptions = {
        ...validScenario,
        assumptions: ['User account exists', 'System is available'],
      };

      expect(() => scenarioSchema.parse(scenarioWithAssumptions)).not.toThrow();
    });

    it('should reject scenario with invalid AC reference', () => {
      const invalidScenario = {
        ...validScenario,
        acReference: 'AC1', // Missing hyphen
      };

      expect(() => scenarioSchema.parse(invalidScenario)).toThrow();
    });

    it('should reject scenario with no steps', () => {
      const invalidScenario = {
        ...validScenario,
        steps: [],
      };

      expect(() => scenarioSchema.parse(invalidScenario)).toThrow();
    });

    it('should apply default empty arrays for optional fields', () => {
      const minimalScenario = {
        id: 'scenario-1',
        title: 'Test scenario',
        acReference: 'AC-1',
        type: 'happy',
        steps: [{ keyword: 'Given', text: 'something' }],
      };

      const parsed = scenarioSchema.parse(minimalScenario);
      expect(parsed.tags).toEqual([]);
    });
  });

  describe('featureSchema', () => {
    it('should validate complete feature', () => {
      const validFeature = {
        title: 'User Authentication',
        description: ['As a user', 'I want to log in', 'So that I can access my account'],
        tags: ['@feature', '@authentication'],
      };

      expect(() => featureSchema.parse(validFeature)).not.toThrow();
    });

    it('should apply default empty arrays', () => {
      const minimalFeature = {
        title: 'Simple Feature',
      };

      const parsed = featureSchema.parse(minimalFeature);
      expect(parsed.description).toEqual([]);
      expect(parsed.tags).toEqual([]);
    });

    it('should reject feature with empty title', () => {
      const invalidFeature = {
        title: '',
      };

      expect(() => featureSchema.parse(invalidFeature)).toThrow();
    });
  });

  describe('fileMetadataSchema', () => {
    it('should validate valid metadata', () => {
      const validMetadata = {
        storyId: 'PROJ-123',
        generatedAt: new Date(),
        version: '1.0',
      };

      expect(() => fileMetadataSchema.parse(validMetadata)).not.toThrow();
    });

    it('should reject invalid version format', () => {
      const invalidMetadata = {
        storyId: 'PROJ-123',
        generatedAt: new Date(),
        version: '1', // Missing minor version
      };

      expect(() => fileMetadataSchema.parse(invalidMetadata)).toThrow();
    });

    it('should reject invalid story ID', () => {
      const invalidMetadata = {
        storyId: 'invalid-id',
        generatedAt: new Date(),
        version: '1.0',
      };

      expect(() => fileMetadataSchema.parse(invalidMetadata)).toThrow();
    });
  });

  describe('featureFileSchema', () => {
    const validFeatureFile = {
      feature: {
        title: 'User Authentication',
        description: ['Feature description'],
        tags: ['@feature'],
      },
      scenarios: [
        {
          id: 'scenario-1',
          title: 'Successful login',
          tags: ['@smoke', '@PROJ-123'],
          acReference: 'AC-1',
          type: 'happy',
          steps: [{ keyword: 'Given', text: 'user exists' }],
        },
      ],
      metadata: {
        storyId: 'PROJ-123',
        generatedAt: new Date(),
        version: '1.0',
      },
    };

    it('should validate complete feature file', () => {
      expect(() => featureFileSchema.parse(validFeatureFile)).not.toThrow();
    });

    it('should reject feature file with no scenarios', () => {
      const invalidFile = {
        ...validFeatureFile,
        scenarios: [],
      };

      expect(() => featureFileSchema.parse(invalidFile)).toThrow();
    });

    it('should reject feature file where scenarios missing story ID tag', () => {
      const invalidFile = {
        ...validFeatureFile,
        scenarios: [
          {
            ...validFeatureFile.scenarios[0],
            tags: ['@smoke'], // Missing @PROJ-123 tag
          },
        ],
      };

      expect(() => featureFileSchema.parse(invalidFile)).toThrow();
    });
  });

  describe('gherkinParseResultSchema', () => {
    it('should validate successful parse result', () => {
      const successResult = {
        success: true,
        featureFile: {
          feature: { title: 'Test Feature' },
          scenarios: [{
            id: 'test',
            title: 'Test Scenario',
            tags: ['@PROJ-123'],
            acReference: 'AC-1',
            type: 'happy',
            steps: [{ keyword: 'Given', text: 'something' }],
          }],
          metadata: {
            storyId: 'PROJ-123',
            generatedAt: new Date(),
            version: '1.0',
          },
        },
        errors: [],
      };

      expect(() => gherkinParseResultSchema.parse(successResult)).not.toThrow();
    });

    it('should validate failed parse result', () => {
      const failureResult = {
        success: false,
        errors: ['Syntax error on line 5', 'Missing feature title'],
      };

      expect(() => gherkinParseResultSchema.parse(failureResult)).not.toThrow();
    });

    it('should apply default empty errors array', () => {
      const minimalResult = {
        success: true,
      };

      const parsed = gherkinParseResultSchema.parse(minimalResult);
      expect(parsed.errors).toEqual([]);
    });
  });

  describe('gherkinGenerationInputSchema', () => {
    it('should validate complete generation input', () => {
      const validInput = {
        storyDetails: {
          id: 'PROJ-123',
          title: 'User Authentication',
          description: 'As a user, I want to log in',
          acceptanceCriteria: ['User can log in with valid credentials'],
        },
        codebaseContext: {
          entities: ['User', 'Session'],
          workflows: ['login', 'logout'],
          businessRules: ['Password must be 8+ characters'],
          apiEndpoints: ['/api/auth/login'],
          uiComponents: ['LoginForm', 'Dashboard'],
        },
      };

      expect(() => gherkinGenerationInputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject input with invalid story ID', () => {
      const invalidInput = {
        storyDetails: {
          id: 'invalid-id',
          title: 'Test',
          description: 'Test description',
          acceptanceCriteria: [],
        },
        codebaseContext: {
          entities: [],
          workflows: [],
          businessRules: [],
          apiEndpoints: [],
          uiComponents: [],
        },
      };

      expect(() => gherkinGenerationInputSchema.parse(invalidInput)).toThrow();
    });
  });
});