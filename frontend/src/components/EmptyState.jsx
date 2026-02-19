import { FaTrain } from 'react-icons/fa';

const EmptyState = ({ 
  icon: Icon = FaTrain,
  title = 'No Data Available', 
  message = 'There is no data to display at the moment.', 
  action = null,
  actionLabel = 'Get Started' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="bg-gray-100 p-8 rounded-full mb-6">
        <Icon className="text-6xl text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{message}</p>
      {action && (
        <button
          onClick={action}
          className="px-6 py-3 bg-[#003d82] text-white rounded-md hover:bg-[#002b5c] transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
