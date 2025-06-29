import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMessages } from '../../hooks/useMessages';

interface MentionInputProps {
  sessionId: string;
  value: string;
  onChange: (value: string) => void;
  onAgentMention: (agent: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

interface MentionState {
  isOpen: boolean;
  query: string;
  startIndex: number;
  endIndex: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  sessionId,
  value,
  onChange,
  onAgentMention,
  placeholder,
  disabled = false,
  className = '',
  onKeyDown,
  textareaRef: externalRef,
}) => {
  const [mentionState, setMentionState] = useState<MentionState>({
    isOpen: false,
    query: '',
    startIndex: -1,
    endIndex: -1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { agents: availableAgents } = useMessages(sessionId);

  // Filter agents based on mention query
  const filteredAgents = availableAgents?.filter(agent =>
    agent.toLowerCase().includes(mentionState.query.toLowerCase())
  ) || [];

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    if (!textareaRef.current || !mentionState.isOpen) return;

    const textarea = textareaRef.current;
    const textRect = textarea.getBoundingClientRect();
    const lines = value.substring(0, mentionState.startIndex).split('\n');
    const currentLine = lines.length - 1;
    const lineHeight = 24; // Approximate line height

    setDropdownPosition({
      top: textRect.top + (currentLine) * lineHeight,
      left: textRect.left,
    });
  }, [value, mentionState.startIndex, mentionState.isOpen, textareaRef]);

  // Update dropdown position when mention state changes
  useEffect(() => {
    calculateDropdownPosition();
  }, [calculateDropdownPosition]);

  // Detect @ mentions in text
  const detectMention = useCallback((text: string, cursorPosition: number) => {
    const textBeforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const startIndex = textBeforeCursor.lastIndexOf('@');
      return {
        isOpen: true,
        query: mentionMatch[1],
        startIndex,
        endIndex: cursorPosition,
      };
    }

    return {
      isOpen: false,
      query: '',
      startIndex: -1,
      endIndex: -1,
    };
  }, []);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    onChange(newValue);

    const newMentionState = detectMention(newValue, cursorPosition);
    setMentionState(newMentionState);
    setSelectedIndex(0);
  };

  // Insert agent mention
  const insertMention = (agent: string) => {
    if (!textareaRef.current) return;

    const beforeMention = value.substring(0, mentionState.startIndex);
    const afterMention = value.substring(mentionState.endIndex);
    const newValue = `${beforeMention}@${agent} ${afterMention}`;

    onChange(newValue);
    onAgentMention(agent);

    setMentionState({
      isOpen: false,
      query: '',
      startIndex: -1,
      endIndex: -1,
    });

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + agent.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState.isOpen && filteredAgents.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredAgents.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredAgents.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertMention(filteredAgents[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          setMentionState({
            isOpen: false,
            query: '',
            startIndex: -1,
            endIndex: -1,
          });
          break;
        default:
          // Let other keys bubble up
          onKeyDown?.(e);
          break;
      }
    } else {
      onKeyDown?.(e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        setMentionState(prev => ({ ...prev, isOpen: false }));
      }
    };

    if (mentionState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mentionState.isOpen, textareaRef]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={className}
        style={{ minHeight: '48px' }}
      />

      {/* Mention Dropdown */}
      {mentionState.isOpen && filteredAgents.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-gray-800 border border-gray-600 rounded-md shadow-lg z-[10000] max-h-48 overflow-y-auto min-w-[200px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="p-1">
            {filteredAgents.map((agent, index) => (
              <div
                key={agent}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => insertMention(agent)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>@{agent}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
