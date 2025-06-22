import { useCreateSession } from '../../hooks/useSession';
import type { Session } from '../../types/session';
import { useQueryClient } from '@tanstack/react-query';

interface SessionTabsProps {
    sessions: Session[];
    activeSessionId: string;
    onSessionSelect: (sessionId: string) => void;
    onSessionClose?: (sessionId: string) => void;
    sessionsLoading: boolean;
    userId: string;
}

export default function SessionTabs({
    sessions,
    activeSessionId,
    onSessionSelect,
    onSessionClose,
    sessionsLoading,
    userId
}: SessionTabsProps) {
    const createSessionMutation = useCreateSession();
    const queryClient = useQueryClient();

    const handleNewSession = async () => {
        try {
            const result = await createSessionMutation.mutateAsync();

            // Create a temporary session object to add to the list immediately
            const newSession: Session = {
                id: result.session_id,
                create_time: new Date(),
                update_time: new Date(),
                title: ''
            };

            // Optimistically update the sessions cache
            queryClient.setQueryData(['sessions', userId], (oldSessions: Session[] | undefined) => {
                return oldSessions ? [newSession, ...oldSessions] : [newSession];
            });

            // Set the new session as active
            onSessionSelect(result.session_id);
        } catch (error) {
            console.error('Failed to create new session:', error);
        }
    };

    return (
        <div className="w-64 border-r border-white/10 flex flex-col h-full liquid-refraction">
            {/* New Session Button */}
            <div className="p-4 border-b border-white/10 flex-shrink-0">
                <button
                    onClick={handleNewSession}
                    disabled={createSessionMutation.isPending}
                    className="liquid-glass-button liquid-specular w-full px-4 py-2 text-md text-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {createSessionMutation.isPending ? 'Creating...' : '+ New Session'}
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {sessionsLoading ? (
                    <div className="p-4 text-zinc-700/80">Loading sessions...</div>
                ) : sessions.length > 0 ? (
                    <div className="space-y-1 p-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`
                                    liquid-glass-session-tab w-full px-3 py-3 cursor-pointer transition-all border-l-2 mb-2
                                    ${session.id === activeSessionId
                                        ? 'active text-indigo-800 border-indigo-400'
                                        : 'text-zinc-700/90 border-transparent hover:text-indigo-800 hover:border-white/30'
                                    }
                                `}
                                onClick={() => onSessionSelect(session.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="truncate text-sm font-medium">
                                        {session.title || `Session ${session.id.slice(0, 8)}...`}
                                    </span>
                                    {onSessionClose && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSessionClose(session.id);
                                            }}
                                            className="text-zinc-700/60 hover:text-red-400 transition-colors ml-2 hover:bg-red-500/20 rounded px-1"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                <div className={`text-xs mt-1 ${
                                    session.id === activeSessionId ? 'text-zinc-700/80' : 'text-zinc-700/60'
                                }`}>
                                    {new Date(session.update_time).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-zinc-700/80 text-center">
                        <p>No sessions yet</p>
                        <p className="text-xs mt-1 text-zinc-700/60">Click "New Session" to start</p>
                    </div>
                )}
            </div>
        </div>
    );
}
