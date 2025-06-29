import { useState, useCallback, useRef, useEffect } from 'react';
import { useGoogleIntegrationAuthUrl } from './useGoogleIntegration';
import type { GoogleIntegrationType } from '../api/integrationService';

interface PopupOAuthResult {
  success: boolean;
  integrationType: GoogleIntegrationType;
  error?: string;
  data?: unknown;
}

interface UsePopupOAuthOptions {
  integrationType: GoogleIntegrationType;
  onSuccess?: (result: PopupOAuthResult) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const usePopupOAuth = ({
  integrationType,
  onSuccess,
  onError,
  onClose
}: UsePopupOAuthOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const checkClosedIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const authUrlQuery = useGoogleIntegrationAuthUrl(integrationType);

  // Clean up popup and interval when component unmounts
  useEffect(() => {
    return () => {
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (checkClosedIntervalRef.current) {
        clearInterval(checkClosedIntervalRef.current);
      }
    };
  }, []);

  // Listen for messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from popup:', event.data);

      // Validate origin in production
      // if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_CALLBACK') {
        const result: PopupOAuthResult = event.data.result;
        console.log('Processing OAuth callback result:', result);

        setIsLoading(false);

        if (result.success) {
          console.log('OAuth success, calling onSuccess callback');
          setError(null);
          onSuccess?.(result);
        } else {
          console.log('OAuth failed:', result.error);
          setError(result.error || 'OAuth failed');
          onError?.(result.error || 'OAuth failed');
        }

        // Clean up
        if (popupRef.current) {
          try {
            popupRef.current.close();
          } catch (e) {
            console.warn('Could not close popup:', e);
          }
          popupRef.current = null;
        }
        if (checkClosedIntervalRef.current) {
          clearInterval(checkClosedIntervalRef.current);
          checkClosedIntervalRef.current = null;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError]);

  const startOAuth = useCallback(async () => {
    // First fetch the auth URL if we don't have it
    let authUrlData = authUrlQuery.data;
    if (!authUrlData) {
      try {
        setIsLoading(true);
        const result = await authUrlQuery.refetch();
        authUrlData = result.data;
      } catch {
        setIsLoading(false);
        setError('Failed to get authorization URL');
        onError?.('Failed to get authorization URL');
        return;
      }
    }

    if (!authUrlData?.authorization_url) {
      setIsLoading(false);
      setError('Authorization URL not available');
      onError?.('Authorization URL not available');
      return;
    }

    setError(null);

    // Popup window configuration
    const popup = window.open(
      authUrlData.authorization_url,
      'oauth_popup',
      [
        'width=500',
        'height=600',
        'scrollbars=yes',
        'resizable=yes',
        'status=yes',
        'location=yes',
        'toolbar=no',
        'menubar=no',
        'directories=no'
      ].join(',')
    );

    if (!popup) {
      setIsLoading(false);
      setError('Failed to open popup window. Please check your popup blocker settings.');
      onError?.('Failed to open popup window. Please check your popup blocker settings.');
      return;
    }

    popupRef.current = popup;

    // Check if popup was closed manually (with COOP error handling)
    checkClosedIntervalRef.current = setInterval(() => {
      try {
        if (popup.closed) {
          setIsLoading(false);
          setError('OAuth was cancelled');
          onError?.('OAuth was cancelled');
          onClose?.();

          // Clean up
          popupRef.current = null;
          if (checkClosedIntervalRef.current) {
            clearInterval(checkClosedIntervalRef.current);
            checkClosedIntervalRef.current = null;
          }
        }
      } catch (error) {
        // Ignore COOP errors - they're expected during cross-origin navigation
        // The popup will still send a message when the OAuth flow completes
        if (error instanceof Error && error.message.includes('Cross-Origin-Opener-Policy')) {
          // Silently ignore COOP errors
          return;
        }
        console.warn('Error checking popup status:', error);
      }
    }, 1000);

  }, [authUrlQuery, onError, onClose]);

  const cancelOAuth = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    setIsLoading(false);
    setError(null);
    onClose?.();
  }, [onClose]);

  return {
    startOAuth,
    cancelOAuth,
    isLoading: isLoading || authUrlQuery.isLoading,
    error,
    isPopupOpen: !!popupRef.current && !popupRef.current.closed,
  };
};
