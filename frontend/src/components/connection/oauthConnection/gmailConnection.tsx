import BaseConnectionCard from './baseConnectionCard';
import { useGmailIntegration } from '../../../hooks/useGoogleIntegration';

interface GmailConnectionProps {
  className?: string;
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="#EA4335" d="M5 7v14l7-10 7 10V7L12 13 5 7z"/>
    <path fill="#FBBC04" d="M5 7l7 6L12 6 5 7z"/>
    <path fill="#34A853" d="M19 7l-7 6 7-6z"/>
    <path fill="#C5221F" d="M5 21h14V7l-7 6-7-6v14z"/>
  </svg>
);

export default function GmailConnection({
  className,
  index,
  hovered,
  setHovered
}: GmailConnectionProps) {
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
  } = useGmailIntegration();

  const handleConnect = () => {
    if (isPopupOpen) {
      // If popup is open, cancel it
      cancelIntegration();
      return;
    }

    if (hasCheckedStatus && isConnected) {
      // If already connected, maybe show disconnect option or just inform user
      console.log('Gmail is already connected');
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
      serviceName="Gmail"
      description="Access and manage your Gmail messages and labels"
      icon={<GmailIcon />}
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
