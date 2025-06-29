import { createApiClient } from './baseApiClient';
import type { ConversationRequest } from '../types/conversationRequest';

const messageApiClient = createApiClient('/session');
export const messageService = {
    getAgents: async (session_id: string): Promise<string[]> => {
        const response = await messageApiClient.get(`/${session_id}/messages/agents`);
        return response.data;
    },
    sendMessage: async (session_id: string, request: ConversationRequest): Promise<string> => {
        const response = await messageApiClient.post(`/${session_id}/messages`, request);
        return response.data;
    },
}
