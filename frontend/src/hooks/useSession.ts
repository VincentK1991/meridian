import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../api/sessionService';

export const useSessions = (user_id: string) => {
    // Get sessions from localStorage as initial data

    return useQuery({
        queryKey: ['sessions', user_id],
        queryFn: () => sessionService.listSessions(user_id),
        enabled: !!user_id, // Only fetch when user_id is available
        staleTime: 1 * 60 * 1000, // 1 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        // initialData: getSessionsFromStorage(), // Use localStorage data as initial data
    });
};

export const useSession = (session_id: string) => {
    console.log('useSession called with:', session_id);

    const query = useQuery({
        queryKey: ['session', session_id],
        queryFn: () => {
            console.log('useSession queryFn executing for:', session_id);
            return sessionService.listSessionEvents(session_id);
        },
        enabled: !!session_id, // Only fetch when session_id is available
        //staleTime: 1 * 60 * 1000, // 1 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        // initialData: getSessionsFromStorage(), // Use localStorage data as initial data
    });

    console.log('useSession query state:', {
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        enabled: !!session_id,
        status: query.status,
        fetchStatus: query.fetchStatus
    });

    return query;
};

export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => sessionService.createSession(),
        onSuccess: (data) => {
            console.log('Session created successfully:', data);
            // Invalidate sessions query to refetch the list
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
        onError: (error) => {
            console.error('Error creating session:', error);
        }
    });
};

export const useDeleteSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (session_id: string) => sessionService.deleteSession(session_id),
        onSuccess: (data) => {
            console.log('Session deleted successfully:', data);
            // Invalidate sessions query to refetch the list
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
        onError: (error) => {
            console.error('Error deleting session:', error);
        }
    });
};
