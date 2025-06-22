interface User {
  name: string;
  email: string;
  user_id: string;
}

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  return (
    <div className="liquid-glass-card p-6">
      <h2 className="text-2xl font-semibold text-white mb-6">User Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="liquid-glass-surface p-4">
            <span className="text-white/70 text-sm block mb-1">Full Name</span>
            <p className="text-white font-medium">{user.name}</p>
          </div>
          <div className="liquid-glass-surface p-4">
            <span className="text-white/70 text-sm block mb-1">Email Address</span>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="liquid-glass-surface p-4">
            <span className="text-white/70 text-sm block mb-1">User ID</span>
            <p className="text-white font-mono text-sm break-all">{user.user_id}</p>
          </div>
          <div className="liquid-glass-surface p-4">
            <span className="text-white/70 text-sm block mb-1">Account Status</span>
            <span className="inline-flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
