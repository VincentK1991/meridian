import { createApiClient } from './baseApiClient';
import type { User } from './baseApiClient';

// Re-export User type for convenience
export type { User };

// Create Google OAuth specific API client
const googleApi = createApiClient('/auth/google');

// Create general auth API client
const authApiClient = createApiClient('/auth');

// Auth-specific types
export interface GoogleAuthUrlResponse {
  url: string;
}

export interface GoogleCallbackRequest {
  code: string;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Authentication API Functions
export const authApi = {
  // Get Google OAuth URL
  getGoogleAuthUrl: async (): Promise<GoogleAuthUrlResponse> => {
    const response = await googleApi.get('/url');
    return response.data;
  },

  // Handle Google OAuth callback
  googleCallback: async (data: GoogleCallbackRequest): Promise<TokenResponse> => {
    const response = await googleApi.post('/callback', data);
    return response.data;
  },

  // Get current user (protected route)
  getCurrentUser: async (): Promise<User> => {
    const response = await authApiClient.get('/me');
    localStorage.setItem('user-profile', JSON.stringify(response.data));
    return response.data;
  },

  // Logout (if you implement it later)
  logout: async (): Promise<void> => {
    await authApiClient.post('/logout');
  },
};
