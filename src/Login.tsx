
import React, { useState } from 'react'

type Props = {
  onLogin: (user: { email: string; role: 'student' | 'staff' }) => void
  onCancel?: () => void
}

export default function Login({ onLogin, onCancel }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<'student' | 'staff'>('student')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setEmail('')
    setPassword('')
    setConfirm('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }

    if (mode === 'signup') {
      if (password !== confirm) {
        setError('Passwords do not match')
        return
      }
      // Mock signup flow: in real app call API to create account
      onLogin({ email, role })
      reset()
      return
    }

    // Mock login flow: validate credentials (replace with real API)
    onLogin({ email, role })
    reset()
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
      <h1>{mode === 'login' ? 'Sign in' : 'Sign up'}</h1>

      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      {mode === 'signup' && (
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'block' }}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <label style={{ marginRight: 12 }}>
          <input
            type="radio"
            name="role"
            value="student"
            checked={role === 'student'}
            onChange={() => setRole('student')}
          />{' '}
          Student
        </label>
        <label>
          <input
            type="radio"
            name="role"
            value="staff"
            checked={role === 'staff'}
            onChange={() => setRole('staff')}
          />{' '}
          Academic staff
        </label>
      </div>

      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button type="submit" style={{ padding: '8px 12px' }}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px' }}>
            Cancel
          </button>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        {mode === 'login' ? (
          <>
            New here?{' '}
            <button type="button" onClick={() => { setMode('signup'); setError(null) }} style={{ color: 'blue', background: 'none', border: 'none', padding: 0 }}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('login'); setError(null) }} style={{ color: 'blue', background: 'none', border: 'none', padding: 0 }}>
              Sign in
            </button>
          </>
        )}
      </div>
    </form>
  )
}
