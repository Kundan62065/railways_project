import { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socketService';
import useAuthStore from './useAuthStore';
import useToastStore from './useToastStore';

/**
 * Custom hook that:
 * 1. Connects to Socket.IO on login
 * 2. Listens for duty alerts from backend
 * 3. Maintains pending alerts queue
 * 4. Plays notification sound for new alerts
 */
const useSocketAlerts = () => {
  const token = useAuthStore((state) => state.token || localStorage.getItem('accessToken'));
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { warning, error: showError } = useToastStore();

  const [pendingAlerts, setPendingAlerts] = useState([]);
  const [currentModal, setCurrentModal] = useState(null); // Alert shown in modal
  const [socketConnected, setSocketConnected] = useState(false);
  const alertQueueRef = useRef([]);

  // Play notification beep
  const playAlertSound = useCallback((alertType) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      const isCritical = ['11HR', '14HR'].includes(alertType);
      const isHigh = ['9HR', '10HR'].includes(alertType);
      
      const playBeep = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.01);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration + 0.01);
      };

      if (isCritical) {
        // Urgent triple beep
        playBeep(880, 0, 0.15);
        playBeep(880, 0.2, 0.15);
        playBeep(880, 0.4, 0.3);
      } else if (isHigh) {
        // Double beep
        playBeep(660, 0, 0.2);
        playBeep(660, 0.3, 0.2);
      } else {
        // Single beep
        playBeep(520, 0, 0.3);
      }
    } catch (e) {
      // AudioContext not available in some environments
      console.log('Sound not available');
    }
  }, []);

  // Process incoming duty alert
  const handleDutyAlert = useCallback((alertData) => {
    console.log('🚨 Duty alert received:', alertData);

    const alert = {
      ...alertData,
      id: `${alertData.shiftId}_${alertData.alertType}_${Date.now()}`,
      receivedAt: new Date().toISOString(),
    };

    // Add to pending queue
    setPendingAlerts((prev) => {
      // Avoid duplicate alerts for same shift+type
      const exists = prev.some(
        (a) => a.shiftId === alert.shiftId && a.alertType === alert.alertType
      );
      if (exists) return prev;
      return [alert, ...prev];
    });

    // Play sound
    playAlertSound(alertData.alertType);

    // Show toast notification
    const isCritical = ['11HR', '14HR'].includes(alertData.alertType);
    const msg = `🚨 ${alertData.alertType} Alert: Train ${alertData.trainNumber} - ${alertData.locoPilot?.name}`;
    
    warning(msg);

    // Auto-open modal for critical alerts if none currently shown
    if (isCritical) {
      setCurrentModal((prev) => prev || alert);
    }
  }, [playAlertSound, warning]);

  // Handle shift updates (refresh data)
  const handleShiftUpdate = useCallback((data) => {
    console.log('📡 Shift update received:', data);
    // Trigger a custom event so pages can refresh their data
    window.dispatchEvent(new CustomEvent('shift:updated', { detail: data }));
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = socketService.initSocket(token);

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    const cleanupAlerts = socketService.subscribeToDutyAlerts(handleDutyAlert);
    const cleanupShifts = socketService.subscribeToShiftUpdates(handleShiftUpdate);

    return () => {
      cleanupAlerts();
      cleanupShifts();
      socketService.disconnectSocket();
      setSocketConnected(false);
    };
  }, [isAuthenticated, token, handleDutyAlert, handleShiftUpdate]);

  // Open a specific alert in modal
  const openAlert = useCallback((alert) => {
    setCurrentModal(alert);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setCurrentModal(null);
    // Auto-open next pending alert if any
    setPendingAlerts((prev) => {
      if (prev.length > 1) {
        const [, ...rest] = prev;
        const requiresAction = ['8HR', '9HR', '10HR', '11HR', '14HR'].includes(prev[0]?.alertType);
        // Don't auto-open non-critical ones
        return rest;
      }
      return prev;
    });
  }, []);

  // Mark alert as responded (remove from pending)
  const onAlertResponded = useCallback(({ alertId }) => {
    setPendingAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // Dismiss alert from banner
  const dismissAlert = useCallback((alertId) => {
    setPendingAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  return {
    pendingAlerts,
    currentModal,
    socketConnected,
    openAlert,
    closeModal,
    onAlertResponded,
    dismissAlert,
  };
};

export default useSocketAlerts;
