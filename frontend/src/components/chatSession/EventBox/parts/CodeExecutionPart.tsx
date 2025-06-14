import React, { useState } from 'react';
import type { CodeExecutionModel } from '@/types/event';
import { Tab } from '../Tab';

export const CodeExecutionPart: React.FC<{ codeExecution: CodeExecutionModel }> = ({ codeExecution }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-lg mb-3">
      {/* Clickable Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-500/30 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-300">💻</span>
          <span className="font-semibold text-purple-200">Code Execution</span>
          <span className="text-xs text-purple-200 bg-purple-400/20 backdrop-blur-sm px-2 py-1 rounded-full border border-purple-400/30">
            {codeExecution.language}
          </span>
        </div>
        <span className="text-purple-200">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <pre className="bg-gray-900/70 backdrop-blur-sm text-purple-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
            {codeExecution.code}
          </pre>
        </div>
      )}
    </div>
  );
};
