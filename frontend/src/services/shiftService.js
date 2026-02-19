import api from './api';

const shiftService = {
  /**
   * Create a new shift
   * @param {Object} shiftData - Shift details
   * @returns {Promise} - Created shift data
   */
  createShift: async (shiftData) => {
    const response = await api.post('/shifts', shiftData);
    return response.data;
  },

  /**
   * Get all shifts with pagination
   * @param {Object} filters - Optional filters (status, page, limit, etc.)
   * @returns {Promise} - { data: Array of shifts, pagination: { total, page, limit, pages } }
   */
  getAllShifts: async (filters = {}) => {
    const response = await api.get('/shifts', { params: filters });
    return response.data; // Returns { success, data, pagination }
  },

  /**
   * Get shift by ID
   * @param {string} shiftId
   * @returns {Promise} - Shift details
   */
  getShiftById: async (shiftId) => {
    const response = await api.get(`/shifts/${shiftId}`);
    return response.data;
  },

  /**
   * Update shift
   * @param {string} shiftId
   * @param {Object} updateData
   * @returns {Promise} - Updated shift data
   */
  updateShift: async (shiftId, updateData) => {
    const response = await api.patch(`/shifts/${shiftId}`, updateData);
    return response.data;
  },

  /**
   * Delete shift
   * @param {string} shiftId
   * @returns {Promise}
   */
  deleteShift: async (shiftId) => {
    const response = await api.delete(`/shifts/${shiftId}`);
    return response.data;
  },

  /**
   * Get active shifts only
   * @returns {Promise} - Array of active shifts
   */
  getActiveShifts: async () => {
    const response = await api.get('/shifts/active');
    return response.data;
  },

  /**
   * Get shift logs
   * @param {string} shiftId
   * @returns {Promise} - Shift logs/alerts history
   */
  getShiftLogs: async (shiftId) => {
    const response = await api.get(`/shifts/${shiftId}/logs`);
    return response.data;
  },

  /**
   * Complete a shift
   * @param {string} shiftId
   * @param {Object} signOffData - Sign off details (signOffTime, signOffDate, signOffStation)
   * @returns {Promise} - Completed shift data
   */
  completeShift: async (shiftId, signOffData) => {
    const response = await api.post(`/shifts/${shiftId}/complete`, signOffData);
    return response.data;
  },

  /**
   * Submit alert response
   * @param {string} shiftId
   * @param {Object} responseData - { alertType, response, remarks }
   * @returns {Promise} - Response confirmation
   */
  submitAlertResponse: async (shiftId, responseData) => {
    const response = await api.post(`/shifts/${shiftId}/alert-response`, responseData);
    return response.data;
  },

  /**
   * Get shift alert history
   * @param {string} shiftId
   * @returns {Promise} - Alert history
   */
  getShiftAlertHistory: async (shiftId) => {
    const response = await api.get(`/shifts/${shiftId}/alerts`);
    return response.data;
  },

  /**
   * Get active shifts summary (for dashboard)
   * @returns {Promise} - Summary of active shifts
   */
  getActiveShiftsSummary: async () => {
    const response = await api.get('/shifts/active/summary');
    return response.data;
  },
};

export default shiftService;
