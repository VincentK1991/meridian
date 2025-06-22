import { ConfirmationModal } from '../ui/confirmation-modal';
import { useDeleteSession } from '../../hooks/useSession';

interface SessionDeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle?: string;
  onDeleteSuccess?: () => void;
}

export function SessionDeleteConfirmationModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  onDeleteSuccess
}: SessionDeleteConfirmationModalProps) {
  const deleteSessionMutation = useDeleteSession();

  const handleConfirmDelete = async () => {
    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      onClose();
      onDeleteSuccess?.();
    } catch (error) {
      console.error('Failed to delete session:', error);
      // The error will be handled by the mutation's onError callback
    }
  };

  const modalBody = (
    <div className="space-y-3">
      <p>
        This will permanently delete the session
        {sessionTitle && (
          <span className="font-medium text-white/90"> "{sessionTitle}"</span>
        )}
        .
      </p>
      <p className="text-sm text-white/70">
        All messages and conversation history will be lost. This action cannot be undone.
      </p>
    </div>
  );

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirmDelete}
      title="Delete Session"
      body={modalBody}
      confirmText="Delete Session"
      cancelText="Cancel"
      variant="danger"
      isLoading={deleteSessionMutation.isPending}
    />
  );
}
