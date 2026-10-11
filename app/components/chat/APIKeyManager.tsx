import React, { useState, useEffect, useCallback } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import type { ProviderInfo } from '~/types/model';

interface APIKeyManagerProps {
  provider: ProviderInfo;
  apiKey: string;
  setApiKey: (key: string) => void;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
}

// cache which stores whether the provider's API key is set via environment variable
const providerEnvKeyStatusCache: Record<string, boolean> = {};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const APIKeyManager: React.FC<APIKeyManagerProps> = ({ provider, apiKey, setApiKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [isEnvKeySet, setIsEnvKeySet] = useState(false);

  // Reset the editor when the selected provider or its in-memory key changes.
  useEffect(() => {
    setTempKey(apiKey);
    setIsEditing(false);
  }, [provider.name, apiKey]);

  const checkEnvApiKey = useCallback(async () => {
    // Check cache first
    if (providerEnvKeyStatusCache[provider.name] !== undefined) {
      setIsEnvKeySet(providerEnvKeyStatusCache[provider.name]);
      return;
    }

    try {
      const response = await fetch(`/api/check-env-key?provider=${encodeURIComponent(provider.name)}`);
      const data = await response.json();
      const isSet = (data as { isSet: boolean }).isSet;

      // Cache the result
      providerEnvKeyStatusCache[provider.name] = isSet;
      setIsEnvKeySet(isSet);
    } catch (error) {
      console.error('Failed to check environment API key:', error);
      setIsEnvKeySet(false);
    }
  }, [provider.name]);

  useEffect(() => {
    checkEnvApiKey();
  }, [checkEnvApiKey]);

  const handleSave = () => {
    setApiKey(tempKey);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-bolt-elements-textSecondary">{provider?.name} API Key:</span>
            {!isEditing && (
              <div className="flex items-center gap-2">
                {apiKey ? (
                  <>
                    <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                    <span className="text-xs text-green-500">Set for this tab</span>
                  </>
                ) : isEnvKeySet ? (
                  <>
                    <div className="i-ph:check-circle-fill text-green-500 w-4 h-4" />
                    <span className="text-xs text-green-500">Set via environment variable</span>
                  </>
                ) : (
                  <>
                    <div className="i-ph:x-circle-fill text-red-500 w-4 h-4" />
                    <span className="text-xs text-red-500">Not Set (Please set via UI or ENV_VAR)</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={tempKey}
                placeholder="Enter API Key"
                onChange={(e) => setTempKey(e.target.value)}
                className="w-[300px] px-3 py-1.5 text-sm rounded border border-bolt-elements-borderColor
                          bg-bolt-elements-prompt-background text-bolt-elements-textPrimary
                          focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
              />
              <IconButton
                onClick={handleSave}
                title="Save API Key"
                className="bg-green-500/10 hover:bg-green-500/20 text-green-500"
              >
                <div className="i-ph:check w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={() => setIsEditing(false)}
                title="Cancel"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500"
              >
                <div className="i-ph:x w-4 h-4" />
              </IconButton>
            </div>
          ) : (
            <>
              <IconButton
                onClick={() => setIsEditing(true)}
                title="Edit API Key"
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500"
              >
                <div className="i-ph:pencil-simple w-4 h-4" />
              </IconButton>
              {provider?.getApiKeyLink && !apiKey && (
                <IconButton
                  onClick={() => window.open(provider?.getApiKeyLink)}
                  title="Get API Key"
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 flex items-center gap-2"
                >
                  <span className="text-xs whitespace-nowrap">{provider?.labelForGetApiKey || 'Get API Key'}</span>
                  <div className={`${provider?.icon || 'i-ph:key'} w-4 h-4`} />
                </IconButton>
              )}
            </>
          )}
        </div>
      </div>
      <p className="px-1 text-xs leading-relaxed text-bolt-elements-textTertiary">
        Keys entered here stay in memory for this tab and are sent to Loopit&apos;s server for model requests. They are
        cleared when you reload or close the tab.
      </p>
    </div>
  );
};
