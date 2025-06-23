import BaseUserSecretCard from './baseUserSecretCard';

interface GitlabSecretProps {
  isConnected?: boolean;
  onSaveSecrets?: (secrets: Record<string, string>) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  className?: string;
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

const GitlabIcon = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <path fill="#FC6D26" d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.423-.73-.423-.867 0L16.418 9.45H7.582L4.918 1.263c-.135-.423-.73-.423-.867 0L1.387 9.452.045 13.587a.905.905 0 0 0 .331 1.023L12 23.054l11.624-8.443a.905.905 0 0 0 .331-1.024"/>
    <path fill="#E24329" d="M12 23.054l4.418-13.604H7.582z"/>
    <path fill="#FC6D26" d="M12 23.054l-4.418-13.604H1.387l10.613 13.604z"/>
    <path fill="#FCA326" d="M1.387 9.45L.045 13.587a.905.905 0 0 0 .331 1.023L12 23.054 1.387 9.45z"/>
    <path fill="#E24329" d="M1.387 9.45h6.195L4.918 1.263c-.135-.423-.73-.423-.867 0L1.387 9.45z"/>
    <path fill="#FC6D26" d="M12 23.054l4.418-13.604h6.195L12 23.054z"/>
    <path fill="#FCA326" d="M22.613 9.45l1.342 4.137a.905.905 0 0 1-.331 1.023L12 23.054l10.613-13.604z"/>
    <path fill="#E24329" d="M22.613 9.45h-6.195L19.082 1.263c.135-.423.73-.423.867 0l2.664 8.187z"/>
  </svg>
);

export default function GitlabSecret({
  isConnected = false,
  onSaveSecrets,
  onDisconnect,
  className,
  index,
  hovered,
  setHovered
}: GitlabSecretProps) {
  // Default handlers if none provided
  const handleSaveSecrets = async (secrets: Record<string, string>) => {
    if (onSaveSecrets) {
      await onSaveSecrets(secrets);
    } else {
      console.log('Saving GitLab credentials:', {
        username: secrets.username,
        password: '***masked***'
      });
      // TODO: Implement API call to save secrets to backend
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnect) {
      await onDisconnect();
    } else {
      console.log('Disconnecting GitLab...');
      // TODO: Implement API call to remove secrets from backend
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // Validation functions
  const validateUsername = (value: string): string | undefined => {
    if (!value) return 'Username is required';
    if (value.length < 2) return 'Username must be at least 2 characters';
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return undefined;
  };

  // Global validation to ensure both fields are provided
  const globalValidate = (values: Record<string, string>): string | undefined => {
    if (!values.username && !values.password) {
      return 'Both username and password are required';
    }
    return undefined;
  };

  // Define the secret fields for GitLab (username and password)
  const secretFields = [
    {
      key: 'username',
      label: 'Username',
      type: 'text' as const,
      placeholder: 'Enter your GitLab username',
      required: true,
      validate: validateUsername
    },
    {
      key: 'password',
      label: 'Password',
      type: 'password' as const,
      placeholder: 'Enter your GitLab password',
      required: true,
      validate: validatePassword
    }
  ];

  return (
    <BaseUserSecretCard
      serviceName="GitLab"
      description="Connect to your GitLab account for repository access and CI/CD integration"
      secretFields={secretFields}
      icon={<GitlabIcon />}
      isConnected={isConnected}
      onSaveSecrets={handleSaveSecrets}
      onDisconnect={handleDisconnect}
      globalValidate={globalValidate}
      className={className}
      index={index}
      hovered={hovered}
      setHovered={setHovered}
    />
  );
}
