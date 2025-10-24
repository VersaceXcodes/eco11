import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import all required views
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_OnboardingQuiz from '@/components/views/UV_OnboardingQuiz.tsx';
import UV_OnboardingSetup from '@/components/views/UV_OnboardingSetup.tsx';
import UV_Dashboard from '@/components/views/UV_Dashboard.tsx';
import UV_Tracker from '@/components/views/UV_Tracker.tsx';
import UV_Recommendations from '@/components/views/UV_Recommendations.tsx';
import UV_Community from '@/components/views/UV_Community.tsx';
import UV_Education from '@/components/views/UV_Education.tsx';
import UV_Marketplace from '@/components/views/UV_Marketplace.tsx';
import UV_ChallengeDetails from '@/components/views/UV_ChallengeDetails.tsx';
import UV_ProductDetails from '@/components/views/UV_ProductDetails.tsx';
import UV_BusinessProfile from '@/components/views/UV_BusinessProfile.tsx';
import UV_FamilySetup from '@/components/views/UV_FamilySetup.tsx';

// Configure QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authenticationStatus.isAuthenticated);
  const isLoading = useAppStore(state => state.authenticationStatus.isLoading);
  
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

// Public route component for views that should redirect authenticated users
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authenticationStatus.isAuthenticated);
  const isLoading = useAppStore(state => state.authenticationStatus.isLoading);
  
  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const initializeAuth = useAppStore(state => state.initializeAuth);
  const isLoading = useAppStore(state => state.authenticationStatus.isLoading);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <GV_TopNav />
          
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/" 
                element={
                  <PublicRoute>
                    <UV_Landing />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/education" 
                element={<UV_Education />} 
              />
              
              <Route 
                path="/marketplace" 
                element={<UV_Marketplace />} 
              />
              
              <Route 
                path="/product/:id" 
                element={<UV_ProductDetails />} 
              />
              

              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <UV_Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/tracker" 
                element={
                  <ProtectedRoute>
                    <UV_Tracker />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/recommendations" 
                element={
                  <ProtectedRoute>
                    <UV_Recommendations />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/community" 
                element={
                  <ProtectedRoute>
                    <UV_Community />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/challenge/:id" 
                element={
                  <ProtectedRoute>
                    <UV_ChallengeDetails />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/business-profile" 
                element={
                  <ProtectedRoute>
                    <UV_BusinessProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/family-setup" 
                element={
                  <ProtectedRoute>
                    <UV_FamilySetup />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/onboarding/quiz" 
                element={
                  <ProtectedRoute>
                    <UV_OnboardingQuiz />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/onboarding/setup" 
                element={
                  <ProtectedRoute>
                    <UV_OnboardingSetup />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route 
                path="*" 
                element={
                  <ProtectedRoute>
                    <UV_Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
          
          <GV_Footer />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;
