import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { integrationService, type GoogleIntegrationType } from '../../api/integrationService';

interface CallbackResult {
  success: boolean;
  integrationType: GoogleIntegrationType;
  error?: string;
  data?: unknown;
}

export default function OAuthConnectionCallbackHandler() {
  const [searchParams] = useSearchParams();
  const { integration_type } = useParams<{ integration_type: GoogleIntegrationType }>();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  console.log('OAuthConnectionCallbackHandler component loaded');
  console.log('Current URL:', window.location.href);

  useEffect(() => {
    console.log('useEffect triggered - hasProcessedRef.current:', hasProcessedRef.current);
    console.log('useEffect dependencies - integration_type:', integration_type, 'searchParams:', searchParams.toString());

    // Prevent double execution
    if (hasProcessedRef.current) {
      console.log('OAuth callback already processed, skipping');
      return;
    }
        const handleCallback = async () => {
      console.log('OAuth callback handler started');
      console.log('Integration type from URL:', integration_type);
      console.log('Search params:', searchParams.toString());

      // Mark as processed immediately to prevent duplicate calls
      hasProcessedRef.current = true;

      try {
        // Extract OAuth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('Extracted OAuth params:', { code: code?.substring(0, 10) + '...', state: state?.substring(0, 10) + '...', error });

        // Validate integration type from URL path
        if (!integration_type || !['drive', 'calendar', 'gmail'].includes(integration_type)) {
          const errorMsg = 'Invalid or missing integration type';
          setError(errorMsg);
          setStatus('error');

          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_CALLBACK',
              result: { success: false, integrationType: integration_type || 'drive', error: errorMsg }
            }, '*');
          }
          return;
        }

        // Check for OAuth errors
        if (error) {
          const errorMsg = errorDescription || error || 'OAuth authorization failed';
          setError(errorMsg);
          setStatus('error');

          // Send error to parent window
          const result: CallbackResult = {
            success: false,
            integrationType: integration_type,
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
            integrationType: integration_type,
            error: errorMsg
          };

          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
          }
          return;
        }

        // Send callback data to backend
        console.log('About to call backend API:', { integration_type, code: code?.substring(0, 10) + '...', state: state?.substring(0, 10) + '...' });

        const response = await integrationService.handleGoogleIntegrationCallback(
          integration_type,
          { code, state }
        );

        console.log('Backend API response:', response);
        setStatus('success');

        // Send success result to parent window
        const result: CallbackResult = {
          success: true,
          integrationType: integration_type,
          data: response
        };

        console.log('Sending success message to parent:', result);
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
          console.log('Message sent to parent window');
        } else {
          console.warn('No window.opener found - cannot send message to parent');
        }

        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (err: unknown) {
        console.error('OAuth callback error:', err);
        console.error('Error details:', err);

        let errorMsg = 'Failed to process OAuth callback';
        if (err instanceof Error) {
          errorMsg = err.message;
          // Check for common OAuth errors
          if (err.message.includes('authorization code') || err.message.includes('invalid_grant')) {
            errorMsg = 'Authorization code has already been used. Please try connecting again.';
          }
        }

        console.error('Error message:', errorMsg);
        setError(errorMsg);
        setStatus('error');

        // Reset processed flag on error to allow potential retry
        hasProcessedRef.current = false;

        // Send error to parent window
        const result: CallbackResult = {
          success: false,
          integrationType: integration_type!,
          error: errorMsg
        };

        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_CALLBACK', result }, '*');
        }
      }
    };

    handleCallback();
  }, []); // Run only once on mount - all values are stable from URL

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
              Connecting {integration_type && getIntegrationDisplayName(integration_type)}
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
              {integration_type && getIntegrationDisplayName(integration_type)} has been connected to your account.
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
