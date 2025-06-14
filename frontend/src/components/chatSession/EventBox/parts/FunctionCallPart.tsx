import React, { useState } from 'react';
import type { FunctionCallModel } from '@/types/event';

export const FunctionCallPart: React.FC<{ functionCall: FunctionCallModel }> = ({ functionCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg mb-3">
      {/* Clickable Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-500/30 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-300">🔧</span>
          <span className="font-semibold text-blue-200">{functionCall.name}</span>
          <span className="text-xs text-blue-200 bg-blue-400/20 backdrop-blur-sm px-2 py-1 rounded-full border border-blue-400/30">Function Call</span>
        </div>
        <span className="text-blue-200">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <div>
            <div className="text-sm font-medium text-gray-200 mb-1">Arguments:</div>
            <pre className="bg-gray-900/70 backdrop-blur-sm text-green-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
              {JSON.stringify(functionCall.args, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
