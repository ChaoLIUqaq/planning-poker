import { useEffect, useState } from 'react'
import { Card } from '@freeappstore/sdk/ui'
import type { EstimationRound } from '../../types/round'
import type { Ticket } from '../../types/ticket'
import { STORY_POINTS } from '../../utils/estimation'

type AdminControlsProps = {
  activeRound: EstimationRound | null
  activeTicket: Ticket | null
  isAdmin: boolean
  onConfirmEstimate: (estimate: number) => Promise<void>
  onStartRound: () => Promise<void>
}

export function AdminControls({
  activeRound,
  activeTicket,
  isAdmin,
  onConfirmEstimate,
  onStartRound,
}: AdminControlsProps) {
  const [estimate, setEstimate] = useState<number>(activeTicket?.finalEstimate ?? STORY_POINTS[0])
  const [message, setMessage] = useState('')

  useEffect(() => {
    setEstimate(activeTicket?.finalEstimate ?? STORY_POINTS[0])
    setMessage('')
  }, [activeRound?.id, activeTicket?.finalEstimate, activeTicket?.id])

  if (!isAdmin || !activeTicket) return null

  async function confirmEstimate() {
    await onConfirmEstimate(estimate)
    setMessage('Consensus estimate recorded.')
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Facilitator controls</p>
          <h2 className="mt-1 text-xl font-bold text-[var(--ink)]">Consensus after discussion</h2>
        </div>
        {activeRound?.revealed ? (
          <button
            className="rounded-lg border border-[var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)]"
            onClick={() => void onStartRound()}
          >
            Start new round
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Final estimate
          <select
            className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
            onChange={(event) => setEstimate(Number(event.target.value))}
            value={estimate}
          >
            {STORY_POINTS.map((point) => (
              <option key={point} value={point}>
                {point}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-lg bg-[var(--mint)] px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!activeRound?.revealed}
          onClick={() => void confirmEstimate()}
        >
          Confirm consensus
        </button>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        The final estimate is recorded after team discussion; vote statistics are only a guide.
      </p>
      {message ? <p className="mt-2 text-sm font-semibold text-[var(--success)]">{message}</p> : null}
    </Card>
  )
}
