import React from 'react';

interface BaseConnectionCardProps {
  serviceName: string;
  description: string;
  icon?: React.ReactNode;
  isConnected?: boolean;
  onConnect: () => void;
  onCheckStatus?: () => void;
  className?: string;
  // Enhanced status props
  isLoading?: boolean;
  isCheckingStatus?: boolean;
  error?: string | null;
  buttonText?: string;
  hasCheckedStatus?: boolean;
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function BaseConnectionCard({
  serviceName,
  description,
  icon,
  isConnected = false,
  onConnect,
  onCheckStatus,
  className = "",
  isLoading = false,
  isCheckingStatus = false,
  error = null,
  buttonText,
  hasCheckedStatus = false,
  index,
  hovered,
  setHovered
}: BaseConnectionCardProps) {
  const handleMouseEnter = () => {
    if (setHovered && index !== undefined) {
      setHovered(index);
    }
  };

  const handleMouseLeave = () => {
    if (setHovered) {
      setHovered(null);
    }
  };

  // Focus card styling logic
  const isHovered = hovered === index;
  const hasHoverState = hovered !== null && hovered !== undefined;
  const shouldBlur = hasHoverState && !isHovered;

  const getStatusText = () => {
    if (isCheckingStatus) return 'Checking status...';
    if (isLoading) return 'Connecting...';
    if (error) return 'Connection failed';
    if (!hasCheckedStatus) return 'Status unknown';
    if (isConnected) return 'Connected';
    return 'Not Connected';
  };

  const getButtonText = () => {
    if (buttonText) return buttonText;
    if (isLoading) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Connect';
  };

  const getStatusColor = () => {
    if (isCheckingStatus) return 'text-yellow-400';
    if (error) return 'text-red-400';
    if (isConnected) return 'text-green-400';
    if (isLoading) return 'text-blue-400';
    if (!hasCheckedStatus) return 'text-gray-400';
    return 'text-white/60';
  };

  const getStatusColorHovered = () => {
    if (isCheckingStatus) return 'text-yellow-300';
    if (error) return 'text-red-300';
    if (isConnected) return 'text-green-300';
    if (isLoading) return 'text-blue-300';
    if (!hasCheckedStatus) return 'text-gray-300';
    return 'text-white/80';
  };

  const getIndicatorColor = () => {
    if (isCheckingStatus) return 'bg-yellow-400';
    if (error) return 'bg-red-400';
    if (isConnected) return 'bg-green-400';
    if (isLoading) return 'bg-blue-400';
    if (!hasCheckedStatus) return 'bg-gray-400';
    return 'bg-gray-500';
  };

  const getButtonStyles = () => {
    if (isConnected) {
      return 'bg-green-600 hover:bg-green-700 text-white border-green-500';
    }
    if (error) {
      return 'bg-red-600 hover:bg-red-700 text-white border-red-500';
    }
    if (isLoading) {
      return 'bg-blue-600 text-white border-blue-500 cursor-not-allowed';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:shadow-lg';
  };

  const getCheckStatusButtonStyles = () => {
    if (isCheckingStatus) {
      return 'bg-yellow-600 text-white border-yellow-500 cursor-not-allowed';
    }
    return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-500 hover:shadow-lg';
  };

  return (
    <div className="relative">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`liquid-glass-card p-6 text-white relative transition-all duration-300 ease-out ${
          shouldBlur ? 'blur-sm scale-[0.98]' : ''
        } ${isHovered ? 'scale-105 shadow-2xl' : ''} ${className}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-8 h-8 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-semibold">{serviceName}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {(isLoading || isCheckingStatus) && (
              <div className={`w-3 h-3 border rounded-full animate-spin ${
                isCheckingStatus ? 'border-yellow-400 border-t-transparent' : 'border-blue-400 border-t-transparent'
              }`} />
            )}
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              getIndicatorColor()
            } ${isHovered ? 'scale-110 shadow-lg' : ''}`} />
          </div>
        </div>

        <p className={`text-white/80 text-sm mb-6 transition-all duration-300 ${
          isHovered ? 'text-white/90' : ''
        }`}>{description}</p>

        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-medium transition-all duration-300 ${
            isHovered ? getStatusColorHovered() : getStatusColor()
          }`}>
            {getStatusText()}
          </span>
        </div>

        {/* Button Container */}
        <div className="flex gap-2">
          {/* Primary Connect Button */}
          <button
            onClick={onConnect}
            disabled={isLoading || isCheckingStatus}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border ${
              getButtonStyles()
            } ${isHovered ? 'transform scale-105' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-center space-x-2">
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{getButtonText()}</span>
            </div>
          </button>

          {/* Check Status Button */}
          {onCheckStatus && (
            <button
              onClick={onCheckStatus}
              disabled={isLoading || isCheckingStatus}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 border ${
                getCheckStatusButtonStyles()
              } ${isHovered ? 'transform scale-105' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
              title="Check connection status"
            >
              <div className="flex items-center justify-center space-x-2">
                {isCheckingStatus && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Status</span>
              </div>
            </button>
          )}
        </div>

        {/* Hover overlay effect */}
        {isHovered && (
          <div className="absolute inset-0 bg-white/5 rounded-lg pointer-events-none transition-opacity duration-300" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded-md px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
