import { authClient } from '@/lib/auth-client'
import { Button } from '@heroui/react'

type Props = {
  callbackURL: string
}

export function SocialAuthButtons({ callbackURL }: Props) {
  const signInWith = (provider: 'google' | 'github') => {
    authClient.signIn.social({ provider, callbackURL })
  }

  return (
    <div className="flex flex-col gap-3 mb-3">
      <Button variant="outline" className="w-full gap-2.5 rounded-xl font-medium" onPress={() => signInWith('google')}>
        <GoogleIcon />
        Continue with Google
      </Button>

      <Button variant="outline" className="w-full gap-2.5 rounded-xl font-medium" onPress={() => signInWith('github')}>
        <GitHubIcon />
        Continue with GitHub
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-line)' }} />
        <span className="text-xs" style={{ color: 'var(--color-faint)' }}>
          or
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-line)' }} />
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C4.025 0 0 4.025 0 9c0 3.978 2.578 7.35 6.156 8.541.45.082.615-.195.615-.433 0-.214-.008-.78-.012-1.531-2.503.544-3.031-1.206-3.031-1.206-.41-1.041-1-1.318-1-1.318-.816-.558.062-.547.062-.547.903.064 1.379.927 1.379.927.802 1.375 2.106.978 2.619.748.081-.582.314-.978.57-1.203-1.998-.227-4.1-1-4.1-4.446 0-.982.35-1.785.926-2.415-.093-.228-.402-1.143.088-2.382 0 0 .754-.242 2.472.922A8.62 8.62 0 0 1 9 4.118a8.62 8.62 0 0 1 2.254.303c1.716-1.164 2.47-.922 2.47-.922.49 1.24.181 2.154.088 2.382.577.63.924 1.433.924 2.415 0 3.456-2.104 4.216-4.108 4.438.323.279.61.828.61 1.669 0 1.204-.012 2.177-.012 2.473 0 .24.162.52.618.432C15.425 16.347 18 12.976 18 9c0-4.975-4.025-9-9-9z"
      />
    </svg>
  )
}
