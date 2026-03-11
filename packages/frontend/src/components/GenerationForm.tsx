import React, { useState, useEffect } from 'react';
import { Play, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import type { GenerationStatus, IssueType } from '../types';

interface GenerationFormProps {
  selectedStoryId?: string;
  onGenerate: (storyId: string) => void;
  isGenerating: boolean;
  error?: Error | null;
  issueType?: IssueType;
}

const STORY_ID_PATTERN = /^[A-Z]+-\d+$/;

const GENERATION_STEPS: Array<{ step: GenerationStatus['step']; message: string; duration: number }> = [
  { step: 'fetching', message: 'Fetching story details...', duration: 2000 },
  { step: 'context', message: 'Reading Morpheus codebase context...', duration: 4000 },
  { step: 'generating', message: 'Generating Gherkin scenarios...', duration: 4000 },
  { step: 'syncing', message: 'Syncing to Google Sheets...', duration: 2000 },
  { step: 'complete', message: 'Done! ✅', duration: 0 },
];

export function GenerationForm({
  selectedStoryId,
  onGenerate,
  isGenerating,
  error,
  issueType = 'story',
}: GenerationFormProps): JSX.Element {
  const [storyId, setStoryId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    step: 'idle',
    message: '',
  });

  // Auto-fill when story is selected from board
  useEffect(() => {
    if (selectedStoryId) {
      setStoryId(selectedStoryId);
      setValidationError('');
    }
  }, [selectedStoryId]);

  // Handle generation progress simulation
  useEffect(() => {
    if (!isGenerating) {
      setGenerationStatus({ step: 'idle', message: '' });
      return;
    }

    let currentStepIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const progressToNextStep = () => {
      if (currentStepIndex < GENERATION_STEPS.length) {
        const currentStep = GENERATION_STEPS[currentStepIndex];
        setGenerationStatus({
          step: currentStep.step,
          message: currentStep.message,
        });

        if (currentStep.duration > 0 && currentStepIndex < GENERATION_STEPS.length - 1) {
          timeoutId = setTimeout(() => {
            currentStepIndex++;
            progressToNextStep();
          }, currentStep.duration);
        }
      }
    };

    progressToNextStep();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isGenerating]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setGenerationStatus({
        step: 'error',
        message: 'Generation failed',
        error: error.message,
      });
    }
  }, [error]);

  const validateStoryId = (id: string): string => {
    if (!id.trim()) {
      return `${issueType === 'story' ? 'Story' : 'Task'} ID is required`;
    }
    
    if (!STORY_ID_PATTERN.test(id.trim())) {
      return `${issueType === 'story' ? 'Story' : 'Task'} ID must be in format PROJECT-123 (e.g., PROJ-456)`;
    }
    
    return '';
  };

  const handleStoryIdChange = (value: string) => {
    setStoryId(value);
    // Only validate if there's a value or if we're trying to clear a previous error
    if (value.trim() || validationError) {
      const error = validateStoryId(value);
      setValidationError(error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedId = storyId.trim();
    const error = validateStoryId(trimmedId);
    
    if (error) {
      setValidationError(error);
      return;
    }
    
    onGenerate(trimmedId);
  };

  const canGenerate = storyId.trim() && !validationError && !isGenerating;

  const renderProgressStatus = () => {
    if (generationStatus.step === 'idle') return null;

    const isError = generationStatus.step === 'error';
    const isComplete = generationStatus.step === 'complete';

    return (
      <div className={`border rounded-lg p-4 ${
        isError ? 'bg-red-50 border-red-200' : 
        isComplete ? 'bg-green-50 border-green-200' : 
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-3">
          {isError ? (
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          ) : isComplete ? (
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
          )}
          
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              isError ? 'text-red-800' : 
              isComplete ? 'text-green-800' : 
              'text-blue-800'
            }`}>
              {generationStatus.message}
            </p>
            
            {isError && generationStatus.error && (
              <p className="text-sm text-red-600 mt-1">
                {generationStatus.error}
              </p>
            )}
            
            {!isError && !isComplete && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${((GENERATION_STEPS.findIndex(s => s.step === generationStatus.step) + 1) / GENERATION_STEPS.length) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Step {GENERATION_STEPS.findIndex(s => s.step === generationStatus.step) + 1} of {GENERATION_STEPS.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="storyId" className="block text-sm font-medium text-gray-700 mb-2">
          Jira {issueType === 'story' ? 'Story' : 'Task'} ID
        </label>
        <div className="relative">
          <input
            id="storyId"
            type="text"
            value={storyId}
            onChange={(e) => handleStoryIdChange(e.target.value)}
            placeholder="e.g., PROJ-123"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              validationError ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isGenerating}
          />
          {validationError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-400" data-testid="alert-icon" />
            </div>
          )}
        </div>
        {validationError && (
          <p className="mt-1 text-sm text-red-600">{validationError}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Enter a Jira {issueType} ID or select a {issueType} from the board below
        </p>
      </div>

      {error && generationStatus.step !== 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Generation Failed</h4>
              <p className="text-sm text-red-700 mt-1">
                {error.message || 'An unexpected error occurred during generation.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {renderProgressStatus()}

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={!canGenerate}
          className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
            canGenerate
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Generate Feature File</span>
            </>
          )}
        </button>

        {isGenerating && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>This may take up to 60 seconds...</span>
          </div>
        )}
      </div>
    </form>
  );
}