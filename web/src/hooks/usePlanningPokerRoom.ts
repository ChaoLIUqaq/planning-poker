import { useEffect, useMemo, useRef, useState } from 'react'
import type { FreeAppStore, RoomMessage, RoomPeer } from '@freeappstore/sdk'

type RoomEvent =
  | { type: 'ticket:changed' }
  | { type: 'vote:submitted' }
  | { type: 'round:revealed' }
  | { type: 'round:started' }
  | { type: 'estimate:confirmed' }
  | { type: 'session:ended' }

export type PlanningPokerRoomEvent = RoomEvent

export function usePlanningPokerRoom(
  app: FreeAppStore,
  sessionId: string | null,
  onEvent: (message: RoomMessage<RoomEvent>) => void,
) {
  const [peers, setPeers] = useState<RoomPeer[]>([])
  const [connectionState, setConnectionState] = useState('connecting')
  const onEventRef = useRef(onEvent)
  const authToken = app.auth.token

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  const room = useMemo(() => app.rooms.join(`planning-poker-${sessionId ?? 'lobby'}`), [app, authToken, sessionId])

  useEffect(() => {
    const unsubscribeMessages = room.onMessage<RoomEvent>((message) => onEventRef.current(message))
    const unsubscribePeers = room.onPeers(setPeers)
    const unsubscribeState = room.onConnectionState(setConnectionState)

    return () => {
      unsubscribeMessages()
      unsubscribePeers()
      unsubscribeState()
      room.close()
    }
  }, [room])

  return {
    peers,
    connectionState,
    publish: (event: RoomEvent) => room.send(event),
  }
}
