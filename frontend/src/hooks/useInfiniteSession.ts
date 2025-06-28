import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../api/sessionService';
import type { Session } from '../types/session';

export const useInfiniteSessions = (user_id: string, limit: number = 10) => {
    return useInfiniteQuery({
        queryKey: ['sessions', 'infinite', user_id],
        queryFn: async ({ pageParam }: { pageParam?: string }) => {
            return sessionService.listPaginatedSessions(pageParam, limit);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: Session[]) => {
            // If the last page is empty or has fewer items than the limit, we've reached the end
            if (!lastPage || lastPage.length === 0 || lastPage.length < limit) {
                return undefined;
            }

            // Use the update_time of the last session as the cursor for the next page
            // Important: Don't apply timezone conversion since database stores naive datetime
            const lastSession = lastPage[lastPage.length - 1];
            if (!lastSession?.update_time) return undefined;

            // Create cursor without timezone conversion by treating the datetime as UTC
            const updateTime = new Date(lastSession.update_time + 'Z'); // Add Z to treat as UTC
            return updateTime.toISOString();
        },
        enabled: !!user_id,
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });
};

// Helper hook to get all sessions as a flat array
export const useInfiniteSessionsFlat = (user_id: string, limit: number = 10) => {
    const query = useInfiniteSessions(user_id, limit);

    const allSessions = query.data?.pages?.flat() ?? [];

    return {
        ...query,
        sessions: allSessions,
        totalSessions: allSessions.length,
    };
};

// Hook for handling session mutations (create, delete, etc.) with infinite query invalidation
export const useSessionMutations = () => {
    const queryClient = useQueryClient();

    const createSession = useMutation({
        mutationFn: () => sessionService.createSession(),
        onSuccess: (data) => {
            console.log('Session created successfully:', data);
            // Invalidate infinite sessions query to refetch
            queryClient.invalidateQueries({ queryKey: ['sessions', 'infinite'] });
            // Also invalidate regular sessions query if it exists
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
        onError: (error) => {
            console.error('Error creating session:', error);
        }
    });

    const deleteSession = useMutation({
        mutationFn: (session_id: string) => sessionService.deleteSession(session_id),
        onSuccess: (data) => {
            console.log('Session deleted successfully:', data);
            // Invalidate infinite sessions query to refetch
            queryClient.invalidateQueries({ queryKey: ['sessions', 'infinite'] });
            // Also invalidate regular sessions query if it exists
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
        onError: (error) => {
            console.error('Error deleting session:', error);
        }
    });

    return {
        createSession,
        deleteSession,
    };
};
