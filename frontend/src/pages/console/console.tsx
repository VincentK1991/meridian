import { useCurrentUser, useLogout } from '../../hooks/useAuth';
import { useEffect, useState } from 'react';
import { ChatSessionContainer } from '../../components/chatSession';
import ConsoleNavBar from './consoleNavBar';
import Header from './header';
import Connection from '../../components/connection/connection';
import Status from '../../components/status/status';
import Profile from '../../components/profile/profile';

export default function ConsolePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const [activeView, setActiveView] = useState<string>('session');
  const logout = useLogout();

  useEffect(() => {
    console.log('Console page mounted, user data:', user);
  }, [user]);

    const renderContent = () => {
    switch (activeView) {
      case 'session':
        return (
          <ChatSessionContainer
            userId={user?.user_id || ''}
          />
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
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mt-2">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
