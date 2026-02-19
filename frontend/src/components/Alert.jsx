import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Alert = ({ 
  type = 'info', // 'success', 'error', 'warning', 'info'
  title,
  message, 
  onClose = null 
}) => {
  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <FaCheckCircle className="text-green-600" />,
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <FaExclamationTriangle className="text-red-600" />,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <FaExclamationTriangle className="text-yellow-600" />,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <FaInfoCircle className="text-blue-600" />,
    },
  };

  const style = config[type] || config.info;

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          {title && (
            <h4 className={`font-semibold ${style.text} mb-1`}>{title}</h4>
          )}
          <p className={`text-sm ${style.text}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
