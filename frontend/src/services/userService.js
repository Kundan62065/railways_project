import api from './api';

/**
 * User Management Service (SUPERADMIN Only)
 * All routes require SUPERADMIN role and Authorization header
 */
const userService = {
  /**
   * Get all users with optional filters
   * GET /users
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status (ACTIVE, INACTIVE, PENDING)
   * @param {string} params.role - Filter by role (USER, ADMIN, SUPERADMIN)
   * @param {boolean} params.isVerified - Filter by verification status
   * @param {number} params.page - Page number for pagination
   * @param {number} params.limit - Number of items per page
   * @returns {Promise<Object>} - { success, data: users[], pagination }
   */
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Get pending access requests
   * GET /users/pending-requests
   * @returns {Promise<Object>} - { success, data: users[] }
   */
  getPendingRequests: async () => {
    const response = await api.get('/users/pending-requests');
    return response.data;
  },

  /**
   * Get user by ID
   * GET /users/:id
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, data: user }
   */
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Approve user access request
   * POST /users/:id/approve
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, message, data: user }
   */
  approveUser: async (userId) => {
    const response = await api.post(`/users/${userId}/approve`);
    return response.data;
  },

  /**
   * Reject user access request
   * POST /users/:id/reject
   * @param {string} userId - User ID
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} - { success, message }
   */
  rejectUser: async (userId, reason) => {
    const response = await api.post(`/users/${userId}/reject`, { reason });
    return response.data;
  },

  /**
   * Change user role
   * PATCH /users/:id/role
   * @param {string} userId - User ID
   * @param {string} role - New role (USER, ADMIN, SUPERADMIN)
   * @returns {Promise<Object>} - { success, message, data: user }
   */
  changeUserRole: async (userId, role) => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Update user details
   * PATCH /users/:id
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - { success, message, data: user }
   */
  updateUser: async (userId, userData) => {
    const response = await api.patch(`/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Activate user
   * POST /users/:id/activate
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, message, data: user }
   */
  activateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/activate`);
    return response.data;
  },

  /**
   * Deactivate user
   * POST /users/:id/deactivate
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, message, data: user }
   */
  deactivateUser: async (userId) => {
    const response = await api.post(`/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Delete user (hard delete - use with caution)
   * DELETE /users/:id
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, message }
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};

export default userService;
