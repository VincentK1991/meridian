import BaseConnectionCard from './baseConnectionCard';
import { useGoogleDriveIntegration } from '../../../hooks/useGoogleIntegration';

interface GoogleDriveConnectionProps {
  className?: string;
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

const GoogleDriveIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="#4285F4" d="M14.5 9l3 5.2h-6L8.5 9h6z"/>
    <path fill="#EA4335" d="M9.5 14.2L6.5 9 3 14.2h6.5z"/>
    <path fill="#34A853" d="M14.5 9L11.5 14.2H21L17.5 9z"/>
  </svg>
);

export default function GoogleDriveConnection({
  className,
  index,
  hovered,
  setHovered
}: GoogleDriveConnectionProps) {
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
  } = useGoogleDriveIntegration();

  const handleConnect = () => {
    if (isPopupOpen) {
      // If popup is open, cancel it
      cancelIntegration();
      return;
    }

    if (hasCheckedStatus && isConnected) {
      // If already connected, maybe show disconnect option or just inform user
      console.log('Google Drive is already connected');
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
      serviceName="Google Drive"
      description="Access and manage your Google Drive files and folders"
      icon={<GoogleDriveIcon />}
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
