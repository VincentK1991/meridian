import React from 'react';
import { useSession } from '../../hooks/useSession';
import EventBox from './EventBox';

interface ActiveSessionProps {
  sessionId: string;
  className?: string;
}

const ActiveSession: React.FC<ActiveSessionProps> = ({ sessionId, className = '' }) => {
  const {
    data: events,
    isLoading,
    isError,
    error,
    refetch
  } = useSession(sessionId);

  if (!sessionId) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">No Session Selected</h3>
          <p className="text-sm">Select a session from the tabs above to view the conversation</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-red-400">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Error Loading Events</h3>
          <p className="text-sm mb-4">{error?.message || 'Failed to load session events'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
          <p className="text-sm">This session doesn't have any events yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4">
          {/* Session Header */}
          <div className="mb-6 pb-4 border-b border-gray-600 flex-shrink-0">
            <h2 className="text-xl font-semibold text-white mb-2">
              Session Events
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Session ID: <code className="bg-gray-700 px-2 py-1 rounded text-xs">{sessionId}</code></span>
              <span>{events.length} event{events.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4 pb-4">
            {events.map((event) => (
              <EventBox
                key={event.id}
                event={event}
                className="transition-opacity hover:opacity-95"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;
