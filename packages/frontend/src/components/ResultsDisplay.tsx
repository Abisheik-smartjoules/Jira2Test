import { Download, CheckCircle, FileText, Tag, Hash } from 'lucide-react';
import { highlightGherkin } from '../lib/prism';
import type { FeatureFile, SyncResults } from '../types';

interface ResultsDisplayProps {
  featureFile: FeatureFile;
  syncResults: SyncResults;
  onDownload: () => void;
}

export function ResultsDisplay({
  featureFile,
  syncResults,
  onDownload,
}: ResultsDisplayProps): JSX.Element {
  // Format the feature file content for display
  const formatFeatureFile = (featureFile: FeatureFile): string => {
    const lines: string[] = [];
    
    // Feature header
    lines.push(`Feature: ${featureFile.feature.title}`);
    if (featureFile.feature.description.length > 0) {
      lines.push('');
      featureFile.feature.description.forEach(desc => lines.push(`  ${desc}`));
    }
    
    // Scenarios
    featureFile.scenarios.forEach(scenario => {
      lines.push('');
      if (scenario.acReference) {
        lines.push(`  # ${scenario.acReference}`);
      }
      scenario.assumptions?.forEach(assumption => {
        lines.push(`  # ASSUMPTION: ${assumption}`);
      });
      
      const tags = scenario.tags.join(' ');
      lines.push(`  ${tags}`);
      lines.push(`  Scenario: ${scenario.title}`);
      
      scenario.steps.forEach(step => {
        lines.push(`    ${step.keyword} ${step.text}`);
      });
      
      if (scenario.examples) {
        lines.push('');
        lines.push('    Examples:');
        const headers = `| ${scenario.examples.headers.join(' | ')} |`;
        lines.push(`      ${headers}`);
        scenario.examples.rows.forEach(row => {
          const rowStr = `| ${row.join(' | ')} |`;
          lines.push(`      ${rowStr}`);
        });
      }
    });
    
    return lines.join('\n');
  };

  const featureContent = formatFeatureFile(featureFile);
  const highlightedContent = highlightGherkin(featureContent);

  return (
    <div className="space-y-6">
      {/* Success Message and Download */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Generation Complete!
              </h3>
              <p className="text-sm text-gray-600">
                Feature file generated successfully with {featureFile.scenarios.length} scenarios
              </p>
            </div>
          </div>
          <button
            onClick={onDownload}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download .feature File</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Sync Results */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Google Sheets Synchronization
        </h4>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-800">
              Successfully synced to Google Sheets
            </span>
          </div>
          <p className="text-sm text-green-700">
            Added {syncResults.rowsAdded} new test scenarios
            {syncResults.rowsSkipped > 0 && ` (${syncResults.rowsSkipped} duplicates skipped)`}
          </p>
        </div>
      </div>

      {/* Scenario Summary Table */}
      <div className="card">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Scenario Summary
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Case ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AC Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncResults.scenarios.map((scenario, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {scenario.testCaseId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {scenario.scenarioTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {scenario.tags.split(' ').filter(tag => tag.startsWith('@')).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Hash className="h-3 w-3 mr-1" />
                      {scenario.acReference}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      scenario.status === 'Not Executed' ? 'bg-gray-100 text-gray-800' :
                      scenario.status === 'Passed' ? 'bg-green-100 text-green-800' :
                      scenario.status === 'Failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {scenario.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature File Content */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-5 w-5 text-gray-500" />
          <h4 className="text-md font-semibold text-gray-900">
            Generated Feature File
          </h4>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 overflow-x-auto">
          <pre 
            className="text-sm font-mono" 
            style={{ 
              fontFamily: "'Fira Code', 'JetBrains Mono', 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace",
              fontSize: '14px',
              lineHeight: '1.7',
              WebkitFontSmoothing: 'subpixel-antialiased',
              MozOsxFontSmoothing: 'auto',
              textRendering: 'optimizeLegibility',
              fontFeatureSettings: '"liga" 1, "calt" 1',
              color: '#1e293b',
            }}
          >
            <code
              className="language-gherkin"
              style={{
                textShadow: 'none',
                fontWeight: '400',
                color: '#1e293b',
              }}
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}