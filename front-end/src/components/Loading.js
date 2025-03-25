import React from 'react';

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mr-3"></div>
      <span className="text-amber-700">{message}</span>
    </div>
  );
};

export default Loading;