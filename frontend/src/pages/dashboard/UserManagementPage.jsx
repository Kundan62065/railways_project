import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaUsers, FaUserCheck, FaUserTimes, FaUserEdit, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/useAuthStore';
import useToastStore from '../../stores/useToastStore';
import userService from '../../services/userService';

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, role } = useAuthStore();
  const { success, error: showError, warning } = useToastStore();
  
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'active', 'inactive'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'approve' or 'reject'
  const [backendNotAvailable, setBackendNotAvailable] = useState(false);

  // Check if user is SUPERADMIN
  useEffect(() => {
    if (role !== 'SUPERADMIN') {
      showError('Access Denied: Only SUPER_ADMIN can access this page');
      navigate('/dashboard');
    }
  }, [role, navigate, showError]);

  // Fetch users and pending requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersResponse, requestsResponse] = await Promise.all([
          userService.getAllUsers(),
          userService.getPendingRequests(),
        ]);

        console.log('Users Response:', usersResponse);
        console.log('Requests Response:', requestsResponse);

        if (usersResponse.success || usersResponse.data) {
          // Handle multiple response formats
          let usersData = [];
          
          if (Array.isArray(usersResponse.data)) {
            // Format: { success: true, data: [...] }
            usersData = usersResponse.data;
          } else if (usersResponse.data?.users && Array.isArray(usersResponse.data.users)) {
            // Format: { success: true, data: { users: [...] } }
            usersData = usersResponse.data.users;
          } else if (Array.isArray(usersResponse.users)) {
            // Format: { success: true, users: [...] }
            usersData = usersResponse.users;
          }
          
          console.log('Setting users:', usersData);
          setUsers(usersData);
        } else {
          console.log('Users response not successful:', usersResponse);
          setUsers([]);
        }
        
        if (requestsResponse.success || requestsResponse.data) {
          // Handle multiple response formats
          let requestsData = [];
          
          if (Array.isArray(requestsResponse.data)) {
            // Format: { success: true, data: [...] }
            requestsData = requestsResponse.data;
          } else if (requestsResponse.data?.pendingRequests && Array.isArray(requestsResponse.data.pendingRequests)) {
            // Format: { success: true, data: { pendingRequests: [...] } }
            requestsData = requestsResponse.data.pendingRequests;
          } else if (requestsResponse.data?.users && Array.isArray(requestsResponse.data.users)) {
            // Format: { success: true, data: { users: [...] } }
            requestsData = requestsResponse.data.users;
          } else if (Array.isArray(requestsResponse.pendingRequests)) {
            // Format: { success: true, pendingRequests: [...] }
            requestsData = requestsResponse.pendingRequests;
          } else if (Array.isArray(requestsResponse.users)) {
            // Format: { success: true, users: [...] }
            requestsData = requestsResponse.users;
          }
          
          console.log('Setting pending requests:', requestsData);
          setPendingRequests(requestsData);
        } else {
          console.log('Requests response not successful:', requestsResponse);
          setPendingRequests([]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        
        // Check if it's a 404 error (backend endpoints not implemented)
        if (err.response?.status === 404) {
          setBackendNotAvailable(true);
          showError('Backend API endpoints not implemented yet. Please implement user management routes on the backend.');
        } else {
          showError(err.response?.data?.message || 'Failed to load user data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (role === 'SUPERADMIN') {
      fetchData();
    }
  }, [role, showError]);

  // Filter users based on active tab and filters
  const getFilteredUsers = () => {
    let filtered = users || [];

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = pendingRequests || [];
    } else if (activeTab === 'active') {
      // Active users: status is ACTIVE and isVerified is true
      filtered = (users || []).filter(u => u?.status === 'ACTIVE' && u?.isVerified === true);
    } else if (activeTab === 'inactive') {
      // Inactive users: status is INACTIVE or not verified
      filtered = (users || []).filter(u => u?.status === 'INACTIVE' || u?.isVerified === false);
    }

    // Filter by role
    if (filterRole !== 'ALL') {
      filtered = filtered.filter(u => u?.role === filterRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Handle approve user
  const handleApprove = async (userId) => {
    console.log('Approving user with ID:', userId);
    try {
      const response = await userService.approveUser(userId);
      console.log('Approve response:', response);
      
      if (response.success) {
        success('User approved successfully! Account is now verified and active.');
        
        // Remove from pending requests
        setPendingRequests(prev => {
          const updated = prev.filter(u => u.id !== userId);
          console.log('Updated pending requests:', updated);
          return updated;
        });
        
        // Fetch the updated user and add to users list
        try {
          const updatedUserResponse = await userService.getUserById(userId);
          console.log('Fetched updated user:', updatedUserResponse);
          
          if (updatedUserResponse.success) {
            const updatedUser = updatedUserResponse.data;
            setUsers(prev => {
              const updated = [...prev, updatedUser];
              console.log('Updated users list:', updated);
              return updated;
            });
          }
        } catch (fetchErr) {
          console.error('Failed to fetch updated user:', fetchErr);
          // Even if fetch fails, the approval was successful
          // Just refresh the page data
          setTimeout(() => window.location.reload(), 1000);
        }
      } else {
        console.error('Approval not successful:', response);
        showError(response.message || 'Failed to approve user');
      }
    } catch (err) {
      console.error('Approve user error:', err);
      console.error('Error details:', err.response?.data);
      showError(err.response?.data?.message || 'Failed to approve user. Please try again.');
    } finally {
      setShowApprovalModal(false);
      setSelectedUser(null);
    }
  };

  // Handle reject user
  const handleReject = async (userId, reason) => {
    try {
      const response = await userService.rejectUser(userId, reason);
      if (response.success) {
        warning('User access request rejected');
        setPendingRequests(prev => prev.filter(u => u.id !== userId));
      }
    } catch (err) {
      showError('Failed to reject user');
    } finally {
      setShowApprovalModal(false);
      setSelectedUser(null);
    }
  };

  // Handle change role
  const handleChangeRole = async (userId, newRole) => {
    try {
      const response = await userService.changeUserRole(userId, newRole);
      if (response.success) {
        success(`User role changed to ${newRole}`);
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      showError('Failed to change user role');
    } finally {
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  // Handle deactivate/activate user
  const handleToggleActive = async (userId, isActive) => {
    try {
      const response = isActive
        ? await userService.deactivateUser(userId)
        : await userService.activateUser(userId);
      
      if (response.success) {
        success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, status: isActive ? 'INACTIVE' : 'ACTIVE' } : u))
        );
      }
    } catch (err) {
      console.error('Toggle active error:', err);
      showError(err.response?.data?.message || `Failed to ${isActive ? 'deactivate' : 'activate'} user`);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'USER':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Safely get filtered users
  let filteredUsers = [];
  try {
    const result = getFilteredUsers();
    filteredUsers = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Error filtering users:', error);
    filteredUsers = [];
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Show backend not available message
  if (backendNotAvailable) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <FaExclamationTriangle className="text-yellow-400 text-3xl mr-4 shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-yellow-800 mb-2">
                  Backend API Not Available
                </h3>
                <p className="text-yellow-700 mb-4">
                  The user management API endpoints are not implemented yet on the backend server.
                </p>
                <div className="bg-white rounded-md p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Required Backend Routes:</h4>
                  <ul className="text-sm text-gray-700 space-y-1 font-mono">
                    <li>• GET /api/v1/users</li>
                    <li>• GET /api/v1/users/pending-requests</li>
                    <li>• GET /api/v1/users/:id</li>
                    <li>• POST /api/v1/users/:id/approve</li>
                    <li>• POST /api/v1/users/:id/reject</li>
                    <li>• PATCH /api/v1/users/:id/role</li>
                    <li>• PATCH /api/v1/users/:id</li>
                    <li>• POST /api/v1/users/:id/activate</li>
                    <li>• POST /api/v1/users/:id/deactivate</li>
                    <li>• DELETE /api/v1/users/:id</li>
                  </ul>
                </div>
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> The frontend is fully implemented. Please implement these endpoints on the backend (http://localhost:8080) to enable user management functionality.
                </p>
                <button
                  onClick={() => {
                    setBackendNotAvailable(false);
                    window.location.reload();
                  }}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#003d82] flex items-center gap-3">
              <FaUsers />
              User Management
            </h2>
            <p className="text-gray-600 mt-2">
              Manage user access, roles, and permissions
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-3xl font-bold text-gray-800">{Array.isArray(users) ? users.length : 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">Pending Requests</p>
            <p className="text-3xl font-bold text-gray-800">{Array.isArray(pendingRequests) ? pendingRequests.length : 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-3xl font-bold text-gray-800">
              {Array.isArray(users) ? users.filter(u => u?.status === 'ACTIVE' && u?.isVerified === true).length : 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Inactive Users</p>
            <p className="text-3xl font-bold text-gray-800">
              {Array.isArray(users) ? users.filter(u => u?.status === 'INACTIVE' || u?.isVerified === false).length : 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: 'All Users', count: Array.isArray(users) ? users.length : 0 },
              { key: 'pending', label: 'Pending Requests', count: Array.isArray(pendingRequests) ? pendingRequests.length : 0 },
              { key: 'active', label: 'Active', count: Array.isArray(users) ? users.filter(u => u?.status === 'ACTIVE' && u?.isVerified === true).length : 0 },
              { key: 'inactive', label: 'Inactive', count: Array.isArray(users) ? users.filter(u => u?.status === 'INACTIVE' || u?.isVerified === false).length : 0 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-[#003d82] text-[#003d82] bg-blue-50'
                    : 'text-gray-600 hover:text-[#003d82] hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82]"
                />
              </div>
              <div className="relative">
                <FaFilter className="absolute left-3 top-3 text-gray-400" />
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003d82]"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPERADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">User</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaUsers className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No users found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user?.id || Math.random()} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-[#003d82] flex items-center justify-center text-white font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.employeeId && (
                              <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!user.isVerified ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        ) : user.status === 'ACTIVE' ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? dayjs(user.createdAt).format('DD MMM YYYY') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {!user.isVerified ? (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setModalAction('approve');
                                  setShowApprovalModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Approve"
                              >
                                <FaCheckCircle className="text-lg" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setModalAction('reject');
                                  setShowApprovalModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <FaTimesCircle className="text-lg" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRoleModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Change Role"
                              >
                                <FaUserEdit className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(user.id, user.status === 'ACTIVE')}
                                className={`${
                                  user.status === 'ACTIVE' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                }`}
                                title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              >
                                {user.status === 'ACTIVE' ? <FaUserTimes className="text-lg" /> : <FaUserCheck className="text-lg" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#003d82] mb-4">Change User Role</h3>
            <p className="text-gray-700 mb-4">
              Change role for <strong>{selectedUser.name}</strong>
            </p>
            <div className="space-y-3 mb-6">
              {['SUPERADMIN', 'ADMIN', 'USER'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(selectedUser.id, role)}
                  className={`w-full px-4 py-3 rounded-md border-2 font-medium transition-colors ${
                    selectedUser.role === role
                      ? 'border-[#003d82] bg-[#003d82] text-white'
                      : 'border-gray-300 hover:border-[#003d82] hover:bg-blue-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
              }}
              className="w-full px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {modalAction === 'approve' ? (
                <FaCheckCircle className="text-3xl text-green-500" />
              ) : (
                <FaTimesCircle className="text-3xl text-red-500" />
              )}
              <h3 className="text-xl font-bold text-[#003d82]">
                {modalAction === 'approve' ? 'Approve User' : 'Reject User'}
              </h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to {modalAction} access for <strong>{selectedUser.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (modalAction === 'approve') {
                    handleApprove(selectedUser.id);
                  } else {
                    handleReject(selectedUser.id, 'Request rejected by admin');
                  }
                }}
                className={`flex-1 px-4 py-3 rounded-md font-medium text-white transition-colors ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {modalAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserManagementPage;
