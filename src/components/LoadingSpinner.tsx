import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'blue',
  text = 'Loading...',
  fullScreen = false
}) => {
  const sizeClass = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }[size];

  const colorClass = `border-${color}-500`;

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'h-full' : ''}`}>
      <div className={`${sizeClass} animate-spin rounded-full border-t-2 border-b-2 ${colorClass}`}></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );

    if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
