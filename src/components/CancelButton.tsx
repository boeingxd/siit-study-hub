import { useState } from 'react'

interface CancelButtonProps {
  dirty: boolean
  onCancel: () => void
}

// A pristine form closes immediately; one with typed input asks first, so a
// stray click can't silently throw away a long submission.
export function CancelButton({ dirty, onCancel }: CancelButtonProps) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <>
        <span className="danger-text" role="alert">
          Discard this draft?
        </span>
        <button type="button" className="btn-primary" onClick={onCancel}>
          Yes, discard
        </button>
        <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
          Keep editing
        </button>
      </>
    )
  }

  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={() => (dirty ? setConfirming(true) : onCancel())}
    >
      Cancel
    </button>
  )
}
