import { useMemo, useState } from 'react'

type EntryScreenProps = {
  initialSessionId: string | null
  onCreateSession: () => void
  onJoinSession: (sessionId: string) => void
  onSignIn: () => void
  signedIn: boolean
}

type EntryMode = 'landing' | 'create' | 'join'

export function EntryScreen({ initialSessionId, onCreateSession, onJoinSession, onSignIn, signedIn }: EntryScreenProps) {
  const [mode, setMode] = useState<EntryMode>(initialSessionId ? 'join' : 'landing')
  const [sessionId, setSessionId] = useState(initialSessionId ?? '')
  const [error, setError] = useState('')

  const title = useMemo(() => {
    if (mode === 'create') return 'Create session'
    if (mode === 'join') return 'Join session'
    return 'Planning Poker'
  }, [mode])

  function submit() {
    const normalizedSessionId = sessionId.trim()

    if (!signedIn) {
      setError('Sign in with GitHub to continue.')
      return
    }

    if (mode === 'join' && !normalizedSessionId) {
      setError('Paste a room link or enter a room ID.')
      return
    }

    setError('')
    if (mode === 'create') {
      onCreateSession()
    } else if (mode === 'join') {
      onJoinSession(extractSessionId(normalizedSessionId))
    }
  }

  return (
    <main className="grid min-h-[calc(100dvh-7rem)] place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-black text-[var(--ink)]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {mode === 'landing'
            ? 'Create a new estimation room or join one from a shared link.'
            : 'GitHub sign-in is required for realtime sessions and shared votes.'}
        </p>

        {mode === 'landing' ? (
          <div className="mt-6 grid gap-3">
            <button
              className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-black text-white"
              onClick={() => setMode('create')}
            >
              Create session
            </button>
            <button
              className="rounded-lg border border-[var(--line-strong)] px-4 py-3 text-sm font-black text-[var(--ink)]"
              onClick={() => setMode('join')}
            >
              Join session
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {!signedIn ? (
              <button className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-black text-white" onClick={onSignIn}>
                Sign in with GitHub
              </button>
            ) : null}

            {mode === 'join' ? (
              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="session-id">
                Room link or ID
                <input
                  id="session-id"
                  className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
                  onChange={(event) => setSessionId(event.target.value)}
                  placeholder="https://.../?room=room_..."
                  value={sessionId}
                />
              </label>
            ) : null}

            {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              {signedIn ? (
                <button className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-black text-white" onClick={submit}>
                  {mode === 'create' ? 'Create session' : 'Join session'}
                </button>
              ) : null}
              <button
                className="rounded-lg border border-[var(--line-strong)] px-4 py-3 text-sm font-black text-[var(--ink)]"
                onClick={() => setMode('landing')}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function extractSessionId(value: string) {
  try {
    const params = new URL(value).searchParams
    return params.get('room') ?? params.get('session') ?? value
  } catch {
    return value
  }
}
