import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FreeAppStore, User } from '@freeappstore/sdk'
import type { FinalEstimate } from '../types/finalEstimate'
import type { EstimationRound } from '../types/round'
import type { PlanningPokerSession } from '../types/session'
import type { Ticket, TicketInput } from '../types/ticket'
import type { Vote, VoteInput } from '../types/vote'
import { usePlanningPokerRoom } from './usePlanningPokerRoom'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const SESSION_NAME = 'Planning Poker Session'

function withoutId<T extends { id: string }>(document: T) {
  const { id: _id, ...payload } = document
  void _id
  return payload
}

function now() {
  return new Date().toISOString()
}

export function usePlanningPoker(
  app: FreeAppStore,
  user: User | null,
  participantName: string,
  sessionId: string | null,
  hasOwnerToken: boolean,
) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [rounds, setRounds] = useState<EstimationRound[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [finalEstimates, setFinalEstimates] = useState<FinalEstimate[]>([])
  const [session, setSession] = useState<PlanningPokerSession | null>(null)
  const [status, setStatus] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const collections = useMemo(
    () => ({
      tickets: app.collections.collection('tickets'),
      sessions: app.collections.collection('sessions'),
      rounds: app.collections.collection('rounds'),
      votes: app.collections.collection('votes'),
      finalEstimates: app.collections.collection('final-estimates'),
    }),
    [app],
  )

  const refresh = useCallback(async () => {
    if (!sessionId || !user) {
      setStatus('idle')
      return
    }

    setStatus((current) => (current === 'ready' ? current : 'loading'))
    setError(null)

    try {
      const [sessionResult, ticketResult, roundResult, voteResult, estimateResult] = await Promise.all([
        collections.sessions.query<PlanningPokerSession>({ limit: 100, orderBy: 'createdAt', order: 'asc' }),
        collections.tickets.query<Ticket>({ limit: 100, orderBy: 'updatedAt', order: 'desc' }),
        collections.rounds.query<EstimationRound>({ limit: 500, orderBy: 'createdAt', order: 'asc' }),
        collections.votes.query<Vote>({ limit: 1000, orderBy: 'createdAt', order: 'asc' }),
        collections.finalEstimates.query<FinalEstimate>({ limit: 500, orderBy: 'createdAt', order: 'desc' }),
      ])

      let activeSession = sessionResult.documents.find((document) => document.sessionId === sessionId) ?? null
      if (!activeSession && hasOwnerToken) {
        activeSession = await collections.sessions.create({
          sessionId,
          name: SESSION_NAME,
          adminUserId: user.id,
          ownerTokenCreatedAt: now(),
          status: 'active' as const,
          createdAt: now(),
          updatedAt: now(),
        })
      }

      setSession(activeSession)
      setTickets(ticketResult.documents.filter((document) => document.sessionId === sessionId))
      setRounds(roundResult.documents.filter((document) => document.sessionId === sessionId))
      setVotes(voteResult.documents.filter((document) => document.sessionId === sessionId))
      setFinalEstimates(estimateResult.documents.filter((document) => document.sessionId === sessionId))
      setStatus('ready')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Unable to load planning poker data.')
    }
  }, [collections, hasOwnerToken, sessionId, user])

  const isAdmin = Boolean(sessionId && hasOwnerToken)
  const sessionEnded = session?.status === 'ended'
  const activeTicket = tickets.find((ticket) => ticket.id === session?.activeTicketId) ?? tickets[0] ?? null
  const activeRound = activeTicket
    ? rounds.find((round) => round.id === activeTicket.activeRoundId) ??
      rounds.filter((round) => round.ticketId === activeTicket.id).at(-1) ??
      null
    : null

  const activeVotes = activeRound ? votes.filter((vote) => vote.roundId === activeRound.id) : []
  const previousRounds = activeTicket
    ? rounds.filter((round) => round.ticketId === activeTicket.id && round.id !== activeRound?.id)
    : []
  const currentUserVote = activeVotes.find((vote) => vote.participantName === participantName) ?? null

  const handleRoomEvent = useCallback(() => {
    void refresh()
  }, [refresh])

  const room = usePlanningPokerRoom(app, sessionId, handleRoomEvent)

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!sessionId || !user || room.connectionState === 'open') return

    const refreshTimer = window.setInterval(() => {
      void refresh()
    }, 5000)

    return () => window.clearInterval(refreshTimer)
  }, [refresh, room.connectionState, sessionId, user])

  const createTicket = useCallback(
    async (input: TicketInput) => {
      if (!sessionId || sessionEnded) return

      const timestamp = now()
      const ticket = await collections.tickets.create({
        ...input,
        sessionId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      const round = await collections.rounds.create({
        sessionId,
        ticketId: ticket.id,
        roundNumber: 1,
        revealed: false,
        createdAt: timestamp,
      })
      await collections.tickets.update<Ticket>(ticket.id, { activeRoundId: round.id, updatedAt: now() })
      if (session) {
        await collections.sessions.update<PlanningPokerSession>(session.id, {
          activeTicketId: ticket.id,
          updatedAt: now(),
        })
      }
      room.publish({ type: 'ticket:changed' })
      await refresh()
    },
    [collections, refresh, room, session, sessionEnded, sessionId],
  )

  const updateTicket = useCallback(
    async (ticketId: string, input: TicketInput) => {
      if (sessionEnded) return
      await collections.tickets.update<Ticket>(ticketId, { ...input, updatedAt: now() })
      room.publish({ type: 'ticket:changed' })
      await refresh()
    },
    [collections, refresh, room, sessionEnded],
  )

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      if (!session) return
      if (sessionEnded) return
      await collections.tickets.delete(ticketId)
      const nextTicket = tickets.find((ticket) => ticket.id !== ticketId)
      await collections.sessions.update<PlanningPokerSession>(session.id, {
        activeTicketId: nextTicket?.id,
        updatedAt: now(),
      })
      room.publish({ type: 'ticket:changed' })
      await refresh()
    },
    [collections, refresh, room, session, sessionEnded, tickets],
  )

  const selectTicket = useCallback(
    async (ticketId: string) => {
      if (!session) return
      if (sessionEnded) return
      await collections.sessions.update<PlanningPokerSession>(session.id, {
        activeTicketId: ticketId,
        updatedAt: now(),
      })
      room.publish({ type: 'ticket:changed' })
      await refresh()
    },
    [collections, refresh, room, session, sessionEnded],
  )

  const submitVote = useCallback(
    async (input: VoteInput) => {
      if (!activeRound || !activeTicket || !sessionId || !participantName.trim() || sessionEnded) return

      const existingVote = activeVotes.find((vote) => vote.participantName === participantName)
      const payload = {
        sessionId,
        ticketId: activeTicket.id,
        roundId: activeRound.id,
        participantName,
        storyPoint: input.storyPoint,
        comment: input.comment?.trim() || undefined,
        createdAt: existingVote?.createdAt ?? now(),
      }

      if (existingVote) {
        await collections.votes.update<Vote>(existingVote.id, payload)
      } else {
        await collections.votes.create(payload)
      }

      room.publish({ type: 'vote:submitted' })
      await refresh()
    },
    [activeRound, activeTicket, activeVotes, collections, participantName, refresh, room, sessionEnded, sessionId],
  )

  const revealRound = useCallback(async () => {
    if (!activeRound) return
    if (sessionEnded) return
    await collections.rounds.update<EstimationRound>(activeRound.id, { revealed: true, revealedAt: now() })
    room.publish({ type: 'round:revealed' })
    await refresh()
  }, [activeRound, collections, refresh, room, sessionEnded])

  const startNewRound = useCallback(async () => {
    if (!activeTicket || !sessionId || sessionEnded) return
    const ticketRounds = rounds.filter((round) => round.ticketId === activeTicket.id)
    const round = await collections.rounds.create({
      sessionId,
      ticketId: activeTicket.id,
      roundNumber: ticketRounds.length + 1,
      revealed: false,
      createdAt: now(),
    })
    await collections.tickets.update<Ticket>(activeTicket.id, { activeRoundId: round.id, updatedAt: now() })
    room.publish({ type: 'round:started' })
    await refresh()
  }, [activeTicket, collections, refresh, room, rounds, sessionEnded, sessionId])

  const confirmFinalEstimate = useCallback(
    async (estimate: number) => {
      if (!activeTicket || !sessionId || !user || sessionEnded) return
      const timestamp = now()
      await collections.finalEstimates.create({
        sessionId,
        ticketId: activeTicket.id,
        estimate,
        recordedBy: user.login,
        createdAt: timestamp,
      })
      await collections.tickets.update<Ticket>(activeTicket.id, { finalEstimate: estimate, updatedAt: timestamp })
      room.publish({ type: 'estimate:confirmed' })
      await refresh()
    },
    [activeTicket, collections, refresh, room, sessionEnded, sessionId, user],
  )

  const endSession = useCallback(async () => {
    if (!session || !user || !isAdmin) return
    await collections.sessions.update<PlanningPokerSession>(session.id, {
      status: 'ended',
      endedAt: now(),
      endedBy: user.login,
      updatedAt: now(),
    })
    room.publish({ type: 'session:ended' })
    await refresh()
  }, [collections, isAdmin, refresh, room, session, user])

  const canInteract = !sessionEnded

  return {
    activeRound,
    activeTicket,
    activeVotes,
    canInteract,
    connectionState: room.connectionState,
    createTicket,
    currentUserVote,
    deleteTicket,
    endSession,
    error,
    finalEstimates,
    isAdmin,
    peers: room.peers,
    previousRounds,
    refresh,
    revealRound,
    rounds,
    selectTicket,
    session,
    sessionEnded,
    startNewRound,
    status,
    submitVote,
    tickets: tickets.map((ticket) => ({ ...withoutId(ticket), id: ticket.id })),
    updateTicket,
    votes,
    confirmFinalEstimate,
  }
}
