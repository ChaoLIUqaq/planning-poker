export type PlanningPokerRole = 'admin' | 'player'

export type SessionUser = {
  id: string
  name: string
  role: PlanningPokerRole
}
