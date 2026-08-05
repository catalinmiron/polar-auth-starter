import { Button } from '@heroui/react'

export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-sm rounded-xl border border-line p-6 text-center"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h1 className="text-lg font-semibold text-foreground tracking-[-0.02em]">Something went wrong</h1>
        <p className="mt-2 text-sm break-words" style={{ color: 'var(--color-muted)' }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="tertiary" size="sm" onPress={reset}>
            Try again
          </Button>
          <Button variant="primary" size="sm" onPress={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  )
}
