import React, { useState } from 'react';
import type { FunctionResponseModel } from '@/types/event';
import { FunctionResponseOutputRenderer } from './functionResponseStructuredOutput';

export const FunctionResponsePart: React.FC<{ functionResponse: FunctionResponseModel }> = ({ functionResponse }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-lg mb-3">
      {/* Clickable Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-green-500/30 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-green-300">✅</span>
          <span className="font-semibold text-green-200">{functionResponse.name} Response</span>
          <span className="text-xs text-green-200 bg-green-400/20 backdrop-blur-sm px-2 py-1 rounded-full border border-green-400/30">Function Response</span>
        </div>
        <span className="text-green-200">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {/* Expandable Content */}
      {isExpanded && functionResponse.response && (
        <div className="px-4 pb-4 space-y-2">
          <div>
            <div className="text-sm font-medium text-gray-200 mb-1">Response:</div>
            <div className="bg-gray-900/70 backdrop-blur-sm p-3 rounded-md border border-gray-700/50">
              <FunctionResponseOutputRenderer response={functionResponse.response} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
