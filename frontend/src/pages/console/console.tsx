import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import ActiveSession from '../../components/chatSession/ActiveSession';
import InfiniteSessionTabs from '../../components/chatSession/InfiniteSessionTabs';
import ConsoleNavBar from './consoleNavBar';
import Header from './header';
import Connection from '../../components/connection/connection';
import Status from '../../components/status/status';
import Profile from '../../components/profile/profile';

export default function ConsolePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('session');
  const logout = useLogout();

  useEffect(() => {
    console.log('Console page mounted, user data:', user);
  }, [user]);

  const renderContent = () => {
    switch (activeView) {
      case 'session':
        return (
          <div className="liquid-glass-session h-[calc(100vh-200px)] flex overflow-hidden">
            {/* Session Tabs with Infinite Scrolling */}
            <InfiniteSessionTabs
              activeSessionId={activeSessionId}
              onSessionSelect={setActiveSessionId}
              onSessionClose={(sessionId) => {
                // Handle session close logic here
                console.log('Close session:', sessionId);
              }}
              userId={user?.user_id || ''}
              limit={10}
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
                      Welcome to Yurt! Your AI assistant is ready to help.
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
        return <Status sessionCount={0} />;

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
