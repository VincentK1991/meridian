import { useSearchParams, Navigate } from 'react-router-dom';
import { useGoogleSignin, useIsAuthenticated } from '../hooks/useAuth';
import { FlipWords } from '../components/ui/flip-words';

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
    <div
      className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat overflow-auto"
      style={{
        backgroundImage: 'url(/images/background_signin3.png)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 z-0"></div>

      <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 py-8">
        <p className="text-2xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
          Hello, welcome to Yurt
        </p>
        <p className="text-base md:text-2xl mt-4 text-white font-normal inter-var text-center">
          Your Universal Reasoning Tool for
          <FlipWords
            words={["productivity", "creativity", "efficiency", "collaboration", "innovation"]}
            duration={3000}
            className="text-white font-normal"
          />
          and beyond.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg backdrop-blur-sm">
            <p className="text-red-200 text-center">
              {error === 'oauth_failed' && 'Sign in failed. Please try again.'}
              {error === 'oauth_cancelled' && 'Sign in was cancelled.'}
              {error === 'invalid_callback' && 'Invalid sign in attempt.'}
              {!['oauth_failed', 'oauth_cancelled', 'invalid_callback'].includes(error) && 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {/* Enhanced liquid glass button with dramatic effects */}
        <div className="relative mt-8 group">
          {/* Outer glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Main button */}
          <button
            onClick={startSignin}
            disabled={isLoading}
            className="relative px-8 py-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/30 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 shadow-2xl hover:shadow-white/10 transform hover:scale-105 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Top edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

            {/* Left edge highlight */}
            <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>

            {/* Inner refraction effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-xl"></div>

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>

            {/* Button content */}
            <div className="relative z-10 flex items-center justify-center gap-2">
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              )}
              {isLoading ? 'Loading...' : 'Sign In with Google'}
            </div>

            {/* Bottom inner shadow for depth */}
            <div className="absolute bottom-0 left-2 right-2 h-px bg-black/20 rounded-full blur-sm"></div>
          </button>
        </div>
      </div>
    </div>
  );
}
