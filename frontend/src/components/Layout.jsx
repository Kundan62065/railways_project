import { Link, useNavigate } from 'react-router-dom';
import { FaTrain, FaSignOutAlt, FaUser, FaShieldAlt, FaCrown, FaEye } from 'react-icons/fa';
import useAuthStore from '../stores/useAuthStore';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const { user, role, logout, canEdit, isViewOnly } = useAuthStore();
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const getRoleIcon = () => {
    if (role === 'superadmin') return <FaCrown className="text-yellow-300" />;
    if (role === 'admin') return <FaShieldAlt className="text-blue-300" />;
    return <FaEye className="text-gray-300" />;
  };

  const getRoleBadge = () => {
    const badges = {
      superadmin: 'bg-yellow-500 text-white',
      admin: 'bg-blue-500 text-white',
      user: 'bg-gray-500 text-white',
    };
    return badges[role] || 'bg-gray-500 text-white';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#003d82] text-white shadow-md">
        <div className="gov-container">
          <div className="flex items-center justify-between py-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <FaTrain className="text-4xl" />
              <div>
                <h1 className="text-2xl font-bold">Indian Railways</h1>
                <p className="text-sm text-gray-200">Loco Pilot & Guard Shift Management System</p>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  {getRoleIcon()}
                  <div>
                    <p className="text-sm font-semibold">{user?.name || 'User'}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadge()}`}>
                        {role?.toUpperCase()}
                      </span>
                      {user?.division && (
                        <span className="text-xs text-gray-300">{user.division}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-[#d32f2f] hover:bg-[#b71c1c] px-4 py-2 rounded transition-colors"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="gov-container">
          <ul className="flex gap-1">
            <li>
              <Link
                to="/dashboard"
                className="block px-6 py-3 text-[#003d82] hover:bg-gray-100 font-medium transition-colors"
              >
                Dashboard
              </Link>
            </li>
            {canEdit() && (
              <li>
                <Link
                  to="/dashboard/create-shift"
                  className="block px-6 py-3 text-[#003d82] hover:bg-gray-100 font-medium transition-colors"
                >
                  Create Shift
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/dashboard/active-shifts"
                className="block px-6 py-3 text-[#003d82] hover:bg-gray-100 font-medium transition-colors"
              >
                Active Shifts
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/completed-shifts"
                className="block px-6 py-3 text-[#003d82] hover:bg-gray-100 font-medium transition-colors"
              >
                Completed Shifts
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 gov-container py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#003d82] text-white py-4 mt-auto">
        <div className="gov-container text-center">
          <p className="text-sm">© 2025 Indian Railways. All rights reserved.</p>
          <p className="text-xs text-gray-300 mt-1">Shift Management System v1.0</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
