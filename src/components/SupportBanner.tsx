import { useState } from 'react'

// MOCK — no payment processing. This previews what a donation ask could
// look like as a first, low-friction monetization step (see docs/PLAN.md's
// Business Model) without building real billing before there's real usage.
const AMOUNTS = [20, 50, 100]

export function SupportBanner() {
  const [pickedAmount, setPickedAmount] = useState<number | null>(null)

  if (pickedAmount !== null) {
    return (
      <div className="support-banner">
        <p>
          Thanks for the support — ฿{pickedAmount} noted. Real payments
          aren't wired up yet; this is a preview of what's coming.
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPickedAmount(null)}
        >
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="support-banner">
      <p>
        SIIT Study Hub is free and stays that way. If it's saved you time,
        consider chipping in to keep it running.
      </p>
      <div className="support-amounts">
        {AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            className="btn-secondary"
            onClick={() => setPickedAmount(amount)}
          >
            ฿{amount}
          </button>
        ))}
      </div>
    </div>
  )
}
