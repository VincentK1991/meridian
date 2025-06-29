import { useState } from 'react';
import ActiveSession from './ActiveSession';
import { ChatInput } from './ChatInput';
import InfiniteSessionTabs from './sessionTab/InfiniteSessionTabs';

interface ChatSessionContainerProps {
    userId: string;
    className?: string;
}

export const ChatSessionContainer: React.FC<ChatSessionContainerProps> = ({
    userId,
    className = ''
}) => {
    const [activeSessionId, setActiveSessionId] = useState<string>('');

    const handleSessionSelect = (sessionId: string) => {
        setActiveSessionId(sessionId);
    };

    const handleSessionClose = (sessionId: string) => {
        // Handle session close logic here
        console.log('Close session:', sessionId);
    };

    return (
        <div className={`liquid-glass-session w-full h-[calc(100vh-200px)] flex overflow-hidden ${className}`}>
            {/* Session Tabs with Infinite Scrolling */}
            <InfiniteSessionTabs
                activeSessionId={activeSessionId}
                onSessionSelect={handleSessionSelect}
                onSessionClose={handleSessionClose}
                userId={userId}
                limit={10}
            />

            {/* Chat Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-white">
                        {activeSessionId
                            ? `Session ${activeSessionId.slice(0, 8)}...`
                            : 'AI Assistant'
                        }
                    </h2>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 bg-gray-900/50 min-h-0 overflow-hidden flex flex-col">
                    {activeSessionId ? (
                        <>
                            {/* Messages Container */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <ActiveSession sessionId={activeSessionId} />
                            </div>

                            {/* Chat Input */}
                            <div className="flex-shrink-0">
                                <ChatInput
                                    sessionId={activeSessionId}
                                    placeholder="Ask your AI assistant anything..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-400 text-center">
                                Welcome to Yurt! Your AI assistant is ready to help.
                                <br />
                                <span className="text-sm">Select a session or create a new one to start chatting.</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
