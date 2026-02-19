import { create } from 'zustand';
import dayjs from 'dayjs';

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  showNotificationModal: false,
  currentNotification: null,

  // Actions
  addNotification: (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      timestamp: dayjs().toISOString(),
      read: false,
      acknowledged: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Auto-show modal for critical notifications
    if (notification.priority === 'critical' || notification.priority === 'high') {
      set({
        showNotificationModal: true,
        currentNotification: newNotification,
      });
    }

    return newNotification;
  },

  createDutyHourNotification: (shift, dutyHours, threshold) => {
    const notificationTexts = {
      8: {
        title: '8 Hour Alert',
        message: `Duty hours have reached 8 hours for ${shift.locoPilot.name}`,
        priority: 'medium',
        color: 'blue',
      },
      9: {
        title: '9 Hour Alert - Action Required',
        message: `Duty hours have reached 9 hours for ${shift.locoPilot.name}. Please decide on relief planning.`,
        priority: 'high',
        color: 'yellow',
        requiresAction: true,
        actions: [
          { label: 'Plan Relief', value: 'plan_relief', type: 'danger' },
          { label: 'Continue Tracking', value: 'continue', type: 'primary' },
        ],
      },
      11: {
        title: '11 Hour Warning',
        message: `Duty hours have reached 11 hours for ${shift.locoPilot.name}. Consider relief planning.`,
        priority: 'high',
        color: 'orange',
        requiresAction: true,
        actions: [
          { label: 'Plan Relief', value: 'plan_relief', type: 'danger' },
          { label: 'Continue Tracking', value: 'continue', type: 'primary' },
        ],
      },
      12: {
        title: '12 Hour DANGER Alert',
        message: `DANGER: Duty hours have reached 12 hours for ${shift.locoPilot.name}. Immediate attention required!`,
        priority: 'critical',
        color: 'red',
        requiresAction: true,
        actions: [
          { label: 'Plan Relief NOW', value: 'plan_relief', type: 'danger' },
          { label: 'Continue (Override)', value: 'continue', type: 'primary' },
        ],
      },
      14: {
        title: '14 Hour CRITICAL Alert',
        message: `CRITICAL: Duty hours have exceeded 14 hours for ${shift.locoPilot.name}. Maximum limit reached!`,
        priority: 'critical',
        color: 'red',
        requiresAction: true,
        actions: [
          { label: 'Plan Relief Immediately', value: 'plan_relief', type: 'danger' },
        ],
      },
    };

    const config = notificationTexts[threshold] || notificationTexts[8];

    const notification = get().addNotification({
      type: 'duty_hour_alert',
      shiftId: shift.id,
      trainNumber: shift.trainNumber,
      threshold,
      dutyHours,
      ...config,
    });

    return notification;
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  acknowledgeNotification: (notificationId, response) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId
          ? { ...n, acknowledged: true, response, respondedAt: dayjs().toISOString() }
          : n
      ),
    }));
  },

  deleteNotification: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === notificationId);
      return {
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: notification && !notification.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    });
  },

  clearAllNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  showModal: (notification) => {
    set({
      showNotificationModal: true,
      currentNotification: notification,
    });
  },

  hideModal: () => {
    set({
      showNotificationModal: false,
      currentNotification: null,
    });
  },

  getUnreadNotifications: () => {
    return get().notifications.filter((n) => !n.read);
  },

  getNotificationsByShift: (shiftId) => {
    return get().notifications.filter((n) => n.shiftId === shiftId);
  },

  getPendingActions: () => {
    return get().notifications.filter(
      (n) => n.requiresAction && !n.acknowledged
    );
  },
}));

export default useNotificationStore;
