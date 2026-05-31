import { useState } from 'react'
import { Badge, Modal } from '@freeappstore/sdk/ui'
import type { EstimationRound } from '../../types/round'
import type { Vote } from '../../types/vote'
import { averageStoryPoint, mostCommonStoryPoint, voteSpread } from '../../utils/estimation'

type VoteBoardProps = {
  isAdmin: boolean
  onReveal: () => Promise<void>
  participantNames: string[]
  round: EstimationRound | null
  votes: Vote[]
}

export function VoteBoard({ isAdmin, onReveal, participantNames, round, votes }: VoteBoardProps) {
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null)
  const revealed = Boolean(round?.revealed)
  const average = averageStoryPoint(votes)
  const common = mostCommonStoryPoint(votes)
  const spread = voteSpread(votes)
  const seats = participantNames.length > 0 ? participantNames : votes.map((vote) => vote.participantName)

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {round ? `Round ${round.roundNumber}` : 'Round'}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[var(--ink)]">
            {revealed ? 'Votes revealed' : "Waiting for players' votes"}
          </h2>
        </div>
        <Badge variant={revealed ? 'success' : 'warning'}>{votes.length} submitted</Badge>
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--sky-soft)]/50 p-4 sm:p-6">
        {seats.length === 0 ? (
          <div className="grid min-h-64 place-items-center">
            <p className="text-sm font-semibold text-[var(--muted)]">Submitted cards will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {seats.map((participantName) => {
              const vote = votes.find((candidate) => candidate.participantName === participantName) ?? null
              return (
                <ParticipantCard
                  key={participantName}
                  onSelect={() => {
                    if (vote) setSelectedVote(vote)
                  }}
                  participantName={participantName}
                  revealed={revealed}
                  vote={vote}
                />
              )
            })}
          </div>
        )}

        {!revealed && isAdmin && votes.length > 0 ? (
          <div className="mt-6 flex justify-center">
            <button className="rounded-lg bg-[var(--sky)] px-6 py-3 text-sm font-black text-white" onClick={() => void onReveal()}>
              Reveal cards
            </button>
          </div>
        ) : null}
      </div>

      {revealed ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <SummaryMetric label="Average" value={average?.toString() ?? '-'} />
          <SummaryMetric label="Most common" value={common?.join(', ') ?? '-'} />
          <SummaryMetric label="Spread" value={spread ? `${spread.low}-${spread.high}` : '-'} />
        </div>
      ) : null}

      <Modal open={Boolean(selectedVote)} onClose={() => setSelectedVote(null)} title="Vote reason" maxWidth={420}>
        <div className="grid gap-3">
          <p className="text-sm font-bold text-[var(--ink)]">
            {selectedVote?.participantName} voted {selectedVote?.storyPoint}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
            {selectedVote?.comment || 'No comment was added for this vote.'}
          </p>
        </div>
      </Modal>
    </section>
  )
}

function ParticipantCard({
  onSelect,
  participantName,
  revealed,
  vote,
}: {
  onSelect: () => void
  participantName: string
  revealed: boolean
  vote: Vote | null
}) {
  const hasVoted = Boolean(vote)
  const canOpen = Boolean(revealed && vote)

  return (
    <button
      className="grid min-h-40 grid-rows-[7rem_2.5rem_1rem] justify-items-center gap-2 rounded-xl border border-transparent p-3 text-center hover:border-[var(--line-strong)] disabled:hover:border-transparent"
      disabled={!canOpen}
      onClick={onSelect}
      type="button"
    >
      <span className="h-28 w-20 [perspective:800px]">
        <span
          className={[
            'relative block h-full w-full rounded-xl transition-transform duration-500 [transform-style:preserve-3d]',
            revealed && hasVoted ? '[transform:rotateY(180deg)]' : '',
          ].join(' ')}
        >
          <span
            className={[
              'absolute inset-0 grid place-items-center rounded-xl border-2 shadow-md [backface-visibility:hidden]',
              hasVoted
                ? 'border-[var(--sky)] bg-gradient-to-br from-[var(--sky)] to-[var(--mint)]'
                : 'border-[var(--line-strong)] bg-[var(--paper-deep)]',
            ].join(' ')}
          >
            <span className="text-xs font-black uppercase tracking-[0.12em] text-white/80">{hasVoted ? 'Voted' : ''}</span>
          </span>
          <span className="absolute inset-0 grid place-items-center rounded-xl border-2 border-[var(--sky)] bg-[var(--paper)] text-3xl font-black text-[var(--sky)] shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {vote?.storyPoint ?? ''}
          </span>
        </span>
      </span>
      <span className="grid w-full content-center">
        <span className="truncate text-sm font-bold text-[var(--ink)]">{participantName}</span>
        <span className="text-xs font-semibold text-[var(--muted)]">
          {hasVoted ? (revealed ? `${vote?.storyPoint} pts` : 'Submitted') : 'Waiting'}
        </span>
      </span>
      {canOpen && vote?.comment ? <span className="text-xs font-semibold text-[var(--sky-deep)]">View reason</span> : <span />}
    </button>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--ink)]">{value}</p>
    </div>
  )
}
