// Text-based brand mark. Purely visual — wrap it in a <Link to="/"> at the
// call site (keeping the link outside avoids nested anchors in navs that
// already wrap the logo).
export function BrandLogo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span
        className={`flex items-center justify-center rounded-md font-mono font-bold ${
          size === 'lg' ? 'size-7 text-sm' : 'size-6 text-xs'
        }`}
        style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-ink)' }}
        aria-hidden
      >
        P
      </span>
      <span className={`font-semibold tracking-[-0.02em] text-foreground ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
        Polar Auth Starter
      </span>
    </span>
  )
}
