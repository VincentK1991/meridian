import type { Session } from '../types/session';

interface SessionTabProps {
    session: Session;
    isActive: boolean;
    onClick: () => void;
    onClose?: () => void;
}

export default function SessionTab({ session, isActive, onClick, onClose }: SessionTabProps) {
    // Use session name if available, otherwise fallback to truncated ID
    const displayName = (session as any).session_name || `Session ${session.id.slice(0, 8)}...`;

    return (
        <div
            className={`
        flex items-center px-4 py-2 rounded-t-lg cursor-pointer transition-colors border-b-2
        ${isActive
                    ? 'bg-gray-700 text-white border-blue-500'
                    : 'bg-gray-800 text-gray-400 border-transparent hover:bg-gray-700 hover:text-white'
                }
      `}
            onClick={onClick}
        >
            <span className="truncate max-w-[150px]">{displayName}</span>
            {onClose && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                >
                    ×
                </button>
            )}
        </div>
    );
}
