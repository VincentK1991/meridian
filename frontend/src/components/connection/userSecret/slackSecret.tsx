import BaseUserSecretCard from './baseUserSecretCard';

interface SlackSecretProps {
  isConnected?: boolean;
  onSaveSecrets?: (secrets: Record<string, string>) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  className?: string;
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"/>
    <path fill="#36C5F0" d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
    <path fill="#2EB67D" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"/>
    <path fill="#ECB22E" d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
  </svg>
);

export default function SlackSecret({
  isConnected = false,
  onSaveSecrets,
  onDisconnect,
  className,
  index,
  hovered,
  setHovered
}: SlackSecretProps) {
  // Default handlers if none provided
  const handleSaveSecrets = async (secrets: Record<string, string>) => {
    if (onSaveSecrets) {
      await onSaveSecrets(secrets);
    } else {
      console.log('Saving Slack token:', {
        'slack-access-token': secrets['slack-access-token']?.substring(0, 10) + '...'
      });
      // TODO: Implement API call to save secret to backend
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnect) {
      await onDisconnect();
    } else {
      console.log('Disconnecting Slack...');
      // TODO: Implement API call to remove secret from backend
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Validation function for Slack tokens
  const validateSlackToken = (value: string): string | undefined => {
    if (!value) return 'Token is required';
    if (!value.startsWith('xoxb-') && !value.startsWith('xoxp-')) {
      return 'Slack token should start with xoxb- or xoxp-';
    }
    if (value.length < 20) return 'Token appears to be too short';
    return undefined;
  };

  // Define the secret fields for Slack (single field)
  const secretFields = [
    {
      key: 'slack-access-token',
      label: 'Bot Token',
      type: 'password' as const,
      placeholder: 'xoxb-your-slack-bot-token',
      required: true,
      validate: validateSlackToken
    }
  ];

  return (
    <BaseUserSecretCard
      serviceName="Slack"
      description="Connect your Slack workspace for messaging and notifications"
      secretFields={secretFields}
      icon={<SlackIcon />}
      isConnected={isConnected}
      onSaveSecrets={handleSaveSecrets}
      onDisconnect={handleDisconnect}
      className={className}
      index={index}
      hovered={hovered}
      setHovered={setHovered}
    />
  );
}
