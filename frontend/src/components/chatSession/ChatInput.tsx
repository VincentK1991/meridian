import React, { useState, useRef, useEffect } from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import type { OnChangeHandlerFunc, MentionItem } from 'react-mentions';
import { useMessages } from '../../hooks/useMessages';
import { AgentSelector } from './agentSelector';
import { Orchestration } from '../../types/conversationRequest';

interface ChatInputProps {
    sessionId: string;
    disabled?: boolean;
    placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    sessionId,
    disabled = false,
    placeholder = "Type your message..."
}) => {
    const [message, setMessage] = useState('');
    const [plainTextMessage, setPlainTextMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [selectedOrchestration, setSelectedOrchestration] = useState<Orchestration>(Orchestration.SEQUENTIAL);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { sendMessage, agents: availableAgents } = useMessages(sessionId);

    // Transform agents into mentions format
    const agentMentions = (availableAgents || []).map(agent => ({
        id: agent || '',
        display: agent || '',
    })).filter(agent => agent.id && agent.display);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    // Focus on textarea when component mounts
    useEffect(() => {
        if (textareaRef.current && !disabled) {
            textareaRef.current.focus();
        }
    }, [disabled]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!plainTextMessage.trim() || isSubmitting || disabled) {
            return;
        }

        const messageToSend = plainTextMessage.trim();
        setMessage('');
        setPlainTextMessage('');
        setIsSubmitting(true);

        try {
            await sendMessage({
                user_input: messageToSend,
                agents: selectedAgents,
                orchestration: selectedOrchestration,
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            // Don't restore on error since mentions would be complex to restore
        } finally {
            setIsSubmitting(false);
        }
    };

                    // Handle mentions change
    const handleMentionsChange: OnChangeHandlerFunc = (event, newValue, newPlainTextValue, mentions) => {
        setMessage(newValue);
        setPlainTextMessage(newPlainTextValue); // Store plain text for sending

        // Extract mentioned agents (all mentions are agent mentions since we only have @ trigger)
        // Remove @ prefix from agent names for clean agent list
        const mentionedAgents = mentions
            .filter((mention: MentionItem) => mention && mention.display)
            .map((mention: MentionItem) => mention.display.replace(/^@/, ''));

        // Sync selected agents with mentioned agents
        // This creates a bidirectional sync: mentions in text = selected agents
        setSelectedAgents(mentionedAgents);
    };

    // Handle agent selection changes from the multi-select
    const handleAgentSelectionChange = (newSelectedAgents: string[]) => {
        setSelectedAgents(newSelectedAgents);

        // Update mentions in the text to match selected agents
        const currentMentions = message.match(/@\[([^\]]+)\]\([^)]+\)/g) || [];
        const currentMentionedAgents = currentMentions.map(mention => {
            const match = mention.match(/@\[([^\]]+)\]/);
            return match ? match[1] : '';
        }).filter(Boolean);

        // Find agents that need to be added or removed
        const agentsToAdd = newSelectedAgents.filter(agent => !currentMentionedAgents.includes(agent));
        const agentsToRemove = currentMentionedAgents.filter(agent => !newSelectedAgents.includes(agent));

        let updatedMessage = message;

                // Remove mentions for deselected agents
        agentsToRemove.forEach(agent => {
            const mentionRegex = new RegExp(`@\\[${agent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\([^)]+\\)`, 'g');
            updatedMessage = updatedMessage.replace(mentionRegex, '').replace(/\s+/g, ' ').trim();
        });

        // Add mentions for newly selected agents
        agentsToAdd.forEach(agent => {
            if (updatedMessage && !updatedMessage.endsWith(' ')) {
                updatedMessage += ` @[${agent}](${agent})`;
            } else if (updatedMessage) {
                updatedMessage += `@[${agent}](${agent})`;
            } else {
                updatedMessage = `@[${agent}](${agent})`;
            }
        });

        setMessage(updatedMessage);
    };

    return (
        <div className="border-t border-gray-700 bg-gray-900/50 p-4">
            {/* Agent Selector and Orchestration Selector */}
            <div className="mb-3 flex items-center gap-3">
                <div className="flex-1">
                    <AgentSelector
                        sessionId={sessionId}
                        selectedAgents={selectedAgents}
                        onAgentsChange={handleAgentSelectionChange}
                        disabled={disabled}
                    />
                </div>
                <div className="flex-shrink-0">
                    <select
                        id="orchestration-select"
                        value={selectedOrchestration}
                        onChange={(e) => setSelectedOrchestration(e.target.value as Orchestration)}
                        disabled={disabled || isSubmitting}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 min-w-[140px]"
                    >
                        <option value={Orchestration.SEQUENTIAL}>Sequential</option>
                        <option value={Orchestration.PARALLEL}>Parallel</option>
                        <option value={Orchestration.DEEP_RESEARCH}>Deep Research</option>
                    </select>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-3">
                <div className="flex-1 relative">
                    <MentionsInput
                        value={message}
                        onChange={handleMentionsChange}
                        placeholder={placeholder}
                        disabled={disabled || isSubmitting}
                        style={{
                            control: {
                                backgroundColor: '#374151',
                                fontSize: 14,
                                fontWeight: 'normal',
                                borderRadius: '8px',
                                border: '1px solid #4B5563',
                                minHeight: '48px',
                                color: 'white',
                                position: 'relative',
                            },
                            highlighter: {
                                padding: '12px 16px',
                                border: '1px solid transparent',
                                borderRadius: '8px',
                                minHeight: '48px',
                                fontSize: 14,
                                fontWeight: 'normal',
                                lineHeight: '1.5',
                                fontFamily: 'inherit',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                overflow: 'hidden',
                            },
                            input: {
                                padding: '12px 16px',
                                border: '1px solid transparent',
                                borderRadius: '8px',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                color: 'white',
                                minHeight: '48px',
                                fontSize: 14,
                                fontWeight: 'normal',
                                lineHeight: '1.5',
                                fontFamily: 'inherit',
                                resize: 'none',
                                maxHeight: '128px',
                                margin: 0,
                            },
                            suggestions: {
                                list: {
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #4B5563',
                                    borderRadius: '8px',
                                    fontSize: 14,
                                    maxHeight: '200px',
                                    overflow: 'auto',
                                },
                                item: {
                                    padding: '8px 12px',
                                    borderBottom: '1px solid #374151',
                                    color: 'white',
                                    '&focused': {
                                        backgroundColor: '#374151',
                                    },
                                },
                            },
                        }}
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                // Directly execute submit logic
                                if (plainTextMessage.trim() && !isSubmitting && !disabled) {
                                    const messageToSend = plainTextMessage.trim();
                                    setMessage('');
                                    setPlainTextMessage('');
                                    setIsSubmitting(true);
                                    try {
                                        sendMessage({
                                            user_input: messageToSend,
                                            agents: selectedAgents,
                                            orchestration: selectedOrchestration,
                                        });
                                    } catch (error) {
                                        console.error('Failed to send message:', error);
                                        // Don't restore on error since mentions would be complex to restore
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }
                            }
                        }}
                    >
                        <Mention
                            trigger="@"
                            data={agentMentions}
                            markup="@[__display__](__id__)"
                            displayTransform={(id: string) => `@${id}`}
                            style={{
                                backgroundColor: 'transparent',
                                color: 'inherit',
                                border: 'none',
                                padding: 0,
                                fontWeight: 'inherit',
                            }}
                        />
                    </MentionsInput>
                </div>

                <button
                    type="submit"
                    disabled={!plainTextMessage.trim() || isSubmitting || disabled}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-lg transition-colors flex items-center justify-center min-w-[48px] h-[48px]"
                    title="Send message (Enter)"
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
};
