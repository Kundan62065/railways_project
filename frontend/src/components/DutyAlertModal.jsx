import { useState } from 'react';
import { FaTrain, FaUser, FaClock, FaExclamationTriangle, FaBell, FaTimes, FaCheckCircle, FaPhoneAlt } from 'react-icons/fa';
import dayjs from 'dayjs';
import shiftService from '../services/shiftService';
import useToastStore from '../stores/useToastStore';

// Alert level visual config
const ALERT_CONFIGS = {
  '7HR': {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    headerBg: 'bg-blue-600',
    badge: 'bg-blue-100 text-blue-800',
    icon: '🔵',
    level: 'INFO',
    levelColor: 'text-blue-600',
    requiresAction: false,
  },
  '8HR': {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    headerBg: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: '⚠️',
    level: 'WARNING',
    levelColor: 'text-yellow-600',
    requiresAction: true,
    options: [
      { id: 'PLAN_RELIEF', label: '📋 Plan to Get Relief', style: 'bg-orange-500 hover:bg-orange-600 text-white', description: 'Mark shift for relief planning' },
      { id: 'RELIEF_NOT_REQUIRED', label: '✓ Relief Not Required', style: 'bg-green-600 hover:bg-green-700 text-white', description: 'Continue duty normally' },
    ],
  },
  '9HR': {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    headerBg: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800',
    icon: '🟠',
    level: 'HIGH',
    levelColor: 'text-orange-600',
    requiresAction: true,
    options: [
      { id: 'CREW_RELIEVED', label: '👥 Crew Will Be Relieved', style: 'bg-green-600 hover:bg-green-700 text-white', description: 'Complete the shift' },
      { id: 'CREW_NOT_BOOKED', label: '⚠️ Crew Not Booked Yet', style: 'bg-red-500 hover:bg-red-600 text-white', description: 'Escalate the issue' },
    ],
  },
  '10HR': {
    bg: 'bg-red-50',
    border: 'border-red-500',
    headerBg: 'bg-red-600',
    badge: 'bg-red-100 text-red-800',
    icon: '🔴',
    level: 'CRITICAL',
    levelColor: 'text-red-600',
    requiresAction: true,
    options: [
      { id: 'RELIEF_ARRANGED', label: '✓ Relief Arranged', style: 'bg-green-600 hover:bg-green-700 text-white', description: 'Update to RELIEF_PLANNED' },
      { id: 'CONTINUE_DUTY', label: '📞 Continue (Approval Required)', style: 'bg-orange-500 hover:bg-orange-600 text-white', description: 'Continue with monitoring' },
    ],
  },
  '11HR': {
    bg: 'bg-red-100',
    border: 'border-red-600',
    headerBg: 'bg-red-700',
    badge: 'bg-red-200 text-red-900',
    icon: '🚨',
    level: 'DANGER',
    levelColor: 'text-red-700',
    requiresAction: true,
    options: [
      { id: 'KEEP_ON', label: '🚨 Keep On Duty (Emergency)', style: 'bg-red-600 hover:bg-red-700 text-white', description: 'Continue with critical monitoring' },
      { id: 'CREW_ALREADY_RELIEVED', label: '✓ Crew Already Relieved', style: 'bg-green-600 hover:bg-green-700 text-white', description: 'Complete the shift' },
    ],
  },
  '14HR': {
    bg: 'bg-red-200',
    border: 'border-red-700',
    headerBg: 'bg-red-900',
    badge: 'bg-red-300 text-red-900',
    icon: '‼️',
    level: 'MAXIMUM LIMIT',
    levelColor: 'text-red-800',
    requiresAction: true,
    options: [
      { id: 'EMERGENCY_RELIEF', label: '🚨 Emergency Relief Required', style: 'bg-red-700 hover:bg-red-800 text-white', description: 'Escalate to emergency' },
      { id: 'SHIFT_ENDING', label: '✓ Shift Ending Now', style: 'bg-green-600 hover:bg-green-700 text-white', description: 'Initiate completion' },
    ],
  },
};

const DutyAlertModal = ({ alert, onClose, onResponded }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const { success, error: showError } = useToastStore();

  if (!alert) return null;

  const alertType = alert.alertType;
  const config = ALERT_CONFIGS[alertType];
  if (!config) return null;

  const handleResponse = async (option) => {
    setIsSubmitting(true);
    try {
      await shiftService.submitAlertResponse(alert.shiftId, {
        alertType,
        response: option.id,
        remarks: remarks || `Selected: ${option.label}`,
      });

      success(`✅ Response recorded: ${option.label}`);
      onResponded?.({ alertId: alert.id, optionId: option.id, label: option.label });
      onClose();
    } catch (err) {
      showError('Failed to submit response. Please try again.');
      console.error('Alert response error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledge = () => {
    onResponded?.({ alertId: alert.id, acknowledged: true });
    onClose();
  };

  const signOnTime = dayjs(alert.signOnDateTime);
  const now = dayjs();
  const dutyHours = now.diff(signOnTime, 'hour');
  const dutyMinutes = now.diff(signOnTime, 'minute') % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      
      {/* Pulsing animation for critical alerts */}
      {(alertType === '11HR' || alertType === '14HR') && (
        <div className={`absolute inset-0 ${config.border} border-4 animate-pulse pointer-events-none rounded-none`} />
      )}

      <div className={`w-full max-w-lg rounded-xl shadow-2xl border-2 ${config.border} ${config.bg} overflow-hidden`}>
        
        {/* Header */}
        <div className={`${config.headerBg} text-white px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider opacity-90`}>
                  {config.level} ALERT
                </div>
                <h2 className="text-xl font-bold">
                  {alertType} Duty Hour Alert
                </h2>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        {/* Train & Pilot Info */}
        <div className="p-4 space-y-3">
          
          {/* Duty timer - big display */}
          <div className={`rounded-lg p-4 text-center border ${config.border} bg-white/50`}>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-1">
              <FaClock /> Duty Time Elapsed
            </div>
            <div className={`text-4xl font-bold ${config.levelColor}`}>
              {dutyHours}h {dutyMinutes}m
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Sign-on: {signOnTime.format('DD MMM YYYY, HH:mm')}
            </div>
          </div>

          {/* Train Info */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <FaTrain className="text-blue-600" />
              <span className="font-semibold">Train {alert.trainNumber}</span>
              {alert.trainName && <span className="text-gray-500 text-sm">({alert.trainName})</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Loco:</span>
                <span>{alert.locomotiveNo || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Section:</span>
                <span>{alert.section || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Staff Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <FaUser /> Loco Pilot
              </div>
              <div className="font-semibold text-gray-800 text-sm">{alert.locoPilot?.name || 'N/A'}</div>
              <div className="text-gray-500 text-xs">{alert.locoPilot?.employeeId || ''}</div>
              {alert.locoPilot?.phone && (
                <a href={`tel:${alert.locoPilot.phone}`}
                  className="flex items-center gap-1 text-blue-600 text-xs mt-1 hover:text-blue-800">
                  <FaPhoneAlt /> {alert.locoPilot.phone}
                </a>
              )}
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                <FaUser /> Train Manager
              </div>
              <div className="font-semibold text-gray-800 text-sm">{alert.trainManager?.name || 'N/A'}</div>
              <div className="text-gray-500 text-xs">{alert.trainManager?.employeeId || ''}</div>
              {alert.trainManager?.phone && (
                <a href={`tel:${alert.trainManager.phone}`}
                  className="flex items-center gap-1 text-blue-600 text-xs mt-1 hover:text-blue-800">
                  <FaPhoneAlt /> {alert.trainManager.phone}
                </a>
              )}
            </div>
          </div>

          {/* Alert message */}
          <div className={`rounded-lg p-3 border ${config.border} ${config.bg}`}>
            <p className={`text-sm font-medium ${config.levelColor}`}>
              {alert.options?.message || `Duty hours have reached ${alertType.replace('HR', '')} hours.`}
            </p>
          </div>

          {/* Remarks input */}
          {config.requiresAction && (
            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Remarks (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks or notes..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {config.requiresAction && config.options ? (
              config.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleResponse(option)}
                  disabled={isSubmitting}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${option.style} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Submitting...' : option.label}
                  <div className="text-xs font-normal opacity-80 mt-0.5">{option.description}</div>
                </button>
              ))
            ) : (
              <button
                onClick={handleAcknowledge}
                className="w-full py-3 px-4 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <FaCheckCircle className="inline mr-2" />
                Acknowledge
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            Alert received at {dayjs(alert.timestamp).format('HH:mm:ss')} • Train #{alert.trainNumber}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DutyAlertModal;
