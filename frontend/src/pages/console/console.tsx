import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSession';
import { useEffect, useState } from 'react';
import ActiveSession from '../../components/chatSession/ActiveSession';
import SessionTabs from '../../components/chatSession/SessionTabs';
import ConsoleNavBar from './consoleNavBar';
import Header from './header';
import Connection from '../../components/connection/connection';
import Status from '../../components/status/status';
import Profile from '../../components/profile/profile';

export default function ConsolePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const { data: sessions, isLoading: sessionsLoading } = useSessions(user?.user_id || '');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('session');
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

  const renderContent = () => {
    switch (activeView) {
      case 'session':
        return (
          <div className="liquid-glass-session h-[calc(100vh-200px)] flex overflow-hidden">
            {/* Session Tabs */}
            <SessionTabs
              sessions={sortedSessions}
              activeSessionId={activeSessionId}
              onSessionSelect={setActiveSessionId}
              onSessionClose={(sessionId) => {
                // Handle session close logic here
                console.log('Close session:', sessionId);
              }}
              sessionsLoading={sessionsLoading}
              userId={user?.user_id || ''}
            />

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
        );

      case 'connection':
        return <Connection />;

      case 'status':
        return <Status sessionCount={sortedSessions.length} />;

      case 'profile':
        return user ? <Profile user={user} /> : null;

      default:
        return null;
    }
  };

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
        <div className="min-h-screen">
      {/* Header */}
      <Header
        user={user!}
        onLogout={() => logout.mutate()}
        isLoggingOut={logout.isPending}
      />

      {/* Navigation */}
      <ConsoleNavBar
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mt-2">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
