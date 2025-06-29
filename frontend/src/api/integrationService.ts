import { createApiClient } from './baseApiClient'
import type { GoogleAuthUrlResponse, GoogleCallbackRequest } from './authService'

const integrationApiClient = createApiClient('/integration')

// Types for integration responses
export interface GoogleIntegrationUrlResponse {
  authorization_url: string;
}

export interface GoogleIntegrationStatusResponse {
  status: 'connected' | 'disconnected' | 'expired';
}

export interface GoogleIntegrationStatus {
  status: boolean;
  expires_at: string | null;
}

export interface GoogleIntegrationCallbackResponse {
  user_id: string;
  email: string;
  name: string;
}

// Google integration types
export type GoogleIntegrationType = 'drive' | 'calendar' | 'gmail';

export const integrationService = {
  // Get Google OAuth authorization URL for specific integration
  getGoogleIntegrationUrl: async (integrationType: GoogleIntegrationType): Promise<GoogleIntegrationUrlResponse> => {
    const response = await integrationApiClient.get(`/google/${integrationType}/url`)
    return response.data
  },

  // Handle Google OAuth callback for specific integration
  handleGoogleIntegrationCallback: async (
    integrationType: GoogleIntegrationType,
    callbackData: GoogleCallbackRequest
  ): Promise<GoogleIntegrationCallbackResponse> => {
    const response = await integrationApiClient.post(`/google/${integrationType}/callback`, callbackData)
    return response.data
  },

  // Check Google integration status
  checkGoogleIntegrationStatus: async (integrationType: GoogleIntegrationType): Promise<GoogleIntegrationStatus> => {
    const response = await integrationApiClient.get(`/google/${integrationType}/status`)
    return response.data
  },
}

// Legacy export for backwards compatibility
export const integrationApi = {
  getGoogleAuthUrl: async (): Promise<GoogleAuthUrlResponse> => {
    // Default to drive integration for backwards compatibility
    const response = await integrationService.getGoogleIntegrationUrl('drive')
    return { url: response.authorization_url }
  }
}
