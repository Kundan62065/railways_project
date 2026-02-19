import { useState } from 'react';
import { FaBell, FaChevronDown, FaChevronUp, FaTimes, FaTrain, FaClock } from 'react-icons/fa';
import dayjs from 'dayjs';

const LEVEL_COLORS = {
  '7HR': { bg: 'bg-blue-500', text: 'text-blue-50', dot: 'bg-blue-300', icon: '🔵' },
  '8HR': { bg: 'bg-yellow-500', text: 'text-yellow-50', dot: 'bg-yellow-300', icon: '⚠️' },
  '9HR': { bg: 'bg-orange-500', text: 'text-orange-50', dot: 'bg-orange-300', icon: '🟠' },
  '10HR': { bg: 'bg-red-500', text: 'text-red-50', dot: 'bg-red-300', icon: '🔴' },
  '11HR': { bg: 'bg-red-700', text: 'text-red-50', dot: 'bg-red-300', icon: '🚨' },
  '14HR': { bg: 'bg-red-900', text: 'text-red-50', dot: 'bg-red-400', icon: '‼️' },
};

const DutyAlertBanner = ({ alerts, onOpenAlert, onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  // Show only most recent/critical if collapsed
  const latestAlert = alerts[0];
  const colors = LEVEL_COLORS[latestAlert.alertType] || LEVEL_COLORS['8HR'];

  return (
    <div className={`w-full shadow-lg rounded-lg overflow-hidden border-l-4 border-white/30 ${colors.bg}`}>
      
      {/* Main Banner Row */}
      <div className="flex items-center px-4 py-3 gap-3">
        <div className="flex-shrink-0 animate-pulse">
          <FaBell className={`${colors.text} text-lg`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${colors.text}`}>
            {colors.icon} {alerts.length} Duty Alert{alerts.length > 1 ? 's' : ''} Require Attention
          </div>
          <div className={`text-xs ${colors.text} opacity-80 truncate`}>
            Latest: Train {latestAlert.trainNumber} — {latestAlert.alertType} alert for {latestAlert.locoPilot?.name}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View button */}
          <button
            onClick={() => onOpenAlert(latestAlert)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 ${colors.text} transition-colors`}
          >
            View
          </button>
          
          {/* Expand/Collapse for multiple alerts */}
          {alerts.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`${colors.text} hover:opacity-70 transition-opacity`}
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded alert list */}
      {isExpanded && alerts.length > 1 && (
        <div className="border-t border-white/20 bg-black/10">
          {alerts.map((alert, idx) => {
            const c = LEVEL_COLORS[alert.alertType] || LEVEL_COLORS['8HR'];
            const elapsed = dayjs().diff(dayjs(alert.signOnDateTime), 'hour');
            return (
              <div
                key={alert.id || idx}
                className="flex items-center px-4 py-2 gap-3 border-b border-white/10 last:border-0 hover:bg-black/10 cursor-pointer transition-colors"
                onClick={() => onOpenAlert(alert)}
              >
                <span className="text-base">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${colors.text}`}>
                    Train {alert.trainNumber} — {alert.alertType}
                  </div>
                  <div className={`text-xs ${colors.text} opacity-70`}>
                    {alert.locoPilot?.name} • {elapsed}h on duty
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-white/20 ${colors.text} font-medium`}>
                  {alert.alertType}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DutyAlertBanner;
