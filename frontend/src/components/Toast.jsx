import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ 
  type = 'info', // 'success', 'error', 'warning', 'info'
  message, 
  onClose,
  duration = 3000 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-green-600',
      icon: <FaCheckCircle />,
    },
    error: {
      bg: 'bg-red-600',
      icon: <FaExclamationTriangle />,
    },
    warning: {
      bg: 'bg-yellow-600',
      icon: <FaExclamationTriangle />,
    },
    info: {
      bg: 'bg-blue-600',
      icon: <FaInfoCircle />,
    },
  };

  const style = config[type] || config.info;

  return (
    <div className={`fixed top-4 right-4 z-50 ${style.bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in-right`}>
      <div className="flex-shrink-0 text-xl">{style.icon}</div>
      <p className="flex-1 font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default Toast;
