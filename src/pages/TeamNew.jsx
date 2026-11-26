import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, ChevronDown } from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../store/AuthContext'
import { ROLES } from '../lib/roles'
import { generatePassword } from '../lib/auth'

const STEPS = [
  ['Account is created', 'The person appears in Team & Access with their role.'],
  ['Share their login', 'Give them the email and temporary password.'],
  ['They log in', 'They use the normal Login screen and see only what their role allows.'],
]
const HINT = {
  employee: 'Employees can’t see Discounts, Team & Access or Settings.',
  admin: 'Administrators can open every page, including Team & Access and Settings.',
}

export default function TeamNew() {
  const { user, createUser } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', email: '', role: 'employee', password: '', mustChange: true })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const res = await createUser(f)
    setBusy(false)
    if (res.ok) navigate('/team', { state: { flash: `Account created for ${f.name.trim()}. Share their email and temporary password.` } })
    else setError(res.error)
  }

  return (
    <Layout title="Create account" subtitle="Only administrators can add people. They sign in with the details you set">
      <div className="split split--narrow">
        <form className="card" onSubmit={submit} noValidate>
          <h2 className="card__title">New account</h2>
          <p className="card__sub">Fill in the person’s details and choose their role</p>

          <div className="grid2">
            <label className="field"><span><strong>Full name</strong></span>
              <input className="input" value={f.name} onChange={set('name')} placeholder="e.g. Maya Santos" autoFocus /></label>
            <label className="field"><span><strong>Work email</strong></span>
              <input className="input" type="email" value={f.email} onChange={set('email')} placeholder="maya@yourcafe.com" /></label>
          </div>

          <label className="field"><span><strong>Role</strong></span>
            <span className="select select--block">
              <select value={f.role} onChange={set('role')}>
                {Object.entries(ROLES).filter(([k]) => k !== 'admin' || user.owner).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <ChevronDown size={14} />
            </span>
          </label>
          <p className="auth__hint">{HINT[f.role]}{!user.owner && ' Only the owner can create administrators.'}</p>

          <label className="field"><span><strong>Temporary password</strong></span>
            <span className="inputwrap">
              <input className="input" value={f.password} onChange={set('password')} placeholder="Enter or generate a password" autoComplete="off" />
              <button type="button" className="btn btn--soft btn--sm" onClick={() => setF({ ...f, password: generatePassword() })}>
                <RefreshCw size={13} /> Generate
              </button>
            </span>
          </label>

          <label className="auth__check">
            <input type="checkbox" checked={f.mustChange} onChange={(e) => setF({ ...f, mustChange: e.target.checked })} />
            Ask them to set a new password the first time they log in
          </label>

          {error && <div className="banner banner--err">{error}</div>}
          <div className="actions">
            <button className="btn btn--sage btn--lg" disabled={busy}><Plus size={16} /> {busy ? 'Creating…' : 'Create account'}</button>
            <Link to="/team" className="btn btn--ghost btn--lg">Cancel</Link>
          </div>
        </form>

        <aside className="card">
          <h2 className="card__title">What happens next</h2>
          <p className="card__sub">Accounts are created by admins only</p>
          <ol className="auth__points steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="mono">{String(i + 1).padStart(2, '0')}</span><div><strong>{t}</strong><small>{d}</small></div></li>
            ))}
          </ol>
        </aside>
      </div>
    </Layout>
  )
}
