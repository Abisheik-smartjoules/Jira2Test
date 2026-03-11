import { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { TabSelector } from '../components/TabSelector';
import { IssueBoard } from '../components/IssueBoard';
import { GenerationForm } from '../components/GenerationForm';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { useIssues } from '../hooks/useIssues';
import { useGeneration } from '../hooks/useGeneration';
import type { IssueFilters, GenerateResponse, IssueType } from '../types';

export function HomePage(): JSX.Element {
  // Tab state
  const [activeTab, setActiveTab] = useState<'stories' | 'tasks'>('stories');
  
  // Separate selection states for stories and tasks
  const [selectedStoryId, setSelectedStoryId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  // Shared filters state (preserved across tab switches)
  const [filters, setFilters] = useState<IssueFilters>({
    status: 'All',
    search: '',
    assignees: [],
  });
  
  const [generationResult, setGenerationResult] = useState<GenerateResponse | null>(null);
  
  // Ref for the results container to enable auto-scroll
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch issues based on active tab
  const { data: issues = [], isLoading, error: issuesError } = useIssues({ 
    issueType: activeTab === 'stories' ? 'story' : 'task' 
  });
  
  const { mutate: generateFeatureFile, isPending: isGenerating, error: generationError } = useGeneration();

  // Get the currently selected issue ID based on active tab
  const selectedIssueId = activeTab === 'stories' ? selectedStoryId : selectedTaskId;

  // Handle tab change: clear selection, preserve filters
  const handleTabChange = (tab: 'stories' | 'tasks') => {
    setActiveTab(tab);
    // Clear selections when switching tabs
    setSelectedStoryId('');
    setSelectedTaskId('');
    // Filters are preserved automatically
    setGenerationResult(null);
  };

  // Handle issue selection based on active tab
  const handleIssueSelect = (issueId: string) => {
    if (activeTab === 'stories') {
      setSelectedStoryId(issueId);
    } else {
      setSelectedTaskId(issueId);
    }
    setGenerationResult(null);
  };

  const handleGenerate = (issueId: string) => {
    const issueType: IssueType = activeTab === 'stories' ? 'story' : 'task';
    
    generateFeatureFile({ 
      issueId, 
      issueType 
    }, {
      onSuccess: (data) => {
        setGenerationResult(data);
      },
      onError: (error) => {
        console.error('Generation failed:', error);
      },
    });
  };

  // Auto-scroll to results when generation completes
  useEffect(() => {
    if (generationResult && resultsRef.current) {
      // Small delay to ensure the DOM has updated and animations have started
      const timeoutId = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [generationResult]);

  const handleDownload = () => {
    if (!generationResult) return;
    
    const issueId = generationResult.featureFile.metadata.storyId;
    const featureName = generationResult.featureFile.feature.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    window.open(`/api/download/${issueId}?filename=${issueId}_${featureName}.feature`, '_blank');
  };

  if (issuesError) {
    const errorTitle = activeTab === 'stories' ? 'Error Loading Stories' : 'Error Loading Tasks';
    const errorMessage = issuesError.message || `Failed to load Jira ${activeTab}. Please try again.`;
    
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-red-600 mb-4">
          {errorTitle}
        </h2>
        <p className="text-gray-600">
          {errorMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="card-elevated">
        <div className="flex items-start space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl shadow-lg">
            <Play className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Generate Gherkin Feature Files
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Select a Jira {activeTab === 'stories' ? 'story' : 'task'} from the board below or enter an ID manually to generate 
              domain-aware Gherkin feature files with comprehensive test scenarios.
            </p>
          </div>
        </div>
        
        <GenerationForm
          selectedStoryId={selectedIssueId}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          error={generationError}
          issueType={activeTab === 'stories' ? 'story' : 'task'}
        />
      </div>

      <TabSelector
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <IssueBoard
        issues={issues}
        issueType={activeTab === 'stories' ? 'story' : 'task'}
        onIssueSelect={handleIssueSelect}
        filters={filters}
        onFilterChange={setFilters}
        isLoading={isLoading}
        selectedIssueId={selectedIssueId}
      />

      {generationResult && (
        <div ref={resultsRef} className="animate-slide-up">
          <ResultsDisplay
            featureFile={generationResult.featureFile}
            syncResults={generationResult.syncResults}
            onDownload={handleDownload}
          />
        </div>
      )}
    </div>
  );
}