import { useEffect, useState } from 'react'
import { Badge, Card, ConfirmDialog, EmptyState, ListRow } from '@freeappstore/sdk/ui'
import type { Ticket, TicketInput } from '../../types/ticket'

type TicketPanelProps = {
  activeTicket: Ticket | null
  isAdmin: boolean
  onCreate: (input: TicketInput) => Promise<void>
  onDelete: (ticketId: string) => Promise<void>
  onSelect: (ticketId: string) => Promise<void>
  onUpdate: (ticketId: string, input: TicketInput) => Promise<void>
  tickets: Ticket[]
}

const emptyTicket = { title: '', description: '' }

export function TicketPanel({
  activeTicket,
  isAdmin,
  onCreate,
  onDelete,
  onSelect,
  onUpdate,
  tickets,
}: TicketPanelProps) {
  const [draft, setDraft] = useState<TicketInput>(emptyTicket)
  const [editing, setEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeTicket) {
      setDraft({ title: activeTicket.title, description: activeTicket.description })
    }
  }, [activeTicket])

  async function saveTicket() {
    if (!draft.title.trim()) {
      setError('Ticket title is required.')
      return
    }

    setError('')
    if (editing && activeTicket) {
      await onUpdate(activeTicket.id, { title: draft.title.trim(), description: draft.description.trim() })
    } else {
      await onCreate({ title: draft.title.trim(), description: draft.description.trim() })
      setDraft(emptyTicket)
    }
    setEditing(false)
  }

  return (
    <Card padding="0" style={{ overflow: 'hidden' }}>
      <div className="border-b border-[var(--line)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Ticket</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--ink)]">
              {activeTicket?.title ?? 'No active ticket'}
            </h2>
          </div>
          {activeTicket?.finalEstimate ? <Badge variant="success">{activeTicket.finalEstimate} pts</Badge> : null}
        </div>
        {activeTicket ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{activeTicket.description}</p>
        ) : (
          <EmptyState title="Ready for a ticket" message="An admin can create the first estimation item." />
        )}
      </div>

      {isAdmin ? (
        <div className="grid gap-3 p-5">
          <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="ticket-title">
            {editing ? 'Update ticket' : 'Create ticket'}
          </label>
          <input
            id="ticket-title"
            className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ticket title"
            value={draft.title}
          />
          <textarea
            className="min-h-24 rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Describe the scope, acceptance criteria, and unknowns."
            value={draft.description}
          />
          {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white" onClick={saveTicket}>
              {editing ? 'Save changes' : 'Create and select'}
            </button>
            {activeTicket ? (
              <button
                className="rounded-lg border border-[var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--ink)]"
                onClick={() => setEditing((current) => !current)}
              >
                {editing ? 'Cancel edit' : 'Edit active'}
              </button>
            ) : null}
            {activeTicket ? (
              <button
                className="rounded-lg border border-[var(--line-strong)] px-4 py-2 text-sm font-bold text-[var(--error)]"
                onClick={() => setDeleteTarget(activeTicket)}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="border-t border-[var(--line)] p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Backlog</p>
        {tickets.length === 0 ? (
          <EmptyState message="No tickets have been created yet." />
        ) : (
          <div className="grid max-h-80 gap-1 overflow-y-auto pr-1">
            {tickets.map((ticket) => (
              <ListRow
                key={ticket.id}
                title={ticket.title}
                subtitle={ticket.finalEstimate ? `Final estimate: ${ticket.finalEstimate}` : 'Unestimated'}
                trailing={ticket.id === activeTicket?.id ? <Badge variant="accent">Active</Badge> : null}
                onClick={isAdmin ? () => void onSelect(ticket.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        confirmLabel="Delete ticket"
        message="This removes the ticket from the active list. Existing round and vote records remain in collections."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void onDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
        open={Boolean(deleteTarget)}
        title="Delete ticket?"
        variant="danger"
      />
    </Card>
  )
}
