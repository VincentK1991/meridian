import { useCurrentUser, useLogout } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function ConsolePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const logout = useLogout();

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
                <p className="text-white font-mono text-xs">{user?.id}</p>
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
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="mt-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 min-h-[400px] p-6">
            <h2 className="text-xl font-semibold text-white mb-4">AI Assistant</h2>
            <div className="flex-1 bg-gray-900/50 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
              <p className="text-gray-400 text-center">
                Welcome to Meridian! Your AI assistant is ready to help.
                <br />
                <span className="text-sm">Chat functionality coming soon...</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
