import { useState } from 'react';
import GoogleDriveConnection from './oauthConnection/googleDriveConnection';
import GoogleCalendarConnection from './oauthConnection/googleCalendarConnection';
import GmailConnection from './oauthConnection/gmailConnection';
import SlackSecret from './userSecret/slackSecret';
import GitlabSecret from './userSecret/gitlabSecret';

export default function Connection() {
  // State for focus card effects
  const [hoveredOAuth, setHoveredOAuth] = useState<number | null>(null);
  const [hoveredSecret, setHoveredSecret] = useState<number | null>(null);

  // Placeholder handlers for Slack secret-based connection
  const handleSlackSecretsSave = async (secrets: Record<string, string>) => {
    console.log('Saving Slack secrets:', {
      'slack-access-token': secrets['slack-access-token']?.substring(0, 10) + '...'
    });
    // TODO: Implement API call to save secrets to backend
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSlackDisconnect = async () => {
    console.log('Disconnecting Slack...');
    // TODO: Implement API call to remove secret from backend
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  // Placeholder handlers for GitLab secret-based connection
  const handleGitlabSecretsSave = async (secrets: Record<string, string>) => {
    console.log('Saving GitLab secrets:', {
      username: secrets.username,
      password: '***masked***'
    });
    // TODO: Implement API call to save secrets to backend
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleGitlabDisconnect = async () => {
    console.log('Disconnecting GitLab...');
    // TODO: Implement API call to remove secrets from backend
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="liquid-glass-card p-6">
      <h2 className="text-2xl font-semibold text-white mb-6">Service Connections</h2>

      {/* OAuth-based connections */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white/90 mb-4">OAuth Connections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GoogleDriveConnection
            index={0}
            hovered={hoveredOAuth}
            setHovered={setHoveredOAuth}
          />

          <GoogleCalendarConnection
            index={1}
            hovered={hoveredOAuth}
            setHovered={setHoveredOAuth}
          />

          <GmailConnection
            index={2}
            hovered={hoveredOAuth}
            setHovered={setHoveredOAuth}
          />
        </div>
      </div>

      {/* API Key/Token-based connections */}
      <div>
        <h3 className="text-lg font-medium text-white/90 mb-4">API Key Connections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SlackSecret
            isConnected={false}
            onSaveSecrets={handleSlackSecretsSave}
            onDisconnect={handleSlackDisconnect}
            index={0}
            hovered={hoveredSecret}
            setHovered={setHoveredSecret}
          />

          <GitlabSecret
            isConnected={false}
            onSaveSecrets={handleGitlabSecretsSave}
            onDisconnect={handleGitlabDisconnect}
            index={1}
            hovered={hoveredSecret}
            setHovered={setHoveredSecret}
          />
        </div>
      </div>
    </div>
  );
}
