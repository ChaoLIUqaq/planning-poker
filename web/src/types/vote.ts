export type Vote = {
  id: string
  sessionId?: string
  ticketId: string
  roundId: string
  participantName: string
  storyPoint: number
  comment?: string
  createdAt: string
}

export type VoteInput = Pick<Vote, 'storyPoint' | 'comment'>
