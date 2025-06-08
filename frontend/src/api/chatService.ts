import { createApiClient } from './baseApiClient';

// Create chat-specific API client
const chatApi = createApiClient('/chat');

// Chat-specific types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  messages: Message[];
}

// Chat API Functions
export const chatApiService = {
  // Get all chat sessions
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await chatApi.get('/sessions');
    return response.data;
  },

  // Create new chat session
  createSession: async (name: string): Promise<ChatSession> => {
    const response = await chatApi.post('/sessions', { name });
    return response.data;
  },

  // Send message to chat
  sendMessage: async (sessionId: string, content: string): Promise<Message> => {
    const response = await chatApi.post(`/sessions/${sessionId}/messages`, { content });
    return response.data;
  },

  // Get messages for a session
  getMessages: async (sessionId: string): Promise<Message[]> => {
    const response = await chatApi.get(`/sessions/${sessionId}/messages`);
    return response.data;
  },
};
