import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../store/AuthContext'

// First login with a temporary password: choose a new one, then continue to the app.
export default function SetPassword() {
  const { user, setPassword, logout } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChange) return <Navigate to="/dashboard" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const res = await setPassword(f.password, f.confirm)
    setBusy(false)
    if (res.ok) navigate('/dashboard', { replace: true })
    else setError(res.error)
  }

  return (
    <AuthLayout topText="Signed in as" topStrong={user.email} onTopClick={logout}>
      <div className="auth__eyebrow mono">FIRST LOGIN</div>
      <h1 className="auth__title">Set your password</h1>
      <p className="auth__lead">Choose a new password to replace your temporary one.</p>
      <form onSubmit={submit} noValidate>
        <PasswordField label="New password" value={f.password} placeholder="Enter a new password" autoComplete="new-password"
          onChange={(e) => setF({ ...f, password: e.target.value })} />
        <PasswordField label="Confirm new password" value={f.confirm} placeholder="Re-enter the new password" autoComplete="new-password"
          onChange={(e) => setF({ ...f, confirm: e.target.value })} />
        <p className="auth__hint">Use at least 8 characters and one number.</p>
        {error && <div className="banner banner--err">{error}</div>}
        <button className="btn btn--sage auth__submit" disabled={busy}>{busy ? 'Saving…' : 'Set password & continue'}</button>
      </form>
      <p className="auth__demo mono">You’ll only see the areas your role allows.</p>
    </AuthLayout>
  )
}
