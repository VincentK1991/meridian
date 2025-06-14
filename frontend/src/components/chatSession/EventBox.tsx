import React, { useState } from 'react';
import { EventRole } from '@/types/event';
import type { EventModel, PartsModel, FunctionCallModel, FunctionResponseModel, GroundingMetadata, CodeExecutionModel, CodeExecutionResultModel } from '@/types/event';

// Base EventBox Props
interface BaseEventBoxProps {
  event: EventModel;
  className?: string;
}

// Tab Component
const Tab: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
  <button
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-white/10 text-white border border-white/20'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Base EventBox Component
const BaseEventBox: React.FC<BaseEventBoxProps & { children: React.ReactNode }> = ({
  event,
  className = '',
  children
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'metadata'>('content');
  const hasMetadata = event.grounding_metadata !== null;

  return (
    <div className={`mb-4 ${className}`} id={`event-${event.id}`}>
      <div className="rounded-lg backdrop-blur-md border border-white/20 shadow-lg">
        {/* Tabs */}
        {hasMetadata && (
          <div className="flex gap-2 p-4 border-b border-white/20">
            <Tab isActive={activeTab === 'content'} onClick={() => setActiveTab('content')}>
              Content
            </Tab>
            <Tab isActive={activeTab === 'metadata'} onClick={() => setActiveTab('metadata')}>
              Metadata
            </Tab>
          </div>
        )}

        {/* Content */}
        {activeTab === 'content' && children}

        {/* Metadata */}
        {activeTab === 'metadata' && hasMetadata && (
          <div className="p-4">
            <MetadataContent metadata={event.grounding_metadata!} />
          </div>
        )}
      </div>
    </div>
  );
};

// Metadata Content Component
const MetadataContent: React.FC<{ metadata: GroundingMetadata }> = ({ metadata }) => {
  const [activeMetadataTab, setActiveMetadataTab] = useState<'overview' | 'rendered'>('overview');

  return (
    <div className="space-y-4">
      {/* Metadata Tabs */}
      <div className="flex gap-2">
        <Tab isActive={activeMetadataTab === 'overview'} onClick={() => setActiveMetadataTab('overview')}>
          Overview
        </Tab>
        {metadata.search_entry_point?.rendered_content && (
          <Tab isActive={activeMetadataTab === 'rendered'} onClick={() => setActiveMetadataTab('rendered')}>
            Rendered Content
          </Tab>
        )}
      </div>

      {/* Metadata Content */}
      {activeMetadataTab === 'overview' && (
        <div className="space-y-4">
          {metadata.grounding_chunks && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Grounding Chunks</h3>
              <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
                {JSON.stringify(metadata.grounding_chunks, null, 2)}
              </pre>
            </div>
          )}
          {metadata.grounding_supports && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Grounding Supports</h3>
              <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
                {JSON.stringify(metadata.grounding_supports, null, 2)}
              </pre>
            </div>
          )}
          {metadata.retrieval_metadata && (
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Retrieval Metadata</h3>
              <pre className="bg-gray-900/70 backdrop-blur-sm text-gray-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
                {JSON.stringify(metadata.retrieval_metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Rendered Content */}
      {activeMetadataTab === 'rendered' && metadata.search_entry_point?.rendered_content && (
        <div className="prose prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: typeof metadata.search_entry_point.rendered_content === 'string'
                ? metadata.search_entry_point.rendered_content
                : JSON.stringify(metadata.search_entry_point.rendered_content)
            }}
          />
        </div>
      )}
    </div>
  );
};

// Text Part Component
const TextPart: React.FC<{ text: string }> = ({ text }) => (
  <div className="prose prose-sm max-w-none">
    <p className="mb-0 whitespace-pre-wrap">{text}</p>
  </div>
);

// Function Call Part Component
const FunctionCallPart: React.FC<{ functionCall: FunctionCallModel }> = ({ functionCall }) => {
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
          {/* <div className="text-xs text-gray-300">
            <span className="font-medium">ID:</span> <code className="bg-gray-800/50 backdrop-blur-sm px-1 py-0.5 rounded text-xs border border-gray-600/50">{functionCall.id}</code>
          </div> */}
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

// Function Response Part Component
const FunctionResponsePart: React.FC<{ functionResponse: FunctionResponseModel }> = ({ functionResponse }) => {
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
          {/* <div className="text-xs text-gray-300">
            <span className="font-medium">ID:</span> <code className="bg-gray-800/50 backdrop-blur-sm px-1 py-0.5 rounded text-xs border border-gray-600/50">{functionResponse.id}</code>
          </div> */}
          <div>
            <div className="text-sm font-medium text-gray-200 mb-1">Response:</div>
            <pre className="bg-gray-900/70 backdrop-blur-sm text-green-300 p-3 rounded-md text-sm overflow-x-auto border border-gray-700/50">
              {JSON.stringify(functionResponse.response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Code Execution Part Component
const CodeExecutionPart: React.FC<{ codeExecution: CodeExecutionModel }> = ({ codeExecution }) => {
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

// Code Execution Result Part Component
const CodeExecutionResultPart: React.FC<{ result: CodeExecutionResultModel }> = ({ result }) => {
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

// Parts Renderer Component
const PartsRenderer: React.FC<{ parts: PartsModel[] }> = ({ parts }) => (
  <div className="space-y-2">
    {parts.map((part, index) => (
      <div key={index}>
        {part.text && <TextPart text={part.text} />}
        {part.function_call && <FunctionCallPart functionCall={part.function_call} />}
        {part.function_response && <FunctionResponsePart functionResponse={part.function_response} />}
        {part.executable_code && <CodeExecutionPart codeExecution={part.executable_code} />}
        {part.code_execution_result && <CodeExecutionResultPart result={part.code_execution_result} />}
      </div>
    ))}
  </div>
);

// User EventBox Component
const UserEventBox: React.FC<BaseEventBoxProps> = ({ event, className = '' }) => (
  <BaseEventBox event={event} className={`ml-auto w-4/5 ${className}`}>
    <div className="bg-blue-600/20 backdrop-blur-md text-white p-4 rounded-lg border border-blue-400/30">
      <div className="text-white text-right">
        <PartsRenderer parts={event.content.parts} />
      </div>
    </div>
  </BaseEventBox>
);

// Model EventBox Component
const ModelEventBox: React.FC<BaseEventBoxProps> = ({ event, className = '' }) => (
  <BaseEventBox event={event} className={`mr-auto w-4/5 ${className}`}>
    <div className="bg-white/5 backdrop-blur-md border border-white/20 p-4 rounded-lg">
      <div className="text-gray-100 text-left">
        <PartsRenderer parts={event.content.parts} />
      </div>
    </div>
  </BaseEventBox>
);

// Main EventBox Component
const EventBox: React.FC<BaseEventBoxProps> = ({ event, className = '' }) => {
  // Check if this event contains only function calls or responses (no text)
  const hasOnlyFunctionParts = event.content.parts.every(part =>
    part.function_call || part.function_response
  );

  // If it's only function parts, render them directly without wrapper
  if (hasOnlyFunctionParts) {
    // Check if this event contains function responses (should always be left-aligned)
    const hasFunctionResponse = event.content.parts.some(part => part.function_response);

    // Function responses are always left-aligned, function calls follow role-based alignment
    const alignmentClass = hasFunctionResponse ? 'mr-auto' :
      (event.content.role === EventRole.USER ? 'ml-auto' : 'mr-auto');

    return (
      <div className={`mb-4 w-4/5 ${alignmentClass} ${className}`} id={`event-${event.id}`}>
        <div className="space-y-2">
          {event.content.parts.map((part, index) => (
            <div key={index}>
              {part.function_call && <FunctionCallPart functionCall={part.function_call} />}
              {part.function_response && <FunctionResponsePart functionResponse={part.function_response} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // For text messages, use the original wrapper logic
  switch (event.content.role) {
    case EventRole.USER:
      return <UserEventBox event={event} className={className} />;
    case EventRole.MODEL:
      return <ModelEventBox event={event} className={className} />;
    default:
      return (
        <BaseEventBox event={event} className={`${className}`}>
          <div className="bg-yellow-500/20 backdrop-blur-md border border-yellow-400/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-yellow-500/50 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-bold text-white border border-yellow-400/30">?</div>
              <span className="font-medium text-yellow-200">Unknown Role: {event.content.role}</span>
            </div>
            <div className="text-yellow-100">
              <PartsRenderer parts={event.content.parts} />
            </div>
          </div>
        </BaseEventBox>
      );
  }
};

export default EventBox;
export { BaseEventBox, UserEventBox, ModelEventBox, TextPart, FunctionCallPart, FunctionResponsePart };
