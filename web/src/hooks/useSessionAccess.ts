import { useEffect, useMemo, useState } from 'react'

const OWNER_TOKEN_PREFIX = 'planning-poker-owner-token:'

type SessionAccess = {
  isOwner: boolean
  joinLink: string
  ownerToken: string | null
  sessionId: string | null
}

function randomId(prefix: string) {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const value = Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('')
  return `${prefix}_${value}`
}

function readSessionIdFromUrl() {
  const params = new URL(window.location.href).searchParams
  return params.get('room') ?? params.get('session')
}

function writeSessionIdToUrl(sessionId: string) {
  const url = new URL(window.location.href)
  url.searchParams.delete('session')
  url.searchParams.set('room', sessionId)
  window.history.replaceState({}, '', url)
}

export function useSessionAccess() {
  const [access, setAccess] = useState<SessionAccess>(() => {
    const sessionId = readSessionIdFromUrl()
    const ownerToken = sessionId ? window.localStorage.getItem(`${OWNER_TOKEN_PREFIX}${sessionId}`) : null

    return {
      isOwner: Boolean(ownerToken),
      joinLink: sessionId ? `${window.location.origin}${window.location.pathname}?room=${sessionId}` : '',
      ownerToken,
      sessionId,
    }
  })

  useEffect(() => {
    function syncFromUrl() {
      const sessionId = readSessionIdFromUrl()
      const ownerToken = sessionId ? window.localStorage.getItem(`${OWNER_TOKEN_PREFIX}${sessionId}`) : null
      setAccess({
        isOwner: Boolean(ownerToken),
        joinLink: sessionId ? `${window.location.origin}${window.location.pathname}?room=${sessionId}` : '',
        ownerToken,
        sessionId,
      })
    }

    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [])

  const actions = useMemo(
    () => ({
      createSession() {
        const sessionId = randomId('room')
        const ownerToken = randomId('owner')
        window.localStorage.setItem(`${OWNER_TOKEN_PREFIX}${sessionId}`, ownerToken)
        writeSessionIdToUrl(sessionId)
        setAccess({
          isOwner: true,
          joinLink: `${window.location.origin}${window.location.pathname}?room=${sessionId}`,
          ownerToken,
          sessionId,
        })
      },
      joinSession(sessionId: string) {
        const normalizedSessionId = sessionId.trim()
        const ownerToken = window.localStorage.getItem(`${OWNER_TOKEN_PREFIX}${normalizedSessionId}`)
        writeSessionIdToUrl(normalizedSessionId)
        setAccess({
          isOwner: Boolean(ownerToken),
          joinLink: `${window.location.origin}${window.location.pathname}?room=${normalizedSessionId}`,
          ownerToken,
          sessionId: normalizedSessionId,
        })
      },
      leaveSession() {
        const url = new URL(window.location.href)
        url.searchParams.delete('room')
        url.searchParams.delete('session')
        window.history.replaceState({}, '', url)
        setAccess({ isOwner: false, joinLink: '', ownerToken: null, sessionId: null })
      },
    }),
    [],
  )

  return { ...access, ...actions }
}
