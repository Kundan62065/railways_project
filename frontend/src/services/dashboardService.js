import api from './api';

const dashboardService = {
  /**
   * Get comprehensive dashboard statistics
   * @returns {Promise} - Dashboard stats
   */
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  /**
   * Get recent activities (duty logs)
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of activities (1-100)
   * @param {number} params.offset - Offset for pagination
   * @param {string} params.type - Filter by activity type (optional)
   * @returns {Promise} - Recent activities
   */
  getRecentActivities: async (params = {}) => {
    const response = await api.get('/dashboard/recent-activities', { params });
    return response.data;
  },

  /**
   * Get shift trends over time
   * @param {number} days - Number of days (1-90)
   * @returns {Promise} - Shift trends
   */
  getTrends: async (days = 7) => {
    const response = await api.get('/dashboard/trends', { params: { days } });
    return response.data;
  },

  /**
   * Get alerts summary with shift details
   * @returns {Promise} - Alerts summary
   */
  getAlertsSummary: async () => {
    const response = await api.get('/dashboard/alerts-summary');
    return response.data;
  },
};

export default dashboardService;
