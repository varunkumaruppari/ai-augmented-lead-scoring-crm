import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Spinner from './components/common/Spinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { NotFound } from './pages/ErrorPages';

// ─── Lazy-loaded pages for code splitting ─────────────────────────────────────
const Login           = lazy(() => import('./pages/Login'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const LeadList        = lazy(() => import('./pages/LeadList'));
const LeadDetail      = lazy(() => import('./pages/LeadDetail'));
const CreateLead      = lazy(() => import('./pages/CreateLead'));
const EditLead        = lazy(() => import('./pages/EditLead'));
const Analytics       = lazy(() => import('./pages/Analytics'));
const FollowUps       = lazy(() => import('./pages/FollowUps'));
const Notifications   = lazy(() => import('./pages/Notifications'));
const Settings        = lazy(() => import('./pages/Settings'));
const Pipeline        = lazy(() => import('./pages/Pipeline'));
const AgentPerformance = lazy(() => import('./pages/AgentPerformance'));
const Reports         = lazy(() => import('./pages/Reports'));
const Admin           = lazy(() => import('./pages/Admin'));

// ─── Suspense fallback ────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[500px]">
    <Spinner size="lg" />
  </div>
);

// ─── Protected route wrapper ──────────────────────────────────────────────────
const Protected = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </Layout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={
                <Suspense fallback={<PageLoader />}><Login /></Suspense>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/dashboard"       element={<Protected><Dashboard /></Protected>} />
              <Route path="/pipeline"        element={<Protected><Pipeline /></Protected>} />
              <Route path="/performance"     element={<Protected><AgentPerformance /></Protected>} />
              <Route path="/leads"           element={<Protected><LeadList /></Protected>} />
              <Route path="/leads/new"       element={<Protected><CreateLead /></Protected>} />
              <Route path="/leads/:id/edit"  element={<Protected><EditLead /></Protected>} />
              <Route path="/leads/:id"       element={<Protected><LeadDetail /></Protected>} />
              <Route path="/analytics"       element={<Protected><Analytics /></Protected>} />
              <Route path="/reports"         element={<Protected><Reports /></Protected>} />
              <Route path="/follow-ups"      element={<Protected><FollowUps /></Protected>} />
              <Route path="/notifications"   element={<Protected><Notifications /></Protected>} />

              {/* Admin-only routes */}
              <Route path="/settings" element={
                <Protected roles={['admin', 'super_admin', 'manager']}>
                  <Settings />
                </Protected>
              } />
              <Route path="/admin" element={
                <Protected roles={['admin', 'super_admin']}>
                  <Admin />
                </Protected>
              } />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<Protected><NotFound /></Protected>} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
