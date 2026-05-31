export type EstimationRound = {
  id: string
  sessionId?: string
  ticketId: string
  roundNumber: number
  revealed: boolean
  createdAt: string
  revealedAt?: string
}
