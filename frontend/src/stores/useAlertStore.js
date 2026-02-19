import { create } from 'zustand';
import dayjs from 'dayjs';
import shiftService from '../services/shiftService';

const useAlertStore = create((set, get) => ({
  // State
  alerts: [],
  pendingAlerts: [],
  showAlertModal: false,
  currentAlert: null,
  alertLogs: {}, // Store logs per shift: { shiftId: [logs] }

  // Alert Configuration (based on backend alerts)
  alertThresholds: {
    7: {
      level: 'info',
      title: '7 Hour Notification',
      message: 'Duty hours have reached 7 hours. Monitor crew status closely.',
      requiresAction: false,
      priority: 'low',
      color: 'blue',
    },
    8: {
      level: 'warning',
      title: '8 Hour Alert - Action Required',
      message: 'Duty hours have reached 8 hours. Please plan relief arrangements.',
      requiresAction: true,
      priority: 'medium',
      color: 'yellow',
      alertType: '8HR',
      options: [
        { 
          id: 'PLAN_RELIEF', 
          label: 'Plan to get relief', 
          type: 'warning',
          icon: '📋',
          nextAction: 'Updates shift status to RELIEF_PLANNED'
        },
        { 
          id: 'RELIEF_NOT_REQUIRED', 
          label: 'Relief not required', 
          type: 'primary',
          icon: '✓',
          nextAction: 'Continues duty'
        },
      ],
    },
    9: {
      level: 'warning',
      title: '9 Hour Alert - Relief Status',
      message: 'Duty hours have reached 9 hours. Update crew relief status.',
      requiresAction: true,
      priority: 'high',
      color: 'orange',
      alertType: '9HR',
      options: [
        { 
          id: 'CREW_RELIEVED', 
          label: 'Crew will be relieved', 
          type: 'success',
          icon: '👥',
          nextAction: 'Completes shift'
        },
        { 
          id: 'CREW_NOT_BOOKED', 
          label: 'Crew not booked', 
          type: 'danger',
          icon: '⚠️',
          nextAction: 'Escalates issue'
        },
      ],
    },
    10: {
      level: 'danger',
      title: '10 Hour Critical Alert',
      message: 'CRITICAL: Duty hours have reached 10 hours. Immediate relief arrangement required!',
      requiresAction: true,
      priority: 'high',
      color: 'red',
      alertType: '10HR',
      options: [
        { 
          id: 'RELIEF_ARRANGED', 
          label: 'Relief arranged', 
          type: 'success',
          icon: '✓',
          nextAction: 'Updates shift to RELIEF_PLANNED'
        },
        { 
          id: 'CONTINUE_DUTY', 
          label: 'Continue duty (approval required)', 
          type: 'warning',
          icon: '📞',
          nextAction: 'Continues with monitoring'
        },
      ],
    },
    11: {
      level: 'critical',
      title: '⚠️ 11 Hour DANGER - Critical Duty Hours',
      message: 'DANGER ZONE: Train has entered critical duty hours (11+). Immediate action mandatory!',
      requiresAction: true,
      priority: 'critical',
      color: 'red',
      alertType: '11HR',
      options: [
        { 
          id: 'KEEP_ON', 
          label: 'Keep on duty (emergency)', 
          type: 'danger',
          icon: '🚨',
          nextAction: 'Continues with critical monitoring'
        },
        { 
          id: 'CREW_ALREADY_RELIEVED', 
          label: 'Crew already relieved', 
          type: 'success',
          icon: '✓',
          nextAction: 'Completes shift'
        },
      ],
    },
    14: {
      level: 'critical',
      title: '🚨 14 Hour MAXIMUM LIMIT REACHED',
      message: 'MAXIMUM DUTY HOURS EXCEEDED! This is the final alert. Relief is MANDATORY.',
      requiresAction: true,
      priority: 'critical',
      color: 'red',
      alertType: '14HR',
      options: [
        { 
          id: 'EMERGENCY_RELIEF', 
          label: 'Emergency relief required', 
          type: 'danger',
          icon: '🚨',
          nextAction: 'Escalates to emergency'
        },
        { 
          id: 'SHIFT_ENDING', 
          label: 'Shift ending now', 
          type: 'success',
          icon: '✓',
          nextAction: 'Initiates completion process'
        },
      ],
    },
  },

  // Create alert for a shift (local creation)
  createAlert: (shift, threshold, dutyHours) => {
    const config = get().alertThresholds[threshold];
    if (!config) return null;

    const alert = {
      id: `alert_${shift.id}_${threshold}_${Date.now()}`,
      shiftId: shift.id,
      trainNumber: shift.trainNumber,
      locoPilot: shift.locoPilot,
      threshold,
      dutyHours,
      ...config,
      createdAt: dayjs().toISOString(),
      status: 'pending', // pending, acknowledged, responded
      response: null,
    };

    set((state) => ({
      alerts: [alert, ...state.alerts],
      pendingAlerts: [alert, ...state.pendingAlerts],
    }));

    // Auto-show modal for action-required alerts
    if (config.requiresAction) {
      get().showModal(alert);
    }

    return alert;
  },

  // Play alert sound
  playAlertSound: () => {
    try {
      const audio = new Audio('/alert-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch((e) => console.log('Could not play alert sound:', e));
    } catch (error) {
      console.log('Alert sound not available');
    }
  },

  // Show alert modal
  showModal: (alert) => {
    set({
      showAlertModal: true,
      currentAlert: alert,
    });
  },

  // Hide alert modal
  hideModal: () => {
    set({
      showAlertModal: false,
      currentAlert: null,
    });
  },

  // Respond to alert
  respondToAlert: async (alertId, response, remarks = null) => {
    const alert = get().alerts.find((a) => a.id === alertId);
    if (!alert) return;

    const responseData = {
      optionId: response.id,
      label: response.label,
      respondedAt: dayjs().toISOString(),
      nextAction: response.nextAction,
    };

    try {
      // Send response to backend
      const config = get().alertThresholds[alert.threshold];
      await shiftService.submitAlertResponse(alert.shiftId, {
        alertType: config.alertType,
        response: response.id,
        remarks: remarks || `Selected: ${response.label}`,
      });

      console.log('✅ Alert response submitted to backend:', {
        shiftId: alert.shiftId,
        alertType: config.alertType,
        response: response.id,
      });

      // Update alert status in store
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === alertId
            ? { ...a, status: 'responded', response: responseData }
            : a
        ),
        pendingAlerts: state.pendingAlerts.filter((a) => a.id !== alertId),
      }));

      // Add to shift logs
      get().addToShiftLog(alert.shiftId, {
        type: 'alert_response',
        threshold: alert.threshold,
        alert: alert.title,
        response: responseData,
        dutyHours: alert.dutyHours,
        timestamp: dayjs().toISOString(),
      });

      return responseData;
    } catch (error) {
      console.error('❌ Failed to submit alert response:', error);
      throw error;
    }
  },

  // Acknowledge info-only alert
  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: 'acknowledged' } : a
      ),
      pendingAlerts: state.pendingAlerts.filter((a) => a.id !== alertId),
    }));

    const alert = get().alerts.find((a) => a.id === alertId);
    if (alert) {
      get().addToShiftLog(alert.shiftId, {
        type: 'alert_acknowledged',
        threshold: alert.threshold,
        alert: alert.title,
        timestamp: dayjs().toISOString(),
      });
    }
  },

  // Add entry to shift log
  addToShiftLog: (shiftId, logEntry) => {
    set((state) => ({
      alertLogs: {
        ...state.alertLogs,
        [shiftId]: [...(state.alertLogs[shiftId] || []), logEntry],
      },
    }));
  },

  // Get logs for a shift
  getShiftLogs: (shiftId) => {
    return get().alertLogs[shiftId] || [];
  },

  // Get pending alerts for a shift
  getPendingAlertsForShift: (shiftId) => {
    return get().pendingAlerts.filter((a) => a.shiftId === shiftId);
  },

  // Get all alerts for a shift
  getAlertsForShift: (shiftId) => {
    return get().alerts.filter((a) => a.shiftId === shiftId);
  },

  // Clear alerts for a shift (when shift is released)
  clearShiftAlerts: (shiftId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.shiftId !== shiftId),
      pendingAlerts: state.pendingAlerts.filter((a) => a.shiftId !== shiftId),
    }));
  },

  // Get summary stats
  getStats: () => {
    const alerts = get().alerts;
    return {
      total: alerts.length,
      pending: get().pendingAlerts.length,
      critical: alerts.filter((a) => a.priority === 'critical').length,
      high: alerts.filter((a) => a.priority === 'high').length,
      responded: alerts.filter((a) => a.status === 'responded').length,
    };
  },
}));

export default useAlertStore;
