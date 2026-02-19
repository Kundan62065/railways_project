import { FaTrain } from 'react-icons/fa';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Rotating train icon */}
        <FaTrain className="text-6xl text-[#003d82] animate-bounce" />
        <div className="absolute inset-0 border-4 border-t-[#003d82] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-lg font-medium text-gray-700">{message}</p>
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-[#003d82] rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-[#003d82] rounded-full animate-pulse delay-100"></div>
        <div className="w-2 h-2 bg-[#003d82] rounded-full animate-pulse delay-200"></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/95 flex items-center justify-center z-50">
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

export default LoadingSpinner;
