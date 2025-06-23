import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';

interface SecretField {
  key: string; // e.g., "username", "password", "token"
  label: string; // e.g., "Username", "Password", "Access Token"
  type?: 'text' | 'password' | 'email'; // input type
  placeholder?: string;
  required?: boolean;
  validate?: (value: string) => string | undefined;
}

interface BaseUserSecretCardProps {
  serviceName: string;
  description: string;
  secretFields: SecretField[]; // Array of fields instead of single field
  icon?: React.ReactNode;
  isConnected?: boolean;
  onSaveSecrets: (secrets: Record<string, string>) => Promise<void>; // Changed to handle multiple secrets
  onDisconnect?: () => Promise<void>;
  className?: string;
  globalValidate?: (values: Record<string, string>) => string | undefined; // Global validation across all fields
  // Focus card props
  index?: number;
  hovered?: number | null;
  setHovered?: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function BaseUserSecretCard({
  serviceName,
  description,
  secretFields,
  icon,
  isConnected = false,
  onSaveSecrets,
  onDisconnect,
  className = "",
  globalValidate,
  index,
  hovered,
  setHovered
}: BaseUserSecretCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create default values object from secret fields
  const defaultValues = secretFields.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {} as Record<string, string>);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        await onSaveSecrets(value);
        setIsEditing(false);
        form.reset();
      } catch (error) {
        console.error('Failed to save secrets:', error);
        // TODO: Add proper error handling/notification
      } finally {
        setIsLoading(false);
      }
    },
    validators: globalValidate ? {
      onChange: ({ value }) => globalValidate(value),
      onBlur: ({ value }) => globalValidate(value),
    } : undefined,
  });

  const handleDisconnect = async () => {
    if (onDisconnect) {
      setIsLoading(true);
      try {
        await onDisconnect();
      } catch (error) {
        console.error('Failed to disconnect:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

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

  // Determine the primary label (first field or "Credentials")
  const primaryLabel = secretFields.length === 1 ? secretFields[0].label : 'Credentials';

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`liquid-glass-button liquid-specular p-6 text-white relative transition-all duration-300 ease-out ${
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
        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
          isConnected ? 'bg-green-400' : 'bg-gray-500'
        } ${isHovered ? 'scale-110 shadow-lg' : ''}`} />
      </div>

      <p className={`text-white/80 text-sm mb-4 transition-all duration-300 ${
        isHovered ? 'text-white/90' : ''
      }`}>{description}</p>

      {!isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium transition-all duration-300 ${
              isConnected ? 'text-green-400' : 'text-white/60'
            } ${isHovered && isConnected ? 'text-green-300' : ''} ${isHovered && !isConnected ? 'text-white/80' : ''}`}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
            {isConnected && (
              <span className={`text-xs text-white/60 transition-all duration-300 ${
                isHovered ? 'text-white/80' : ''
              }`}>
                {primaryLabel} configured
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            {!isConnected ? (
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className={`flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm rounded-md transition-all duration-300 ${
                  isHovered ? 'bg-blue-500 shadow-lg' : ''
                }`}
              >
                {isLoading ? 'Loading...' : `Add ${primaryLabel}`}
              </button>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm rounded-md transition-all duration-300 ${
                    isHovered ? 'bg-blue-500 shadow-lg' : ''
                  }`}
                >
                  Update
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className={`px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white text-sm rounded-md transition-all duration-300 ${
                    isHovered ? 'bg-red-500 shadow-lg' : ''
                  }`}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3"
        >
          {/* Render form fields dynamically */}
          {secretFields.map((field) => (
            <form.Field
              key={field.key}
              name={field.key}
              validators={{
                onChange: field.validate ? ({ value }) => field.validate!(value) : undefined,
                onBlur: field.validate ? ({ value }) => field.validate!(value) : undefined,
              }}
            >
              {(fieldApi) => (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/90">
                    {field.label}
                    {field.required !== false && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type || 'password'}
                    value={fieldApi.state.value}
                    onChange={(e) => fieldApi.handleChange(e.target.value)}
                    onBlur={fieldApi.handleBlur}
                    placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    disabled={isLoading}
                    required={field.required !== false}
                  />
                  {fieldApi.state.meta.errors.length > 0 && (
                    <p className="text-red-400 text-xs">
                      {fieldApi.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          ))}

          {/* Global form validation error */}
          {form.state.errors.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-md p-3">
              <p className="text-red-400 text-sm">
                {form.state.errors[0]}
              </p>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || !form.state.canSubmit}
              className={`flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm rounded-md transition-all duration-300 ${
                isHovered ? 'bg-green-500 shadow-lg' : ''
              }`}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className={`px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white text-sm rounded-md transition-all duration-300 ${
                isHovered ? 'bg-gray-500 shadow-lg' : ''
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Hover overlay effect */}
      {isHovered && (
        <div className="absolute inset-0 bg-white/5 rounded-lg pointer-events-none transition-opacity duration-300" />
      )}
    </div>
  );
}
