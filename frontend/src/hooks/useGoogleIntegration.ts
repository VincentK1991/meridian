import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService, type GoogleIntegrationType } from '../api/integrationService';
import type { GoogleCallbackRequest } from '../api/authService';
import { usePopupOAuth } from './usePopupOAuth';

// Query keys for Google integrations
export const GOOGLE_INTEGRATION_QUERY_KEYS = {
  all: ['googleIntegration'] as const,
  authUrl: (type: GoogleIntegrationType) => ['googleIntegration', 'authUrl', type] as const,
  status: (type: GoogleIntegrationType) => ['googleIntegration', 'status', type] as const,
  statuses: () => ['googleIntegration', 'statuses'] as const,
};

// Hook to get Google integration auth URL
export const useGoogleIntegrationAuthUrl = (integrationType: GoogleIntegrationType) => {
  return useQuery({
    queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.authUrl(integrationType),
    queryFn: () => integrationService.getGoogleIntegrationUrl(integrationType),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    enabled: false, // Don't auto-fetch
  });
};

// Hook to check Google integration status (auto-fetching)
export const useGoogleIntegrationStatus = (integrationType: GoogleIntegrationType) => {
  return useQuery({
    queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
    queryFn: async () => {
      const response = await integrationService.checkGoogleIntegrationStatus(integrationType);
      // Convert boolean status to string enum
      return {
        status: response.status ? 'connected' : 'disconnected' as 'connected' | 'disconnected' | 'expired',
        expires_at: response.expires_at
      };
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook to check Google integration status (lazy - only when manually triggered)
export const useGoogleIntegrationStatusLazy = (integrationType: GoogleIntegrationType) => {
  return useQuery({
    queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
    queryFn: async () => {
      const response = await integrationService.checkGoogleIntegrationStatus(integrationType);
      // Convert boolean status to string enum
      return {
        status: response.status ? 'connected' : 'disconnected' as 'connected' | 'disconnected' | 'expired',
        expires_at: response.expires_at
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: false, // Don't auto-fetch
  });
};

// Hook to check all Google integration statuses
export const useAllGoogleIntegrationStatuses = () => {
  const integrationTypes: GoogleIntegrationType[] = ['drive', 'calendar', 'gmail'];

  return useQuery({
    queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.statuses(),
    queryFn: async () => {
      const results = await Promise.allSettled(
        integrationTypes.map(async (type) => {
          const status = await integrationService.checkGoogleIntegrationStatus(type);
          return { type, ...status };
        })
      );

      return results.reduce((acc, result, index) => {
        const type = integrationTypes[index];
        if (result.status === 'fulfilled') {
          const apiResponse = result.value;
          // Convert boolean status to string enum
          const statusString = apiResponse.status ? 'connected' : 'disconnected';
          acc[type] = {
            type,
            status: statusString as 'connected' | 'disconnected' | 'expired',
            expires_at: apiResponse.expires_at
          };
        } else {
          acc[type] = { type, status: 'disconnected' as const };
        }
        return acc;
      }, {} as Record<GoogleIntegrationType, { type: GoogleIntegrationType; status: 'connected' | 'disconnected' | 'expired'; expires_at?: string | null }>);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

// Hook to handle Google integration callback
export const useGoogleIntegrationCallback = (integrationType: GoogleIntegrationType) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['googleIntegrationCallback', integrationType],
    mutationFn: (callbackData: GoogleCallbackRequest) =>
      integrationService.handleGoogleIntegrationCallback(integrationType, callbackData),
    retry: false,
    onSuccess: (data) => {
      console.log(`${integrationType} integration callback successful:`, data);

      // Invalidate and refetch the status for this integration
      queryClient.invalidateQueries({
        queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
      });

      // Invalidate all statuses to refresh the overview
      queryClient.invalidateQueries({
        queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.statuses(),
      });

      // Update the status cache optimistically
      queryClient.setQueryData(
        GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
        { status: 'connected' }
      );
    },
    onError: (error) => {
      console.error(`${integrationType} integration callback failed:`, error);
    },
  });
};

// Hook to initiate Google integration signin (legacy - redirects window)
export const useGoogleIntegrationSignin = (integrationType: GoogleIntegrationType) => {
  const { data: authUrlData, isLoading, error } = useGoogleIntegrationAuthUrl(integrationType);

  const startIntegration = () => {
    if (authUrlData?.authorization_url) {
      window.location.href = authUrlData.authorization_url;
    } else {
      console.error('No authorization URL available');
    }
  };

  return {
    startIntegration,
    isLoading,
    error,
    authUrl: authUrlData?.authorization_url,
  };
};

// Hook for popup-based OAuth integration
export const useGoogleIntegrationPopup = (integrationType: GoogleIntegrationType) => {
  const queryClient = useQueryClient();

  const popupOAuth = usePopupOAuth({
    integrationType,
    onSuccess: (result) => {
      console.log(`${integrationType} popup OAuth successful:`, result);

      if (result.success && result.data) {
        // The callback handler already called the backend API successfully
        // Now we just need to update the cache and invalidate queries
        console.log(`${integrationType} integration completed successfully:`, result.data);

        // Invalidate and refetch the status for this integration
        queryClient.invalidateQueries({
          queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
        });

        // Invalidate all statuses to refresh the overview
        queryClient.invalidateQueries({
          queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.statuses(),
        });

        // Update the status cache optimistically
        queryClient.setQueryData(
          GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
          { status: 'connected' }
        );
      } else {
        console.error(`${integrationType} integration failed:`, result);
      }
    },
    onError: (error) => {
      console.error(`${integrationType} popup OAuth failed:`, error);
    },
  });

  return popupOAuth;
};

// Enhanced convenience hooks for specific Google services with lazy loading
export const useGoogleDriveIntegration = () => {
  const statusQuery = useGoogleIntegrationStatus('drive');
  const popupOAuth = useGoogleIntegrationPopup('drive');

  const checkStatus = () => {
    statusQuery.refetch();
  };

  return {
    status: statusQuery.data?.status || 'disconnected',
    isConnected: statusQuery.data?.status === 'connected',
    isLoading: popupOAuth.isLoading,
    isCheckingStatus: statusQuery.isLoading,
    error: statusQuery.error || popupOAuth.error,
    startIntegration: popupOAuth.startOAuth,
    cancelIntegration: popupOAuth.cancelOAuth,
    isPopupOpen: popupOAuth.isPopupOpen,
    checkStatus,
    hasCheckedStatus: statusQuery.isFetched,
  };
};

export const useGoogleCalendarIntegration = () => {
  const statusQuery = useGoogleIntegrationStatus('calendar');
  const popupOAuth = useGoogleIntegrationPopup('calendar');

  const checkStatus = () => {
    statusQuery.refetch();
  };

  return {
    status: statusQuery.data?.status || 'disconnected',
    isConnected: statusQuery.data?.status === 'connected',
    isLoading: popupOAuth.isLoading,
    isCheckingStatus: statusQuery.isLoading,
    error: statusQuery.error || popupOAuth.error,
    startIntegration: popupOAuth.startOAuth,
    cancelIntegration: popupOAuth.cancelOAuth,
    isPopupOpen: popupOAuth.isPopupOpen,
    checkStatus,
    hasCheckedStatus: statusQuery.isFetched,
  };
};

export const useGmailIntegration = () => {
  const statusQuery = useGoogleIntegrationStatus('gmail');
  const popupOAuth = useGoogleIntegrationPopup('gmail');

  const checkStatus = () => {
    statusQuery.refetch();
  };

  return {
    status: statusQuery.data?.status || 'disconnected',
    isConnected: statusQuery.data?.status === 'connected',
    isLoading: popupOAuth.isLoading,
    isCheckingStatus: statusQuery.isLoading,
    error: statusQuery.error || popupOAuth.error,
    startIntegration: popupOAuth.startOAuth,
    cancelIntegration: popupOAuth.cancelOAuth,
    isPopupOpen: popupOAuth.isPopupOpen,
    checkStatus,
    hasCheckedStatus: statusQuery.isFetched,
  };
};

// Hook to disconnect/revoke a Google integration
export const useDisconnectGoogleIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['disconnectGoogleIntegration'],
    mutationFn: async ({ integrationType }: { integrationType: GoogleIntegrationType }) => {
      // TODO: Implement actual disconnect API call when backend supports it
      // For now, this is a placeholder
      console.log(`Disconnecting ${integrationType} integration`);
      return { success: true };
    },
    onSuccess: (_, variables) => {
      const { integrationType } = variables;

      // Update the status cache
      queryClient.setQueryData(
        GOOGLE_INTEGRATION_QUERY_KEYS.status(integrationType),
        { status: 'disconnected' }
      );

      // Invalidate all statuses
      queryClient.invalidateQueries({
        queryKey: GOOGLE_INTEGRATION_QUERY_KEYS.statuses(),
      });
    },
    onError: (error, variables) => {
      console.error(`Failed to disconnect ${variables.integrationType} integration:`, error);
    },
  });
};
