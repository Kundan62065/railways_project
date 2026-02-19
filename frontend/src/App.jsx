
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import HomeDashboard from './pages/dashboard/HomeDashboard';
import CreateShiftPage from './pages/dashboard/CreateShiftPage';
import ActiveShiftsPage from './pages/dashboard/ActiveShiftsPage';
import CompletedShiftsPage from './pages/dashboard/CompletedShiftsPage';
import ShiftDetailsPage from './pages/dashboard/ShiftDetailsPage';
import EditShiftPage from './pages/dashboard/EditShiftPage';
import UserManagementPage from './pages/dashboard/UserManagementPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import DutyAlertModal from './components/DutyAlertModal';
import DutyAlertBanner from './components/DutyAlertBanner';
import useAuthStore from './stores/useAuthStore';
import useSocketAlerts from './stores/useSocketAlerts';

// Inner component that uses socket alerts (needs to be inside Router but has access to auth)
function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const {
    pendingAlerts,
    currentModal,
    socketConnected,
    openAlert,
    closeModal,
    onAlertResponded,
    dismissAlert,
  } = useSocketAlerts();

  return (
    <>
      <ToastContainer />

      {/* Global Duty Alert Banner - shown when there are pending alerts */}
      {isAuthenticated && pendingAlerts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
          <DutyAlertBanner
            alerts={pendingAlerts}
            onOpenAlert={openAlert}
            onDismiss={dismissAlert}
          />
        </div>
      )}

      {/* Duty Alert Modal - shown for actionable alerts */}
      {currentModal && (
        <DutyAlertModal
          alert={currentModal}
          onClose={closeModal}
          onResponded={onAlertResponded}
        />
      )}

      <Routes>
        {/* Auth Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />}
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Create Shift - Requires Edit Permission (Admin or SuperAdmin only) */}
        <Route
          path="/dashboard/create-shift"
          element={
            <ProtectedRoute requireEdit={true}>
              <CreateShiftPage />
            </ProtectedRoute>
          }
        />

        {/* Active Shifts - All authenticated users can view */}
        <Route
          path="/dashboard/active-shifts"
          element={
            <ProtectedRoute>
              <ActiveShiftsPage />
            </ProtectedRoute>
          }
        />

        {/* Completed Shifts - All authenticated users can view */}
        <Route
          path="/dashboard/completed-shifts"
          element={
            <ProtectedRoute>
              <CompletedShiftsPage />
            </ProtectedRoute>
          }
        />

        {/* Shift Details - All authenticated users can view */}
        <Route
          path="/dashboard/shifts/:id"
          element={
            <ProtectedRoute>
              <ShiftDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Edit Shift - Requires Edit Permission (Admin or SuperAdmin only) */}
        <Route
          path="/dashboard/shifts/:id/edit"
          element={
            <ProtectedRoute requireEdit={true}>
              <EditShiftPage />
            </ProtectedRoute>
          }
        />

        {/* User Management - SUPER_ADMIN only */}
        <Route
          path="/dashboard/user-management"
          element={
            <ErrorBoundary>
              <ProtectedRoute requireSuperAdmin={true}>
                <UserManagementPage />
              </ProtectedRoute>
            </ErrorBoundary>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

