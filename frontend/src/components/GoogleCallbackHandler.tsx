import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGoogleCallback } from '../hooks/useAuth';

export default function GoogleCallbackHandler() {
  const [searchParams] = useSearchParams();
  const googleCallback = useGoogleCallback();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      hasProcessed.current = true;
      // Redirect to signin with error
      window.location.href = '/signin?error=oauth_cancelled';
      return;
    }

    if (code && state) {
      hasProcessed.current = true;
      console.log('Processing OAuth callback with code:', code.substring(0, 10) + '...');
      googleCallback.mutate({ code, state });
    } else {
      console.error('Missing code or state parameters');
      hasProcessed.current = true;
      window.location.href = '/signin?error=invalid_callback';
    }
  }, [searchParams]); // Removed googleCallback from dependencies

  // Show loading while processing callback
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
        {googleCallback.error && (
          <p className="text-red-400 mt-2">
            Sign in failed. Redirecting...
          </p>
        )}
      </div>
    </div>
  );
}
