import { lazy, Suspense, useEffect } from "react";
// Production deployment marker for mtdrb-fit 20260817.
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider as MuiThemeProvider } from "@mui/material";
import { theme } from "./theme";
import { AuthProvider } from "./contexts/AuthProvider";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { UIProvider } from "./contexts/UIContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PageThemeProvider } from "./contexts/PageThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { WorkoutPlansProvider } from "./contexts/WorkoutPlansContext";
import { Toaster } from "react-hot-toast";
import { errorHandler } from "./services/errorHandler";
import { ErrorContext } from "./services/errorHandler";

// Pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Legal = lazy(() => import("./pages/Legal"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Members = lazy(() => import("./pages/Members"));
const Classes = lazy(() => import("./pages/Classes"));
const Trainers = lazy(() => import("./pages/Trainers"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Billing = lazy(() => import("./pages/Billing"));
const Plans = lazy(() => import("./pages/Plans"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Branches = lazy(() => import("./pages/Branches"));
const Insights = lazy(() => import("./pages/Insights"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Components
import Layout from "./components/Layout";
import AuthSetup from "./components/AuthSetup";
import PermissionGuard from "./components/auth/PermissionGuard";

const App = () => {
  // Global async error handling
  // React Error Boundaries don't catch async errors, so we need to handle them globally
  useEffect(() => {
    /**
     * Handle unhandled promise rejections
     * These occur when promises are rejected but no .catch() handler is attached
     */
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent default browser error logging
      event.preventDefault();

      // Process the error through our error handler
      const error = event.reason;
      errorHandler.processError(
        error,
        ErrorContext.GENERAL,
        true, // Show toast notification
      );

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error("Unhandled Promise Rejection:", error);
      }
    };

    /**
     * Handle uncaught errors in async code
     * These occur when errors are thrown in async functions without try/catch
     */
    const handleError = (event: ErrorEvent) => {
      // Only handle errors that aren't already handled by ErrorBoundary
      // ErrorBoundary handles React component errors, so we focus on async errors
      if (event.error && event.error instanceof Error) {
        errorHandler.processError(
          event.error,
          ErrorContext.GENERAL,
          true, // Show toast notification
        );
      }
    };

    // Register global error handlers
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    // Cleanup: Remove event listeners on unmount
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError);
    };
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
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: "#363636",
                          color: "#fff",
                        },
                      }}
                    />
                    <Suspense
                      fallback={
                        <div className="min-h-screen flex items-center justify-center bg-white text-slate-600">
                          Loading MTDRB…
                        </div>
                      }
                    >
                      <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Landing />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/subscribe" element={<Subscribe />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/terms" element={<Legal initialTab="terms" />} />
                      <Route path="/privacy" element={<Legal initialTab="privacy" />} />
                      <Route path="/refund" element={<Legal initialTab="refund" />} />

                      {/* Protected routes with AuthSetup wrapper */}
                      <Route
                        path="/dashboard"
                        element={
                          <AuthSetup>
                            <WorkoutPlansProvider>
                              <Layout />
                            </WorkoutPlansProvider>
                          </AuthSetup>
                        }
                      >
                        {/* Dashboard - accessible to all authenticated users */}
                        <Route 
                          index 
                          element={
                            <PermissionGuard requiredRole="trainer" fallbackPath="/login">
                              <Dashboard />
                            </PermissionGuard>
                          } 
                        />
                        {/* Profile - accessible to all authenticated users */}
                        <Route 
                          path="profile" 
                          element={
                            <PermissionGuard requiredRole="trainer" fallbackPath="/dashboard">
                              <Profile />
                            </PermissionGuard>
                          } 
                        />
                        {/* Members - requires employee or higher */}
                        <Route 
                          path="members" 
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Members />
                            </PermissionGuard>
                          } 
                        />
                        {/* Classes - requires trainer or higher */}
                        <Route 
                          path="classes" 
                          element={
                            <PermissionGuard requiredRole="trainer" fallbackPath="/dashboard">
                              <Classes />
                            </PermissionGuard>
                          } 
                        />
                        {/* Trainers - requires employee or higher */}
                        <Route 
                          path="trainers" 
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Trainers />
                            </PermissionGuard>
                          } 
                        />
                        {/* Analytics - requires employee or higher */}
                        <Route 
                          path="analytics" 
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Analytics />
                            </PermissionGuard>
                          } 
                        />
                        {/* Attendance - requires employee or higher */}
                        <Route
                          path="attendance"
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Attendance />
                            </PermissionGuard>
                          }
                        />
                        {/* Insights - requires employee or higher */}
                        <Route 
                          path="insights" 
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Insights />
                            </PermissionGuard>
                          } 
                        />
                        {/* Reports - requires employee or higher */}
                        <Route 
                          path="reports" 
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Reports />
                            </PermissionGuard>
                          } 
                        />
                        {/* Settings - requires admin or higher */}
                        <Route 
                          path="settings" 
                          element={
                            <PermissionGuard requiredRole="admin" fallbackPath="/dashboard">
                              <Settings />
                            </PermissionGuard>
                          } 
                        />
                        {/* Billing - requires employee or higher */}
                        <Route 
                          path="billing" 
                          element={
                            <PermissionGuard requiredRole="employee" fallbackPath="/dashboard">
                              <Billing />
                            </PermissionGuard>
                          } 
                        />
                        {/* Plans - requires admin or higher */}
                        <Route 
                          path="plans" 
                          element={
                            <PermissionGuard requiredRole="admin" fallbackPath="/dashboard">
                              <Plans />
                            </PermissionGuard>
                          } 
                        />
                        {/* Tasks - requires trainer or higher */}
                        <Route 
                          path="tasks" 
                          element={
                            <PermissionGuard requiredRole="trainer" fallbackPath="/dashboard">
                              <Tasks />
                            </PermissionGuard>
                          } 
                        />
                        {/* Branches - requires admin or higher */}
                        <Route 
                          path="branches" 
                          element={
                            <PermissionGuard requiredRole="admin" fallbackPath="/dashboard">
                              <Branches />
                            </PermissionGuard>
                          } 
                        />
                      </Route>

                      {/* Redirect root dashboard to /dashboard */}
                      <Route
                        path="/members"
                        element={<Navigate to="/dashboard/members" replace />}
                      />
                      <Route
                        path="/classes"
                        element={<Navigate to="/dashboard/classes" replace />}
                      />
                      <Route
                        path="/trainers"
                        element={<Navigate to="/dashboard/trainers" replace />}
                      />
                      <Route
                        path="/analytics"
                        element={<Navigate to="/dashboard/analytics" replace />}
                      />
                      <Route
                        path="/attendance"
                        element={<Navigate to="/dashboard/attendance" replace />}
                      />
                      <Route
                        path="/reports"
                        element={<Navigate to="/dashboard/reports" replace />}
                      />
                      <Route
                        path="/settings"
                        element={<Navigate to="/dashboard/settings" replace />}
                      />
                      <Route
                        path="/billing"
                        element={<Navigate to="/dashboard/billing" replace />}
                      />
                      <Route
                        path="/plans"
                        element={<Navigate to="/dashboard/plans" replace />}
                      />
                      <Route
                        path="/tasks"
                        element={<Navigate to="/dashboard/tasks" replace />}
                      />
                      <Route
                        path="/branches"
                        element={<Navigate to="/dashboard/branches" replace />}
                      />
                      <Route
                        path="/insights"
                        element={<Navigate to="/dashboard/insights" replace />}
                      />
                      <Route
                        path="/profile"
                        element={<Navigate to="/dashboard/profile" replace />}
                      />

                      {/* Catch all route */}
                      <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
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
