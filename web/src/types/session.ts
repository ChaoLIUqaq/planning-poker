export type PlanningPokerSession = {
  id: string
  sessionId: string
  name: string
  adminUserId?: string
  ownerTokenCreatedAt?: string
  activeTicketId?: string
  status?: 'active' | 'ended'
  endedAt?: string
  endedBy?: string
  createdAt: string
  updatedAt: string
}
