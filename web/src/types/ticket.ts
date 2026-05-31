export type Ticket = {
  id: string
  sessionId?: string
  title: string
  description: string
  finalEstimate?: number
  activeRoundId?: string
  createdAt: string
  updatedAt: string
}

export type TicketInput = Pick<Ticket, 'title' | 'description'>
