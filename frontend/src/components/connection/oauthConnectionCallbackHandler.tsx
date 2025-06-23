import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useGoogleIntegrationCallback } from '../../hooks/useGoogleIntegration';
import type { GoogleIntegrationType } from '../../api/integrationService';

interface CallbackResult {
  success: boolean;
  integrationType: GoogleIntegrationType;
  error?: string;
  data?: any;
}

export default function OAuthConnectionCallbackHandler() {
  const { integrationType } = useParams<{ integrationType: GoogleIntegrationType }>();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  const callback = useGoogleIntegrationCallback(integrationType!);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for OAuth errors
        if (error) {
          const errorMsg = errorDescription || error || 'OAuth authorization failed';
          setError(errorMsg);
          setStatus('error');

          // Send error to parent window
          const result: CallbackResult = {
            success: false,
            integrationType: integrationType!,
            error: errorMsg
          };

          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
          }
          return;
        }

        // Check for required parameters
        if (!code || !state) {
          const errorMsg = 'Missing required OAuth parameters (code or state)';
          setError(errorMsg);
          setStatus('error');

          const result: CallbackResult = {
            success: false,
            integrationType: integrationType!,
            error: errorMsg
          };

          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
          }
          return;
        }

        // Send callback data to backend
        const response = await callback.mutateAsync({ code, state });

        setStatus('success');

        // Send success result to parent window
        const result: CallbackResult = {
          success: true,
          integrationType: integrationType!,
          data: response
        };

        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
        }

        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (err: any) {
        console.error('OAuth callback error:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to process OAuth callback';
        setError(errorMsg);
        setStatus('error');

        // Send error to parent window
        const result: CallbackResult = {
          success: false,
          integrationType: integrationType!,
          error: errorMsg
        };

        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
        }
      }
    };

    if (integrationType) {
      handleCallback();
    }
  }, [integrationType, searchParams, callback]);

  const getIntegrationDisplayName = (type: GoogleIntegrationType) => {
    switch (type) {
      case 'drive': return 'Google Drive';
      case 'calendar': return 'Google Calendar';
      case 'gmail': return 'Gmail';
      default: return 'Google Service';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="liquid-glass-card p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Connecting {integrationType && getIntegrationDisplayName(integrationType)}
            </h2>
            <p className="text-white/70">
              Processing your authorization...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Successfully Connected!
            </h2>
            <p className="text-white/70 mb-4">
              {integrationType && getIntegrationDisplayName(integrationType)} has been connected to your account.
            </p>
            <p className="text-sm text-white/60">
              This window will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-white/70 mb-4">
              {error || 'An unexpected error occurred while connecting your account.'}
            </p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}
