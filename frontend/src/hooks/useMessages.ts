import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../api/messageService';
import type { ConversationRequest } from '../types/conversationRequest';


export const useMessages = (session_id: string) => {
    const queryClient = useQueryClient();
    const { data: agents } = useQuery({
        queryKey: ['agents', session_id],
        queryFn: () => messageService.getAgents(session_id),
        enabled: !!session_id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: 1000 * 60 * 5, // 5 minutes
        refetchIntervalInBackground: false,
    });

    const { mutate: sendMessage } = useMutation({
        mutationFn: (request: ConversationRequest) => {
            console.log('request', request);
            return messageService.sendMessage(session_id, request);
        },
        onSuccess: () => {
            console.log('sendMessage success');
            queryClient.invalidateQueries({ queryKey: ['session', session_id] });
        },
    });

    return { agents, sendMessage };
}
