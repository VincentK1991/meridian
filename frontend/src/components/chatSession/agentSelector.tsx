import React from 'react';
import { useMessages } from '../../hooks/useMessages';
import {
  MultiSelector,
  MultiSelectorTrigger,
  MultiSelectorInput,
  MultiSelectorContent,
  MultiSelectorList,
  MultiSelectorItem,
} from '../ui/multi-select';

interface AgentSelectorProps {
  sessionId: string;
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  sessionId,
  selectedAgents,
  onAgentsChange,
  placeholder = "Select agents to chat with...",
  disabled = false,
  className = "",
}) => {
  const { agents: availableAgents } = useMessages(sessionId);

  // Show loading state if agents are not loaded yet
  if (!availableAgents) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center p-3 border border-gray-600 rounded-lg bg-gray-800/50">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading agents...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no agents are available
  if (availableAgents.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center p-3 border border-gray-600 rounded-lg bg-gray-800/50">
          <span className="text-gray-400 text-sm">No agents available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>

      <MultiSelector
        values={selectedAgents}
        onValuesChange={onAgentsChange}
        className="w-1/2"
      >
                <MultiSelectorTrigger className={`w-full min-h-[2rem] border border-gray-600 bg-gray-800/50 text-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500 focus-within:border-indigo-500'}`}>
          <MultiSelectorInput
            placeholder={selectedAgents.length === 0 ? placeholder : "Add more agents..."}
            className="text-white placeholder:text-gray-400"
            disabled={disabled}
          />
        </MultiSelectorTrigger>

        <MultiSelectorContent>
          <MultiSelectorList className="bg-gray-800 border-gray-600 max-h-48 overflow-y-auto">
            {availableAgents.map((agent) => (
              <MultiSelectorItem
                key={agent}
                value={agent}
                className="text-white hover:bg-gray-700 focus:bg-gray-700"
              >
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>{agent}</span>
                </div>
              </MultiSelectorItem>
            ))}
          </MultiSelectorList>
        </MultiSelectorContent>
      </MultiSelector>
    </div>
  );
};
