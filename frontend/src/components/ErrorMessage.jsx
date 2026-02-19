import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

const ErrorMessage = ({ 
  title = 'Error', 
  message = 'Something went wrong. Please try again.', 
  onRetry = null,
  fullScreen = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="bg-red-100 p-6 rounded-full">
        <FaExclamationTriangle className="text-5xl text-red-600" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-3 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-medium flex items-center gap-2"
        >
          <FaRedo />
          Try Again
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      {content}
    </div>
  );
};

export default ErrorMessage;
