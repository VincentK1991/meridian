import type { UseMutationResult } from '@tanstack/react-query';
import type { SessionCreate } from '../../../types/session';

interface SessionTabHeaderProps {
    totalSessions: number;
    createSession: UseMutationResult<SessionCreate, Error, void, unknown>;
    onCreateSession: () => void;
}

export const SessionTabHeader = ({
    totalSessions,
    createSession,
    onCreateSession
}: SessionTabHeaderProps) => {
    return (
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Sessions</h3>
                <span className="text-sm text-gray-400">({totalSessions})</span>
            </div>
            <button
                onClick={onCreateSession}
                disabled={createSession.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
                {createSession.isPending ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                    </>
                ) : (
                    <>
                        <span>+</span>
                        New Session
                    </>
                )}
            </button>
        </div>
    );
};
