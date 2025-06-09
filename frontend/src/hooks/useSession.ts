import { useQuery } from '@tanstack/react-query';
import { sessionApi } from '../api/sessionService';

export const useSessions = (user_id: string) => {
    // Get sessions from localStorage as initial data
    const getSessionsFromStorage = () => {
        if (!user_id) return [];
        return sessionApi.getSessionsFromStorage(user_id);
    };

    return useQuery({
        queryKey: ['sessions', user_id],
        queryFn: () => sessionApi.getSessions(user_id),
        enabled: !!user_id, // Only fetch when user_id is available
        staleTime: 1 * 60 * 1000, // 1 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        // initialData: getSessionsFromStorage(), // Use localStorage data as initial data
    });
};
