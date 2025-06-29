import { useEffect, useRef, useCallback } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Session, SessionUpdate } from '../../../types/session';
import { SessionTabItem } from './SessionTabItem';
import { SessionTabSkeleton } from './SessionTabSkeleton';

interface SessionTabListProps {
    sessions: Session[];
    activeSessionId: string;
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    error: Error | null;
    limit: number;
    onSessionSelect: (sessionId: string) => void;
    onSessionDelete: (sessionId: string, sessionTitle: string) => void;
    fetchNextPage: () => void;
    updateSession: UseMutationResult<Session, Error, { session_id: string; session_update: SessionUpdate }, unknown>;
}

export const SessionTabList = ({
    sessions,
    activeSessionId,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error,
    limit,
    onSessionSelect,
    onSessionDelete,
    fetchNextPage,
    updateSession,
}: SessionTabListProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Intersection Observer for infinite scrolling
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

    // Error state
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-red-400 text-center">
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
                            <SessionTabItem
                                key={session.id}
                                session={session}
                                isActive={session.id === activeSessionId}
                                onSelect={onSessionSelect}
                                onDelete={onSessionDelete}
                                updateSession={updateSession}
                            />
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
    );
};
