import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { error: Error | null }

export class QueryErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Something went wrong loading this section.
            </p>
            <button
              className="text-xs underline"
              style={{ color: 'var(--color-accent)' }}
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
