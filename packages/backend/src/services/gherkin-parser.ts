/**
 * Gherkin Parser for parsing .feature file content into FeatureFile objects
 */

import { FeatureFile, Feature, Scenario, Step, ExamplesTable, StepKeyword, ScenarioType } from '@jira2test/shared';

export class GherkinParser {
  /**
   * Parse Gherkin content into a FeatureFile object
   */
  parse(content: string): FeatureFile {
    const lines = content.split('\n'); // Don't trim here - preserve original whitespace
    
    const feature = this.parseFeature(lines);
    const scenarios = this.parseScenarios(lines);
    
    this.validateSyntax(feature, scenarios);
    
    return {
      feature,
      scenarios,
      metadata: {
        storyId: this.extractStoryId(scenarios),
        generatedAt: new Date(),
        version: '1.0'
      }
    };
  }

  private parseFeature(lines: string[]): Feature {
    let featureIndex = -1;
    let title = '';
    const description: string[] = [];
    const tags: string[] = [];
    
    // Find feature line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Feature:')) {
        featureIndex = i;
        // Extract title from original line to preserve whitespace
        const colonIndex = line.indexOf(':');
        title = line.substring(colonIndex + 2); // Skip ': ' (colon + space)
        break;
      }
      if (trimmedLine.startsWith('@')) {
        tags.push(...this.parseTags(trimmedLine));
      }
    }
    
    if (featureIndex === -1) {
      throw new Error('No Feature declaration found');
    }
    
    // Parse description (lines after Feature: until first scenario, tag, or comment)
    for (let i = featureIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (trimmedLine === '') {
        continue;
      }
      // Stop at scenario-level elements: tags, scenarios, or comments (which belong to scenarios)
      if (trimmedLine.startsWith('@') || 
          trimmedLine.startsWith('Scenario:') || 
          trimmedLine.startsWith('Scenario Outline:') ||
          trimmedLine.startsWith('#')) {
        break;
      }
      // Extract description from original line to preserve whitespace
      // Remove only the standard indentation (2 spaces) but preserve content whitespace
      if (line.startsWith('  ')) {
        // Remove exactly 2 spaces of indentation, preserve the rest
        const descriptionLine = line.substring(2);
        description.push(descriptionLine);
      } else {
        // If no standard indentation, use the trimmed line
        description.push(trimmedLine);
      }
    }
    
    return { title, description, tags };
  }

  private parseScenarios(lines: string[]): Scenario[] {
    const scenarios: Scenario[] = [];
    let currentScenario: Partial<Scenario> | null = null;
    let currentSteps: Step[] = [];
    let currentExamples: ExamplesTable | null = null;
    let currentTags: string[] = [];
    let currentAssumptions: string[] = [];
    let acReference = '';
    let inScenario = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') continue;
      
      // Skip lines before first scenario (feature description area)
      if (!inScenario && !trimmedLine.startsWith('Scenario:') && !trimmedLine.startsWith('Scenario Outline:') && 
          !trimmedLine.startsWith('#') && !trimmedLine.startsWith('@')) {
        continue;
      }
      
      // Once we encounter a comment or tag, we're in the scenario area
      if (!inScenario && (trimmedLine.startsWith('#') || trimmedLine.startsWith('@'))) {
        inScenario = true;
      }
      
      // Parse comments for AC references and assumptions
      if (trimmedLine.startsWith('#')) {
        // Use original line to preserve whitespace in comment content
        const commentStart = line.indexOf('#');
        const comment = line.substring(commentStart + 1);
        // Remove leading space after # if present, but preserve trailing spaces
        const cleanComment = comment.startsWith(' ') ? comment.substring(1) : comment;
        if (cleanComment.startsWith('AC-')) {
          acReference = cleanComment.trim(); // AC references can be trimmed
        } else if (cleanComment.startsWith('ASSUMPTION:')) {
          // Handle both "ASSUMPTION:" and "ASSUMPTION: " (with space after colon)
          // Preserve whitespace in assumption text by not trimming
          const assumptionText = cleanComment.startsWith('ASSUMPTION: ') 
            ? cleanComment.substring(12) 
            : cleanComment.substring(11);
          currentAssumptions.push(assumptionText);
        }
        continue;
      }
      
      // Parse tags
      if (trimmedLine.startsWith('@')) {
        currentTags.push(...this.parseTags(trimmedLine));
        continue;
      }
      
      // Parse scenario start
      if (trimmedLine.startsWith('Scenario:') || trimmedLine.startsWith('Scenario Outline:')) {
        // Save previous scenario if exists
        if (currentScenario) {
          scenarios.push(this.completeScenario(currentScenario, currentSteps, currentExamples, currentTags, currentAssumptions, acReference));
        }
        
        inScenario = true;
        
        // Start new scenario - extract title from original line to preserve whitespace
        const colonIndex = line.indexOf(':');
        const title = line.substring(colonIndex + 2); // Skip ': ' (colon + space)
        currentScenario = {
          id: this.generateScenarioId(title),
          title,
          type: this.inferScenarioType(currentTags)
        };
        currentSteps = [];
        currentExamples = null;
        
        // Store current scenario data (tags, assumptions, AC reference collected before this scenario)
        currentScenario.tags = [...currentTags];
        currentScenario.assumptions = currentAssumptions.length > 0 ? [...currentAssumptions] : undefined;
        currentScenario.acReference = acReference;
        
        // Reset for next scenario
        currentTags = [];
        currentAssumptions = [];
        acReference = '';
        
        continue;
      }
      
      // Parse steps
      if (this.isStepLine(trimmedLine)) {
        // Find the step in the original line to preserve whitespace
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        const stepLine = line.substring(indent.length);
        const step = this.parseStep(stepLine);
        currentSteps.push(step);
        continue;
      }
      
      // Parse examples
      if (trimmedLine === 'Examples:') {
        currentExamples = this.parseExamples(lines, i + 1);
        // Skip the examples lines
        while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('|') || lines[i + 1].trim() === '')) {
          i++;
        }
        continue;
      }
      
      // If we're in a scenario and encounter an unrecognized line, it's an error
      if (inScenario && currentScenario && !trimmedLine.startsWith('|')) {
        throw new Error(`Invalid step line: ${trimmedLine}`);
      }
    }
    
    // Save last scenario
    if (currentScenario) {
      scenarios.push(this.completeScenario(currentScenario, currentSteps, currentExamples, currentTags, currentAssumptions, acReference));
    }
    
    return scenarios;
  }

  private completeScenario(
    scenario: Partial<Scenario>,
    steps: Step[],
    examples: ExamplesTable | null,
    tags: string[],
    _assumptions: string[],
    acReference: string
  ): Scenario {
    return {
      id: scenario.id!,
      title: scenario.title!,
      tags: scenario.tags || [...tags],
      acReference: scenario.acReference || acReference,
      type: scenario.type!,
      steps: [...steps],
      examples: examples ? { ...examples, rows: [...examples.rows] } : undefined,
      assumptions: scenario.assumptions // Use the scenario's stored assumptions, not the current ones
    };
  }

  private parseTags(line: string): string[] {
    return line.split(/\s+/).filter(tag => tag.startsWith('@'));
  }

  private isStepLine(line: string): boolean {
    const keywords = ['Given', 'When', 'Then', 'And', 'But'];
    return keywords.some(keyword => line.startsWith(keyword + ' '));
  }

  private parseStep(line: string): Step {
    const keywords: StepKeyword[] = ['Given', 'When', 'Then', 'And', 'But'];
    
    for (const keyword of keywords) {
      if (line.startsWith(keyword + ' ')) {
        return {
          keyword,
          text: line.substring(keyword.length + 1)
        };
      }
    }
    
    throw new Error(`Invalid step line: ${line}`);
  }

  private parseExamples(lines: string[], startIndex: number): ExamplesTable {
    const headers: string[] = [];
    const rows: string[][] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '' || !line.startsWith('|')) {
        break;
      }
      
      const cells = line.split('|')
        .slice(1, -1); // Remove empty first and last elements - preserve whitespace in cells
      
      if (headers.length === 0) {
        headers.push(...cells);
      } else {
        rows.push([...cells]);
      }
    }
    
    return { headers: [...headers], rows };
  }

  private inferScenarioType(tags: string[]): ScenarioType {
    if (tags.some(tag => tag.includes('smoke'))) return 'happy';
    if (tags.some(tag => tag.includes('negative'))) return 'negative';
    if (tags.some(tag => tag.includes('regression'))) return 'edge';
    return 'happy'; // default
  }

  private generateScenarioId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private extractStoryId(scenarios: Scenario[]): string {
    for (const scenario of scenarios) {
      for (const tag of scenario.tags) {
        if (tag.match(/^@[A-Z]+-\d+$/)) {
          return tag.substring(1);
        }
      }
    }
    return 'UNKNOWN';
  }

  private validateSyntax(feature: Feature, scenarios: Scenario[]): void {
    if (!feature.title) {
      throw new Error('Feature must have a title');
    }
    
    if (scenarios.length === 0) {
      throw new Error('Feature must have at least one scenario');
    }
    
    for (const scenario of scenarios) {
      if (!scenario.title) {
        throw new Error('Scenario must have a title');
      }
      
      if (scenario.steps.length === 0) {
        throw new Error('Scenario must have at least one step');
      }
    }
  }
}