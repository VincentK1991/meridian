import BaseConnectionCard from './baseConnectionCard';
import { useGoogleCalendarIntegration } from '../../../hooks/useGoogleIntegration';

interface GoogleCalendarConnectionProps {
  className?: string;
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
    <path fill="#EA4335" d="M10 14H7v-4h3v4z"/>
    <path fill="#34A853" d="M12 10h5v2h-5z"/>
    <path fill="#FBBC04" d="M12 13h3v2h-3z"/>
  </svg>
);

export default function GoogleCalendarConnection({
  className,
  index,
  hovered,
  setHovered
}: GoogleCalendarConnectionProps) {
  const {
    isConnected,
    isLoading,
    isCheckingStatus,
    error,
    startIntegration,
    cancelIntegration,
    isPopupOpen,
    checkStatus,
    hasCheckedStatus
  } = useGoogleCalendarIntegration();

  const handleConnect = () => {
    if (isPopupOpen) {
      // If popup is open, cancel it
      cancelIntegration();
      return;
    }

    if (hasCheckedStatus && isConnected) {
      // If already connected, maybe show disconnect option or just inform user
      console.log('Google Calendar is already connected');
      return;
    }

    // Start OAuth flow - this will get the authorization URL and open popup
    startIntegration();
  };

  const handleCheckStatus = () => {
    checkStatus();
  };

  const getButtonText = () => {
    if (isLoading) return 'Connecting...';
    if (isPopupOpen) return 'Cancel';
    if (hasCheckedStatus && isConnected) return 'Connected';
    return 'Connect';
  };

  return (
    <BaseConnectionCard
      serviceName="Google Calendar"
      description="Access and manage your Google Calendar events and schedules"
      icon={<GoogleCalendarIcon />}
      isConnected={hasCheckedStatus ? isConnected : false}
      onConnect={handleConnect}
      onCheckStatus={handleCheckStatus}
      className={className}
      index={index}
      hovered={hovered}
      setHovered={setHovered}
      isLoading={isLoading}
      isCheckingStatus={isCheckingStatus}
      error={error?.toString() || null}
      buttonText={getButtonText()}
      hasCheckedStatus={hasCheckedStatus}
    />
  );
}
