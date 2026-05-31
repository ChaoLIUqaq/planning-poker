import { STORY_POINTS } from '../../utils/estimation'

type VotingCardsProps = {
  disabled?: boolean
  onSelect: (point: number) => void
  selectedPoint: number | null
}

export function VotingCards({ disabled, onSelect, selectedPoint }: VotingCardsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {STORY_POINTS.map((point) => (
        <button
          aria-pressed={selectedPoint === point}
          className={[
            'h-24 w-16 rounded-lg border-2 text-2xl font-black shadow-sm',
            selectedPoint === point
              ? 'border-[var(--sky)] bg-[var(--sky)] text-white'
              : 'border-[var(--sky)] bg-[var(--paper)] text-[var(--sky)] hover:bg-[var(--sky-soft)]',
            disabled ? 'cursor-not-allowed opacity-50' : '',
          ].join(' ')}
          disabled={disabled}
          key={point}
          onClick={() => onSelect(point)}
          type="button"
        >
          {point}
        </button>
      ))}
    </div>
  )
}
