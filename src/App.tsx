import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { UIProvider } from './contexts/UIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PageThemeProvider } from './contexts/PageThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WorkoutPlansProvider } from './contexts/WorkoutPlansContext';
import { Toaster, toast } from 'react-hot-toast';
import NetworkStatus from './components/NetworkStatus';
import { checkSupabaseHealth } from './supabaseClient';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Subscribe from './pages/Subscribe';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Members from './pages/Members';
import Classes from './pages/Classes';
import Trainers from './pages/Trainers';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import Plans from './pages/Plans';
import Tasks from './pages/Tasks';
import Promotions from './pages/Promotions';
import NotFound from './pages/NotFound';
import MemberModalsDemo from './components/members/MemberModalsDemo';
import ClassModalsDemo from './components/classes/ClassModalsDemo';

// Components
import Layout from './components/Layout';
import AuthSetup from './components/AuthSetup';
import Ae2 from './components/Ae2';

const App = () => {
  // Check Supabase connectivity on initial load
  useEffect(() => {
    checkSupabaseHealth().then((ok) => {
      if (ok) {
        toast.success('Connected to backend');
      } else {
        toast.error('Cannot reach backend');
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <MuiThemeProvider theme={theme}>
        <ThemeProvider>
          <PageThemeProvider>
            <Router>
              <AuthProvider>
                <SubscriptionProvider>
                  <UIProvider>
                    <NetworkStatus />
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#363636',
                          color: '#fff',
                        },
                      }}
                    />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/subscribe" element={<Subscribe />} />

                    {/* Demo routes */}
                    <Route path="/modals-demo" element={
                      <AuthSetup>
                        <WorkoutPlansProvider>
                          <Layout />
                        </WorkoutPlansProvider>
                      </AuthSetup>
                    }>
                      <Route index element={<MemberModalsDemo />} />
                    </Route>
                    
                    <Route path="/class-modals-demo" element={
                      <AuthSetup>
                        <WorkoutPlansProvider>
                          <Layout />
                        </WorkoutPlansProvider>
                      </AuthSetup>
                    }>
                      <Route index element={<ClassModalsDemo />} />
                    </Route>

                    {/* Protected routes with AuthSetup wrapper */}
                    <Route path="/dashboard" element={
                      <AuthSetup>
                        <WorkoutPlansProvider>
                          <Layout />
                        </WorkoutPlansProvider>
                      </AuthSetup>
                    }>
                      <Route index element={<Dashboard />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="members" element={<Members />} />
                      <Route path="classes" element={<Classes />} />
                      <Route path="trainers" element={<Trainers />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="billing" element={<Billing />} />
                      <Route path="plans" element={<Plans />} />
                      <Route path="tasks" element={<Tasks />} />
                      <Route path="promotions" element={<Promotions />} />
                    </Route>

                    {/* Redirect root dashboard to /dashboard */}
                    <Route path="/members" element={<Navigate to="/dashboard/members" replace />} />
                    <Route path="/classes" element={<Navigate to="/dashboard/classes" replace />} />
                    <Route path="/trainers" element={<Navigate to="/dashboard/trainers" replace />} />
                    <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
                    <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
                    <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
                    <Route path="/billing" element={<Navigate to="/dashboard/billing" replace />} />
                    <Route path="/plans" element={<Navigate to="/dashboard/plans" replace />} />
                    <Route path="/tasks" element={<Navigate to="/dashboard/tasks" replace />} />
                    <Route path="/promotions" element={<Navigate to="/dashboard/promotions" replace />} />
                    <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />

                    {/* Catch all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                                  </UIProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </Router>
          </PageThemeProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </ErrorBoundary>
  );
};

export default App; 