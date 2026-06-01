export type ToastMessage = {
  id: string
  message: string
  variant: 'success' | 'error'
}

type ToastStackProps = {
  toasts: ToastMessage[]
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="fixed right-4 top-4 z-50 grid w-[min(24rem,calc(100vw-2rem))] gap-3">
      {toasts.map((toast) => (
        <div
          className={[
            'rounded-lg border bg-[var(--paper)] px-4 py-3 text-sm font-bold shadow-[var(--shadow-card)]',
            toast.variant === 'success' ? 'border-[var(--success)] text-[var(--success)]' : 'border-[var(--error)] text-[var(--error)]',
          ].join(' ')}
          key={toast.id}
        >
          {toast.variant === 'success' ? '✓ ' : '✗ '}
          {toast.message}
        </div>
      ))}
    </div>
  )
}
