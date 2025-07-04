import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../api/sessionService';
import type { Session, SessionUpdate } from '../types/session';

export const useInfiniteSessions = (user_id: string, limit: number = 10) => {
    return useInfiniteQuery({
        queryKey: ['sessions', 'infinite', user_id],
        queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
            return sessionService.listPaginatedSessions(limit, pageParam);
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: Session[], allPages: Session[][], lastPageParam: number) => {
            // If the last page is empty or has fewer items than the limit, we've reached the end
            if (!lastPage || lastPage.length === 0 || lastPage.length < limit) {
                return undefined;
            }

            // Calculate next offset
            return lastPageParam + limit;
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

    const updateSession = useMutation({
        mutationFn: ({ session_id, session_update }: { session_id: string; session_update: SessionUpdate }) =>
            sessionService.updateSession(session_id, session_update),
        onSuccess: (data) => {
            console.log('Session updated successfully:', data);
            // Invalidate infinite sessions query to refetch
            queryClient.invalidateQueries({ queryKey: ['sessions', 'infinite'] });
            // Also invalidate regular sessions query if it exists
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
        onError: (error) => {
            console.error('Error updating session:', error);
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
        updateSession,
        deleteSession,
    };
};
