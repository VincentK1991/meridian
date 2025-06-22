interface StatusProps {
  sessionCount: number;
}

export default function Status({ sessionCount }: StatusProps) {
  return (
    <div className="liquid-glass-card p-6">
      <h2 className="text-2xl font-semibold text-white mb-6">System Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="liquid-glass-surface flex items-center justify-between p-4">
            <span className="text-white/90 font-medium">Connection Status</span>
            <span className="flex items-center text-green-400">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Connected
            </span>
          </div>
          <div className="liquid-glass-surface flex items-center justify-between p-4">
            <span className="text-white/90 font-medium">AI Assistant</span>
            <span className="flex items-center text-green-400">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Active
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="liquid-glass-surface flex items-center justify-between p-4">
            <span className="text-white/90 font-medium">Last Activity</span>
            <span className="text-white">Just now</span>
          </div>
          <div className="liquid-glass-surface flex items-center justify-between p-4">
            <span className="text-white/90 font-medium">Total Sessions</span>
            <span className="text-white font-semibold">{sessionCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
