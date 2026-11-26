import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { useAuth, DEMO } from '../store/AuthContext'

// Flowchart: Start → User login → Valid login? → Dashboard (yes) / Error wrong password/acc (no).
export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ email: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setNote('')
    const res = await login(f)
    setBusy(false)
    if (res.ok) navigate(res.mustChange ? '/set-password' : '/dashboard', { replace: true })
    else setError(res.error)
  }

  return (
    <AuthLayout topText="Need access?" topStrong="Ask your administrator">
      <div className="auth__eyebrow mono">WELCOME TO STOCK BREW</div>
      <h1 className="auth__title">Welcome back</h1>
      <p className="auth__lead">Log in to keep your café running smoothly.</p>

      <form onSubmit={submit} noValidate>
        <label className="field"><span>Email address</span>
          <input className="input" type="email" value={f.email} placeholder="you@yourcafe.com" autoComplete="email" autoFocus
            onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <PasswordField value={f.password} placeholder="Enter your password" autoComplete="current-password"
          onChange={(e) => setF({ ...f, password: e.target.value })} />

        <div className="auth__row auth__row--opts">
          <label className="auth__check">
            <input type="checkbox" checked={f.remember} onChange={(e) => setF({ ...f, remember: e.target.checked })} /> Remember me
          </label>
          <button type="button" className="auth__link" onClick={() => setNote('Password reset isn’t available yet.')}>Forgot password?</button>
        </div>

        {error && <div className="banner banner--err">{error}</div>}
        {note && <div className="banner">{note}</div>}
        <button className="btn btn--sage auth__submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>

      <p className="auth__demo mono">
        Roles are set by your administrator.
        {/* Development only: remove before shipping */}
        {DEMO.filter((d) => d.hint).map((d) => <span key={d.email}><br />{d.owner ? 'Owner' : d.role === 'admin' ? 'Admin' : d.status === 'invited' ? 'First login' : 'Employee'}: {d.email} / {d.password}</span>)}
      </p>
    </AuthLayout>
  )
}
