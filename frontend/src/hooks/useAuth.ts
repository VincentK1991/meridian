import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authService';
import { useNavigate } from 'react-router-dom';

// Query keys
export const AUTH_QUERY_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
  googleAuthUrl: ['auth', 'googleAuthUrl'] as const,
};

// Hook to get current user (protected)
export const useCurrentUser = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: authApi.getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 2 minutes (shorter for better session validation)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always check on component mount
  });
};

// Hook to get Google auth URL
export const useGoogleAuthUrl = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.googleAuthUrl,
    queryFn: authApi.getGoogleAuthUrl,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to handle Google OAuth callback
export const useGoogleCallback = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationKey: ['googleCallback'], // Add mutation key for deduplication
    mutationFn: authApi.googleCallback,
    retry: false, // Don't retry on failure
    onSuccess: (data) => {
      console.log('OAuth callback successful, navigating to console');
      // Update the current user cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, data.user);
      // Navigate to console
      navigate('/');
    },
    onError: (error) => {
      console.error('Google OAuth callback failed:', error);
      // Optionally redirect to signin with error
      navigate('/signin?error=oauth_failed');
    },
  });
};

// Hook to handle logout
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all auth-related cache
      queryClient.removeQueries({ queryKey: ['auth'] });
      // Navigate to signin
      navigate('/signin');
    },
  });
};

// Hook to initiate Google signin
export const useGoogleSignin = () => {
  const { data: authUrlData, isLoading } = useGoogleAuthUrl();

  const startSignin = () => {
    if (authUrlData?.url) {
      window.location.href = authUrlData.url;
    }
  };

  return {
    startSignin,
    isLoading,
  };
};

// Helper hook to check if user is authenticated
export const useIsAuthenticated = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  // Log authentication status for debugging
  console.log('Authentication status:', {
    hasUser: !!user,
    hasError: !!error,
    isLoading,
    userEmail: user?.email
  });

  return {
    isAuthenticated: !!user && !error,
    user,
    isLoading,
    error,
  };
};
