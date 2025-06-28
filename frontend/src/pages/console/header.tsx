interface User {
  name: string;
  email: string;
  user_id: string;
}

interface HeaderProps {
  user: User;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function Header({ user, onLogout, isLoggingOut }: HeaderProps) {
  return (
    <header className="liquid-glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">Yurt Console</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user.name}</span>
            <button
              onClick={onLogout}
              className="liquid-glass-button-danger px-4 py-2 text-sm font-medium"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
