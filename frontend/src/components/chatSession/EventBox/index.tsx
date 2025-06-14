import React from 'react';
import { EventRole } from '@/types/event';
import type { BaseEventBoxProps } from './types';
import { BaseEventBox } from './BaseEventBox';
import { UserEventBox } from './UserEventBox';
import { ModelEventBox } from './ModelEventBox';
import { PartsRenderer } from './PartsRenderer';

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
          <PartsRenderer parts={event.content.parts} />
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
export { BaseEventBox, UserEventBox, ModelEventBox, PartsRenderer };
