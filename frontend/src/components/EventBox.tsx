import React, { useState } from 'react';
import { EventRole } from '@/types/event';
import type { EventModel, PartsModel, FunctionCallModel, FunctionResponseModel } from '@/types/event';

// Base EventBox Props
interface BaseEventBoxProps {
  event: EventModel;
  className?: string;
}

// Base EventBox Component
const BaseEventBox: React.FC<BaseEventBoxProps & { children: React.ReactNode }> = ({
  event,
  className = '',
  children
}) => {

  return (
    <div className={`mb-4 ${className}`} id={`event-${event.id}`}>
      <div className="rounded-lg backdrop-blur-md border border-white/20 shadow-lg">
        {children}
      </div>
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

// Parts Renderer Component
const PartsRenderer: React.FC<{ parts: PartsModel[] }> = ({ parts }) => (
  <div className="space-y-2">
    {parts.map((part, index) => (
      <div key={index}>
        {part.text && <TextPart text={part.text} />}
        {part.function_call && <FunctionCallPart functionCall={part.function_call} />}
        {part.function_response && <FunctionResponsePart functionResponse={part.function_response} />}
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
