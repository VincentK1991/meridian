import React, { useState } from 'react';
import type { CodeExecutionResultModel } from '@/types/event';

export const CodeExecutionResultPart: React.FC<{ result: CodeExecutionResultModel }> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSuccess = result.outcome === 'OUTCOME_OK';

  return (
    <div className={`${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'} backdrop-blur-sm border ${isSuccess ? 'border-green-400/30' : 'border-red-400/30'} rounded-lg mb-3`}>
      {/* Clickable Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-30 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className={isSuccess ? 'text-green-300' : 'text-red-300'}>
            {isSuccess ? '✅' : '❌'}
          </span>
          <span className={`font-semibold ${isSuccess ? 'text-green-200' : 'text-red-200'}`}>
            Code Execution Result
          </span>
          <span className={`text-xs ${isSuccess ? 'text-green-200 bg-green-400/20' : 'text-red-200 bg-red-400/20'} backdrop-blur-sm px-2 py-1 rounded-full border ${isSuccess ? 'border-green-400/30' : 'border-red-400/30'}`}>
            {result.outcome}
          </span>
        </div>
        <span className={isSuccess ? 'text-green-200' : 'text-red-200'}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
            {result.output}
          </pre>
        </div>
      )}
    </div>
  );
};
