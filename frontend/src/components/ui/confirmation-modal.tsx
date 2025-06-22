import * as React from "react"
import { cn } from "@/lib/utils"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  isLoading?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  body,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'default',
  isLoading = false
}: ConfirmationModalProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with liquid glass blur effect */}
      <div
        className="absolute inset-0 liquid-glass-backdrop"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md liquid-glass-modal">
        {/* Glass reflection overlay */}
        <div className="absolute inset-0 liquid-glass-reflection" />

        {/* Content */}
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white/90 leading-tight">
              {title}
            </h2>
          </div>

          {/* Body */}
          <div className="mb-6">
            {typeof body === 'string' ? (
              <p className="text-white/80 leading-relaxed">
                {body}
              </p>
            ) : (
              <div className="text-white/80">
                {body}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="liquid-glass-button px-4 py-2 text-sm font-medium text-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                variant === 'danger'
                  ? "liquid-glass-button-danger"
                  : "liquid-glass-button-confirm"
              )}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
