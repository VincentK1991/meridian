import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSession';
import { useEffect, useState } from 'react';
import ActiveSession from '../../components/ActiveSession';

export default function ConsolePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const { data: sessions, isLoading: sessionsLoading } = useSessions(user?.user_id || '');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const logout = useLogout();

  // Sort sessions by update_time (most recent first) and set active session
  const sortedSessions = sessions
    ? [...sessions].sort((a, b) => new Date(b.update_time).getTime() - new Date(a.update_time).getTime())
    : [];

  // Set the first session as active when sessions load
  useEffect(() => {
    if (sortedSessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sortedSessions[0].id);
    }
  }, [sortedSessions, activeSessionId]);

  useEffect(() => {
    console.log('Console page mounted, user data:', user);
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Console page authentication error:', error);
    return null; // ProtectedRoute will handle the redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Meridian Console</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <button
                onClick={() => logout.mutate()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={logout.isPending}
              >
                {logout.isPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 text-sm">Name:</span>
                <p className="text-white">{user?.name}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Email:</span>
                <p className="text-white">{user?.email}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">User ID:</span>
                <p className="text-white font-mono text-xs">{user?.user_id}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Start New Chat
              </button>
              <button className="w-full px-4 py-2 text-left text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                View History
              </button>
              <button className="w-full px-4 py-2 text-left text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                Settings
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Connection</span>
                <span className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">AI Assistant</span>
                <span className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Activity</span>
                <span className="text-white">Just now</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Sessions</span>
                <span className="text-white">{sortedSessions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Tabs and Chat Area */}
        <div className="mt-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 h-[600px] flex overflow-hidden">
            {/* Vertical Session Tabs */}
            <div className="w-64 border-r border-gray-700 flex flex-col h-full">
              {/* New Session Button */}
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <button className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                  + New Session
                </button>
              </div>

              {/* Session List */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {sessionsLoading ? (
                  <div className="p-4 text-gray-400">Loading sessions...</div>
                ) : sortedSessions.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {sortedSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`
                          w-full px-3 py-3 rounded-lg cursor-pointer transition-colors border-l-2
                          ${session.id === activeSessionId
                            ? 'bg-gray-700 text-white border-blue-500'
                            : 'bg-transparent text-gray-400 border-transparent hover:bg-gray-700 hover:text-white'
                          }
                        `}
                        onClick={() => setActiveSessionId(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-medium">
                            {(session as any).session_name || `Session ${session.id.slice(0, 8)}...`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle close session
                            }}
                            className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                          >
                            ×
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(session.update_time).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-gray-400 text-center">
                    <p>No sessions yet</p>
                    <p className="text-xs mt-1">Click "New Session" to start</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">
                  {activeSessionId
                    ? `Session ${activeSessionId.slice(0, 8)}...`
                    : 'AI Assistant'
                  }
                </h2>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 bg-gray-900/50 min-h-0 overflow-hidden">
                {activeSessionId ? (
                  <ActiveSession sessionId={activeSessionId} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400 text-center">
                      Welcome to Meridian! Your AI assistant is ready to help.
                      <br />
                      <span className="text-sm">Select a session or create a new one to start chatting.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
