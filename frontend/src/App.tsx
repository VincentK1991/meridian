import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SignInPage from "./pages/signin";
import ConsolePage from "./pages/console/console";
import GoogleCallbackHandler from "./components/GoogleCallbackHandler";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import OAuthConnectionCallbackHandler from './components/connection/oauthConnectionCallbackHandler';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Protected route - Console (main page) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ConsolePage />
              </ProtectedRoute>
            }
          />

          {/* Public route - Sign in */}
          <Route path="/signin" element={<SignInPage />} />

          {/* OAuth callback handler */}
          <Route path="/auth/callback" element={<GoogleCallbackHandler />} />

          {/* OAuth connection callback handler */}
          <Route path="/integration/google/callback" element={<OAuthConnectionCallbackHandler />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
