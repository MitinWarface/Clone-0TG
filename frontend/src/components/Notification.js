import React, { useEffect } from 'react';

const Notification = ({ message, type, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const getStyles = () => {
    const baseStyles = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-6 rounded-lg shadow-2xl max-w-md text-center transition-all duration-300 scale-100";

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white border-2 border-green-400`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white border-2 border-red-400`;
      case 'info':
        return `${baseStyles} bg-blue-500 text-white border-2 border-blue-400`;
      default:
        return `${baseStyles} bg-gray-500 text-white border-2 border-gray-400`;
    }
  };

  return (
    <div className={getStyles()}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;