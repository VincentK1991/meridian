import { useSearchParams, Navigate } from 'react-router-dom';
import { CardBody, CardContainer, CardItem } from "../components/ui/3d-card";
import { WavyBackground } from "../components/ui/wavy-background";
import { useGoogleSignin, useIsAuthenticated } from '../hooks/useAuth';

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const { startSignin, isLoading } = useGoogleSignin();
  const { isAuthenticated } = useIsAuthenticated();

  const error = searchParams.get('error');

  // If already authenticated, redirect to console
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <div className="flex flex-col items-center justify-center">
        <p className="text-2xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
          Hello, I'm meridian
        </p>
        <p className="text-base md:text-lg mt-4 text-white font-normal inter-var text-center">
          Your AI-powered personal assistant
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-200 text-center">
              {error === 'oauth_failed' && 'Sign in failed. Please try again.'}
              {error === 'oauth_cancelled' && 'Sign in was cancelled.'}
              {error === 'invalid_callback' && 'Invalid sign in attempt.'}
              {!['oauth_failed', 'oauth_cancelled', 'invalid_callback'].includes(error) && 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        <CardContainer>
          <CardBody>
            <CardItem
              as="button"
              translateZ="60"
              className="px-8 py-4 rounded-xl bg-black dark:bg-white dark:text-black text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={startSignin}
              disabled={isLoading}
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              )}
              {isLoading ? 'Loading...' : 'Sign In with Google'}
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>
    </WavyBackground>
  );
}
