import { useState } from 'react';
import { useInfiniteSessionsFlat, useSessionMutations } from '../../../hooks/useInfiniteSession';
import { SessionDeleteConfirmationModal } from './SessionDeleteConfirmationModal';
import { SessionTabHeader } from './SessionTabHeader';
import { SessionTabList } from './SessionTabList';

interface InfiniteSessionTabsProps {
    activeSessionId: string;
    onSessionSelect: (sessionId: string) => void;
    onSessionClose: (sessionId: string) => void;
    userId: string;
    limit?: number;
}

export default function InfiniteSessionTabs({
    activeSessionId,
    onSessionSelect,
    userId,
    limit = 10
}: InfiniteSessionTabsProps) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);

    const {
        sessions,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error,
        totalSessions
    } = useInfiniteSessionsFlat(userId, limit);

    const { createSession, updateSession } = useSessionMutations();

    const handleCreateSession = async () => {
        try {
            await createSession.mutateAsync();
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const handleDeleteClick = (sessionId: string, sessionTitle: string) => {
        setSessionToDelete({ id: sessionId, title: sessionTitle });
        setDeleteModalOpen(true);
    };

    const handleDeleteSuccess = () => {
        if (!sessionToDelete) return;

        // If the deleted session was active, select the first available session
        if (sessionToDelete.id === activeSessionId && sessions.length > 1) {
            const remainingSessions = sessions.filter(s => s.id !== sessionToDelete.id);
            if (remainingSessions.length > 0) {
                onSessionSelect(remainingSessions[0].id);
            }
        }

        // Close modal and reset state
        setDeleteModalOpen(false);
        setSessionToDelete(null);
    };

    const handleCancelDelete = () => {
        setDeleteModalOpen(false);
        setSessionToDelete(null);
    };



    return (
        <div className="liquid-glass-sidebar w-80 flex flex-col">
            {/* Header with Create Button */}
            <SessionTabHeader
                totalSessions={totalSessions}
                createSession={createSession}
                onCreateSession={handleCreateSession}
            />

            {/* Sessions List Container */}
            <SessionTabList
                sessions={sessions}
                activeSessionId={activeSessionId}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                error={error}
                limit={limit}
                onSessionSelect={onSessionSelect}
                onSessionDelete={handleDeleteClick}
                fetchNextPage={fetchNextPage}
                updateSession={updateSession}
            />

            {/* Delete Confirmation Modal */}
            <SessionDeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={handleCancelDelete}
                sessionId={sessionToDelete?.id || ''}
                sessionTitle={sessionToDelete?.title}
                onDeleteSuccess={handleDeleteSuccess}
            />
        </div>
    );
}
