export default function QuickActions() {
  return (
    <div className="liquid-glass-card p-6">
      <h2 className="text-2xl font-semibold text-white mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button className="liquid-glass-button liquid-specular p-6 text-left text-white">
          <h3 className="text-lg font-semibold mb-2">Start New Chat</h3>
          <p className="text-white/80 text-sm">Begin a new conversation with the AI assistant</p>
        </button>
        <button className="liquid-glass-button liquid-specular p-6 text-left text-white">
          <h3 className="text-lg font-semibold mb-2">View History</h3>
          <p className="text-white/80 text-sm">Browse your previous conversations and sessions</p>
        </button>
        <button className="liquid-glass-button liquid-specular p-6 text-left text-white">
          <h3 className="text-lg font-semibold mb-2">Settings</h3>
          <p className="text-white/80 text-sm">Customize your preferences and configurations</p>
        </button>
      </div>
    </div>
  );
}
