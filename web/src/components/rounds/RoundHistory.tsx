import { Card, EmptyState } from '@freeappstore/sdk/ui'
import type { EstimationRound } from '../../types/round'
import type { Vote } from '../../types/vote'
import { averageStoryPoint, mostCommonStoryPoint } from '../../utils/estimation'

type RoundHistoryProps = {
  rounds: EstimationRound[]
  votes: Vote[]
}

export function RoundHistory({ rounds, votes }: RoundHistoryProps) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Previous rounds</p>
      {rounds.length === 0 ? (
        <EmptyState message="Revealed rounds will stay here for comparison." />
      ) : (
        <div className="mt-4 grid gap-3">
          {rounds.map((round) => {
            const roundVotes = votes.filter((vote) => vote.roundId === round.id)
            return (
              <div className="rounded-lg border border-[var(--line)] p-4" key={round.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[var(--ink)]">Round {round.roundNumber}</p>
                  <p className="text-sm text-[var(--muted)]">{round.revealed ? 'Revealed' : 'Hidden'}</p>
                </div>
                {round.revealed ? (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {roundVotes.map((vote) => (
                        <span
                          className="rounded-md border border-[var(--line)] bg-[var(--paper-deep)] px-2 py-1 text-sm font-semibold text-[var(--ink)]"
                          key={vote.id}
                        >
                          {vote.participantName}: {vote.storyPoint}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Average {averageStoryPoint(roundVotes) ?? '-'} · Most common{' '}
                      {mostCommonStoryPoint(roundVotes)?.join(', ') ?? '-'}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">Votes remain hidden until this round is revealed.</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
