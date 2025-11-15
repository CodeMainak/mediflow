import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LoginForm } from './components/auth/LoginForm';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { Loader2 } from 'lucide-react';

// Lazy load heavy components
const DoctorDashboard = lazy(() => import('./components/dashboard/DoctorDashboard').then(module => ({ default: module.DoctorDashboard })));
const PatientDashboard = lazy(() => import('./components/dashboard/PatientDashboard').then(module => ({ default: module.PatientDashboard })));
const ReceptionistDashboard = lazy(() => import('./components/dashboard/ReceptionistDashboard').then(module => ({ default: module.ReceptionistDashboard })));
const PatientList = lazy(() => import('./components/patients/PatientList').then(module => ({ default: module.PatientList })));
const AppointmentManager = lazy(() => import('./components/appointments/AppointmentManager').then(module => ({ default: module.AppointmentManager })));
const PrescriptionManager = lazy(() => import('./components/prescriptions/PrescriptionManager').then(module => ({ default: module.PrescriptionManager })));
const ProfileSettings = lazy(() => import('./components/profile/ProfileSettings').then(module => ({ default: module.ProfileSettings })));
const ChatManager = lazy(() => import('./components/chat/ChatManager').then(module => ({ default: module.ChatManager })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-green-600 p-2 rounded-full">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">MediFlow</h2>
          <p className="text-green-700 flex items-center justify-center">
            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Loading Healthcare System...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const DashboardRoutes: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/patients') return 'patients';
    if (path === '/appointments') return 'appointments';
    if (path === '/prescriptions') return 'prescriptions';
    if (path === '/messages') return 'messages';
    if (path === '/profile') return 'profile';
    if (path === '/settings') return 'settings';
    if (path === '/add-patient') return 'add-patient';
    return 'dashboard';
  };

  const handleTabChange = (tab: string) => {
    navigate(`/${tab === 'dashboard' ? '' : tab}`);
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'Doctor':
        return <DoctorDashboard />;
      case 'Patient':
        return <PatientDashboard />;
      case 'Receptionist':
      case 'Admin':
        return <ReceptionistDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <DashboardLayout activeTab={getActiveTab()} onTabChange={handleTabChange}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<RouteErrorBoundary routeName="Dashboard">{renderDashboard()}</RouteErrorBoundary>} />
          <Route path="/dashboard" element={<RouteErrorBoundary routeName="Dashboard">{renderDashboard()}</RouteErrorBoundary>} />
          <Route path="/patients" element={<RouteErrorBoundary routeName="Patients"><PatientList /></RouteErrorBoundary>} />
          <Route path="/appointments" element={<RouteErrorBoundary routeName="Appointments"><AppointmentManager /></RouteErrorBoundary>} />
          <Route path="/prescriptions" element={<RouteErrorBoundary routeName="Prescriptions"><PrescriptionManager /></RouteErrorBoundary>} />
          <Route path="/messages" element={<RouteErrorBoundary routeName="Messages"><ChatManager /></RouteErrorBoundary>} />
          <Route path="/profile" element={<RouteErrorBoundary routeName="Profile"><ProfileSettings /></RouteErrorBoundary>} />
          <Route path="/settings" element={<RouteErrorBoundary routeName="Settings"><ProfileSettings /></RouteErrorBoundary>} />
          <Route path="/add-patient" element={
            <div className="space-y-6">
              <div>
                <h2>Add New Patient</h2>
                <p className="text-muted-foreground">Register a new patient in the system</p>
              </div>
              <div className="max-w-2xl">
                <div className="p-8 border-2 border-dashed border-muted rounded-lg text-center">
                  <p className="text-muted-foreground">
                    Patient registration form would be implemented here with proper form validation and Supabase integration.
                  </p>
                </div>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginForm />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <DashboardRoutes />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
              <AppContent />
              <Toaster />
            </div>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}