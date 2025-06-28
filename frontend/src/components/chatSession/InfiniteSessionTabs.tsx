import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteSessionsFlat, useSessionMutations } from '../../hooks/useInfiniteSession';

interface InfiniteSessionTabsProps {
    activeSessionId: string;
    onSessionSelect: (sessionId: string) => void;
    onSessionClose: (sessionId: string) => void;
    userId: string;
    limit?: number;
}

// Skeleton component for loading states
const SessionTabSkeleton = () => (
    <div className="w-full px-3 py-3 mb-2 animate-pulse">
        <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-600/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600/50 rounded w-4"></div>
        </div>
    </div>
);

export default function InfiniteSessionTabs({
    activeSessionId,
    onSessionSelect,
    userId,
    limit = 10
}: InfiniteSessionTabsProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

    const {
        sessions,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error,
        totalSessions
    } = useInfiniteSessionsFlat(userId, limit);

    const { createSession, deleteSession } = useSessionMutations();

    // Intersection Observer for infinite scrolling
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            console.log('Loading more sessions...');
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(observerCallback, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        const currentLoadMoreRef = loadMoreRef.current;
        if (currentLoadMoreRef) {
            observerRef.current.observe(currentLoadMoreRef);
        }

        return () => {
            if (observerRef.current && currentLoadMoreRef) {
                observerRef.current.unobserve(currentLoadMoreRef);
            }
        };
    }, [observerCallback]);

    const handleCreateSession = async () => {
        try {
            await createSession.mutateAsync();
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const handleDeleteClick = async (sessionId: string, sessionTitle: string) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${sessionTitle}"?`);
        if (!confirmed) return;

        try {
            setDeletingSessionId(sessionId);
            await deleteSession.mutateAsync(sessionId);

            // If the deleted session was active, select the first available session
            if (sessionId === activeSessionId && sessions.length > 1) {
                const remainingSessions = sessions.filter(s => s.id !== sessionId);
                if (remainingSessions.length > 0) {
                    onSessionSelect(remainingSessions[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        } finally {
            setDeletingSessionId(null);
        }
    };

    // Error state
    if (error) {
        return (
            <div className="liquid-glass-sidebar w-80 p-4 flex flex-col">
                <div className="text-red-400 text-center p-4">
                    <p>Error loading sessions</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="liquid-glass-sidebar w-80 flex flex-col">
            {/* Header with Create Button */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Sessions</h3>
                    <span className="text-sm text-gray-400">({totalSessions})</span>
                </div>
                <button
                    onClick={handleCreateSession}
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

            {/* Sessions List Container */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto min-h-0"
            >
                {/* Initial Loading State */}
                {isLoading ? (
                    <div className="p-2 space-y-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <SessionTabSkeleton key={index} />
                        ))}
                    </div>
                ) : sessions.length > 0 ? (
                    <>
                        <div className="space-y-1 p-2">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`
                                        liquid-glass-session-tab w-full px-3 py-3 cursor-pointer transition-all border-l-2 mb-2 relative
                                        ${session.id === activeSessionId
                                            ? 'active text-indigo-800 border-indigo-400'
                                            : 'text-zinc-700/90 border-transparent hover:text-indigo-800 hover:border-white/30'
                                        }
                                        ${deletingSessionId === session.id ? 'opacity-50 pointer-events-none' : ''}
                                    `}
                                    onClick={() => onSessionSelect(session.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="truncate text-sm font-medium">
                                            {session.title || `Session ${session.id.slice(0, 8)}...`}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {deletingSessionId === session.id && (
                                                <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(session.id, session.title);
                                                }}
                                                disabled={deletingSessionId === session.id}
                                                className="text-zinc-700/60 hover:text-red-400 transition-colors ml-2 hover:bg-red-500/20 rounded px-1 disabled:opacity-50"
                                                title="Delete session"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>

                                    {/* Session metadata */}
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(session.update_time).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Trigger */}
                        <div ref={loadMoreRef} className="h-4">
                            {isFetchingNextPage && (
                                <div className="p-2 space-y-1">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <SessionTabSkeleton key={`loading-${index}`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* End Message */}
                        {!hasNextPage && sessions.length > limit && (
                            <div className="text-center text-gray-500 text-xs py-4">
                                All sessions loaded
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center text-gray-400">
                            <p className="mb-2">No sessions yet</p>
                            <p className="text-sm">Create your first session to get started!</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
