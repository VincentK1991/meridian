import { createApiClient } from './baseApiClient';
import type { EventModel } from '../types/event';
import type { Session, SessionCreate, SessionDelete, SessionUpdate } from '../types/session';

const sessionApiClient = createApiClient('/sessions');
export const sessionService = {

    listSessions: async (user_id: string): Promise<Session[]> => {
        const response = await sessionApiClient.get('');
        // Store sessions in localStorage with user-specific key
        const storageKey = `sessions-${user_id}`;
        localStorage.setItem(storageKey, JSON.stringify(response.data));
        return response.data;
    },

    listPaginatedSessions: async ( cursor?: string, limit: number = 10): Promise<Session[]> => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (cursor) {
            params.append('cursor', cursor);
        }

        const response = await sessionApiClient.get(`/paginated?${params.toString()}`);
        return response.data;
    },

    createSession: async (): Promise<SessionCreate> => {
        const response = await sessionApiClient.post('');
        return response.data;
    },

    getSessionById: async (session_id: string): Promise<Session> => {
        const response = await sessionApiClient.get(`/${session_id}`);
        return response.data;
    },

    listSessionEvents: async (session_id: string): Promise<EventModel[]> => {

        const response = await sessionApiClient.get(`/${session_id}/events`);
        return response.data;
    },

    updateSession: async (session_id: string, session_update: SessionUpdate): Promise<Session> => {
        const response = await sessionApiClient.put(`/${session_id}`, session_update);
        return response.data;
    },

    deleteSession: async (session_id: string): Promise<SessionDelete> => {
        const response = await sessionApiClient.delete(`/${session_id}`);
        return response.data;
    },

    // Helper function to get sessions from localStorage
    getSessionsFromStorage: (user_id: string): Session[] => {
        try {
            const storageKey = `sessions-${user_id}`;
            const storedSessions = localStorage.getItem(storageKey);
            return storedSessions ? JSON.parse(storedSessions) : [];
        } catch (error) {
            console.error('Error parsing sessions from localStorage:', error);
            return [];
        }
    },

    // Helper function to clear sessions from localStorage
    clearSessionsFromStorage: (user_id: string): void => {
        const storageKey = `sessions-${user_id}`;
        localStorage.removeItem(storageKey);
    },

    // Helper function to update a specific session in localStorage
    updateSessionInStorage: (user_id: string, sessionId: string, updates: Partial<Session>): void => {
        try {
            const sessions = sessionService.getSessionsFromStorage(user_id);
            const updatedSessions = sessions.map(session =>
                session.id === sessionId
                    ? { ...session, ...updates, update_time: new Date() }
                    : session
            );

            const storageKey = `sessions-${user_id}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedSessions));
        } catch (error) {
            console.error('Error updating session in localStorage:', error);
        }
    },

    // Helper function to add a new session to localStorage
    addSessionToStorage: (user_id: string, newSession: Session): void => {
        try {
            const sessions = sessionService.getSessionsFromStorage(user_id);
            const updatedSessions = [newSession, ...sessions]; // Add to top

            const storageKey = `sessions-${user_id}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedSessions));
        } catch (error) {
            console.error('Error adding session to localStorage:', error);
        }
    },

    // Helper function to remove a session from localStorage
    removeSessionFromStorage: (user_id: string, sessionId: string): void => {
        try {
            const sessions = sessionService.getSessionsFromStorage(user_id);
            const updatedSessions = sessions.filter(session => session.id !== sessionId);

            const storageKey = `sessions-${user_id}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedSessions));
        } catch (error) {
            console.error('Error removing session from localStorage:', error);
        }
    },
};

