/**
 * Gherkin Formatter for converting FeatureFile objects into .feature file content
 */

import { FeatureFile, Scenario } from '@jira2test/shared';

export class GherkinFormatter {
  /**
   * Format a FeatureFile object into Gherkin content
   */
  format(featureFile: FeatureFile): string {
    const lines: string[] = [];
    
    // Feature tags
    if (featureFile.feature.tags.length > 0) {
      lines.push(featureFile.feature.tags.join(' '));
    }
    
    // Feature header
    lines.push(`Feature: ${featureFile.feature.title}`);
    
    // Feature description
    if (featureFile.feature.description.length > 0) {
      lines.push('');
      featureFile.feature.description.forEach(desc => {
        lines.push(`  ${desc}`);
      });
    }
    
    // Scenarios
    featureFile.scenarios.forEach(scenario => {
      lines.push('');
      this.formatScenario(scenario, lines);
    });
    
    return lines.join('\n');
  }

  private formatScenario(scenario: Scenario, lines: string[]): void {
    // AC Reference comment
    if (scenario.acReference) {
      lines.push(`  # ${scenario.acReference}`);
    }
    
    // Assumptions comments
    if (scenario.assumptions && scenario.assumptions.length > 0) {
      scenario.assumptions.forEach(assumption => {
        lines.push(`  # ASSUMPTION: ${assumption}`);
      });
    }
    
    // Scenario tags
    if (scenario.tags.length > 0) {
      lines.push(`  ${scenario.tags.join(' ')}`);
    }
    
    // Scenario header
    const scenarioType = scenario.examples ? 'Scenario Outline' : 'Scenario';
    lines.push(`  ${scenarioType}: ${scenario.title}`);
    
    // Steps
    scenario.steps.forEach(step => {
      lines.push(`    ${step.keyword} ${step.text}`);
    });
    
    // Examples table
    if (scenario.examples) {
      lines.push('');
      lines.push('    Examples:');
      
      // Headers - no spaces around separators to match parser expectations
      const headerRow = `|${scenario.examples.headers.join('|')}|`;
      lines.push(`      ${headerRow}`);
      
      // Data rows - no spaces around separators to match parser expectations
      scenario.examples.rows.forEach(row => {
        const dataRow = `|${row.join('|')}|`;
        lines.push(`      ${dataRow}`);
      });
    }
  }
}