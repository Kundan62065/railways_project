import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

const ProtectedRoute = ({ children, requiredRole = null, requireEdit = false, requireSuperAdmin = false }) => {
  const { isAuthenticated, role, canEdit, hasPermission } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if specific role is required
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: <span className="font-semibold">{requiredRole}</span>
          </p>
          <p className="text-sm text-gray-500">
            Your role: <span className="font-semibold">{role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if SUPER_ADMIN permission is required
  if (requireSuperAdmin && role !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only SUPER_ADMIN can access this page.
          </p>
          <p className="text-sm text-gray-500">
            Your role: <span className="font-semibold">{role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if edit permission is required
  if (requireEdit && !canEdit()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">View Only Access</h2>
          <p className="text-gray-600 mb-4">
            You have view-only access. This page requires edit permissions.
          </p>
          <p className="text-sm text-gray-500">
            Your role: <span className="font-semibold">{role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-6 py-2 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
