import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { useAuth } from '../store/AuthContext'
import { MIN_PASSWORD } from '../lib/auth'

export default function Signup() {
  const { user, signup } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', cafe: '', email: '', password: '', agree: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  if (user) return <Navigate to="/sales" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const res = await signup(f)
    setBusy(false)
    if (res.ok) navigate('/sales', { replace: true })
    else setError(res.error)
  }

  return (
    <AuthLayout switchText="Already have an account?" switchLabel="Log in" switchTo="/login">
      <div className="auth__eyebrow mono">LET’S GET BREWING</div>
      <h1 className="auth__title">Create your account</h1>
      <p className="auth__lead">A little less guesswork. A better-run café.</p>

      <form onSubmit={submit} noValidate>
        <label className="field"><span>Full name</span>
          <input className="input" value={f.name} onChange={set('name')} placeholder="Your full name" autoComplete="name" autoFocus /></label>
        <label className="field"><span>Café name</span>
          <input className="input" value={f.cafe} onChange={set('cafe')} placeholder="Your café or business name" /></label>
        <label className="field"><span>Email address</span>
          <input className="input" type="email" value={f.email} onChange={set('email')} placeholder="you@yourcafe.com" autoComplete="email" /></label>
        <PasswordField value={f.password} onChange={set('password')} placeholder="Create a password" autoComplete="new-password" />
        <p className="auth__hint">Use at least {MIN_PASSWORD} characters.</p>

        <label className="auth__check">
          <input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} />
          I agree to the <u>Terms of Service</u> and <u>Privacy Policy</u>.
        </label>

        {error && <div className="banner banner--err">{error}</div>}
        <button className="btn btn--sage auth__submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </AuthLayout>
  )
}
