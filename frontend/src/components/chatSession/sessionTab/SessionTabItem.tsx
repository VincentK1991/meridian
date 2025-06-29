import { useState, useRef, useEffect } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Session, SessionUpdate } from '../../../types/session';

interface SessionTabItemProps {
    session: Session;
    isActive: boolean;
    onSelect: (sessionId: string) => void;
    onDelete: (sessionId: string, sessionTitle: string) => void;
    updateSession: UseMutationResult<Session, Error, { session_id: string; session_update: SessionUpdate }, unknown>;
}

export const SessionTabItem = ({
    session,
    isActive,
    onSelect,
    onDelete,
    updateSession,
}: SessionTabItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Handle clicking outside to close modal
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showOptionsModal && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                // Check if click is not on the modal itself
                const modalElement = document.getElementById(`options-modal-${session.id}`);
                if (modalElement && !modalElement.contains(event.target as Node)) {
                    setShowOptionsModal(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showOptionsModal, session.id]);

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingTitle('');
    };

    const handleStartEdit = (currentTitle: string) => {
        setIsEditing(true);
        setEditingTitle(currentTitle);
        setShowOptionsModal(false); // Close modal when starting edit
    };

    const handleSaveEdit = async () => {
        if (!editingTitle.trim()) {
            handleCancelEdit();
            return;
        }

        try {
            await updateSession.mutateAsync({
                session_id: session.id,
                session_update: { title: editingTitle.trim() }
            });
            handleCancelEdit();
        } catch (error) {
            console.error('Failed to update session title:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    const handleItemClick = () => {
        // Cancel any active editing when selecting a different session
        if (isEditing) {
            handleCancelEdit();
        }
        // Close modal when selecting session
        setShowOptionsModal(false);
        onSelect(session.id);
    };

            const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setModalPosition({
                x: rect.left - 30, // Position at the left edge of the button
                y: rect.bottom -200  // Position just below the button
            });
        }

        setShowOptionsModal(!showOptionsModal);
    };

    const handleRenameClick = () => {
        handleStartEdit(displayTitle);
    };

    const handleDeleteClick = () => {
        setShowOptionsModal(false);
        onDelete(session.id, session.title);
    };

    const displayTitle = session.title || `Session ${session.id.slice(0, 8)}...`;

    return (
        <>
            <div
                className={`
                    liquid-glass-session-tab w-full px-3 py-3 cursor-pointer transition-all border-l-2 mb-2 relative
                    ${isActive
                        ? 'active text-indigo-800 border-indigo-400'
                        : 'text-zinc-700/90 border-transparent hover:text-indigo-800 hover:border-white/30'
                    }
                `}
                onClick={handleItemClick}
            >
                <div className="flex items-center justify-between">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={handleSaveEdit}
                            className="flex-1 bg-gray-800/50 text-white text-sm font-medium px-2 py-1 rounded border border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span
                            className="truncate text-sm font-medium flex-1"
                            title={displayTitle}
                        >
                            {displayTitle}
                        </span>
                    )}

                    <div className="flex items-center gap-1">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveEdit();
                                    }}
                                    className="text-green-600 hover:text-green-500 transition-colors px-1"
                                    title="Save"
                                    disabled={updateSession.isPending}
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelEdit();
                                    }}
                                    className="text-gray-600 hover:text-gray-500 transition-colors px-1"
                                    title="Cancel"
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            <button
                                ref={buttonRef}
                                onClick={handleMenuClick}
                                className="text-zinc-700/60 hover:text-zinc-800 transition-colors ml-2 hover:bg-gray-200/20 rounded px-2 py-1"
                                title="More options"
                            >
                                ⋯
                            </button>
                        )}
                    </div>
                </div>

                {/* Session metadata */}
                <div className="text-xs text-gray-500 mt-1">
                    {new Date(session.update_time).toLocaleDateString()}
                </div>
            </div>

            {/* Options Modal */}
            {showOptionsModal && (
                <div
                    id={`options-modal-${session.id}`}
                    className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-[120px]"
                    style={{
                        left: `${modalPosition.x}px`,
                        top: `${modalPosition.y}px`,
                    }}
                >
                    <button
                        onClick={handleRenameClick}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-t-md"
                    >
                        Rename
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-md"
                    >
                        Delete
                    </button>
                </div>
            )}
        </>
    );
};
