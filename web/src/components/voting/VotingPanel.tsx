import { useEffect, useState } from 'react'
import { Badge, Card } from '@freeappstore/sdk/ui'
import type { EstimationRound } from '../../types/round'
import type { Ticket } from '../../types/ticket'
import type { Vote } from '../../types/vote'
import { VotingCards } from './VotingCards'

type VotingPanelProps = {
  currentUserVote: Vote | null
  onSubmit: (input: { storyPoint: number; comment?: string }) => Promise<void>
  participantName: string
  round: EstimationRound | null
  ticket: Ticket | null
}

export function VotingPanel({ currentUserVote, onSubmit, participantName, round, ticket }: VotingPanelProps) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(currentUserVote?.storyPoint ?? null)
  const [comment, setComment] = useState(currentUserVote?.comment ?? '')
  const [error, setError] = useState('')
  const revealed = Boolean(round?.revealed)

  useEffect(() => {
    setSelectedPoint(currentUserVote?.storyPoint ?? null)
    setComment(currentUserVote?.comment ?? '')
  }, [currentUserVote])

  async function submit() {
    if (!selectedPoint) {
      setError('Select a story point before submitting.')
      return
    }
    if (!participantName.trim()) {
      setError('Sign in with GitHub before submitting.')
      return
    }
    setError('')
    await onSubmit({ storyPoint: selectedPoint, comment })
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Your estimate</p>
          <h2 className="mt-1 text-xl font-bold text-[var(--ink)]">
            {revealed ? 'Round is revealed' : ticket ? 'Choose your card' : 'Select a ticket first'}
          </h2>
        </div>
        {currentUserVote ? <Badge variant="success">Submitted</Badge> : null}
      </div>

      <div className="mt-5">
        <VotingCards disabled={!ticket || revealed} onSelect={setSelectedPoint} selectedPoint={selectedPoint} />
      </div>

      <textarea
        className="mt-5 min-h-24 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
        disabled={!ticket || revealed}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional note about uncertainty, risk, or complexity."
        value={comment}
      />
      {error ? <p className="mt-2 text-sm text-[var(--error)]">{error}</p> : null}
      <button
        className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!ticket || revealed || !participantName.trim()}
        onClick={() => void submit()}
      >
        {currentUserVote ? 'Update vote' : 'Submit vote'}
      </button>
    </Card>
  )
}
