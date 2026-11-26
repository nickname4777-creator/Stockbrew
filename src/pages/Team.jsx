import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, MoreHorizontal, Plus, Shield, KeyRound, UserX, UserCheck, Trash2, ChevronDown } from 'lucide-react'
import Layout from '../components/Layout'
import ConfirmDialog from '../components/ConfirmDialog'
import RoleMatrix from '../components/RoleMatrix'
import { useAuth } from '../store/AuthContext'
import { PAGES, ROLES } from '../lib/roles'

const STATUS = { active: 'Active', invited: 'Invited', deactivated: 'Deactivated' }
const pagesOf = (role) => Object.entries(PAGES).filter(([, p]) => p.roles.includes(role)).map(([k]) => k)
const label = (k) => (k === 'settings' ? 'Settings and activity log' : PAGES[k].label)

export function Avatar({ name, role }) {
  return <span className={`avatar avatar--${role}`}>{(name || '?')[0].toUpperCase()}</span>
}

// The "…" menu on each row.
function RowMenu({ person, disabled, canChangeRole, onPick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const off = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', off)
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  const pick = (type) => { setOpen(false); onPick(type) }
  return (
    <div className="menu" ref={ref}>
      <button className="icon-btn" disabled={disabled} aria-label={`Actions for ${person.name}`} onClick={() => setOpen(!open)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="menu__list" role="menu">
          {canChangeRole && <button role="menuitem" onClick={() => pick('role')}><Shield size={15} /> Change role</button>}
          <button role="menuitem" onClick={() => pick('reset')}><KeyRound size={15} /> Reset password</button>
          {person.status === 'deactivated'
            ? <button role="menuitem" onClick={() => pick('reactivate')}><UserCheck size={15} /> Reactivate account</button>
            : <button role="menuitem" onClick={() => pick('deactivate')}><UserX size={15} /> Deactivate account</button>}
          <hr />
          <button role="menuitem" className="danger" onClick={() => pick('remove')}><Trash2 size={15} /> Remove member</button>
        </div>
      )}
    </div>
  )
}

export default function Team() {
  const { user, users, changeRole, resetPassword, setActive, removeUser } = useAuth()
  const navigate = useNavigate()
  const [flash, setFlash] = useState(useLocation().state?.flash || '')
  const [dlg, setDlg] = useState(null) // { type, person, role?, temp? }
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  const people = [...users].sort((a, b) => (a.id === user.id ? -1 : b.id === user.id ? 1 : 0))
  const open = (type, person, role) => { setDlg({ type, person, role: role ?? (person.role === 'admin' ? 'employee' : 'admin') }); setTyped(''); setError('') }
  const close = () => setDlg(null)
  const done = (res, msg) => { if (res.ok) { close(); setFlash(msg) } else setError(res.error) }

  async function confirm() {
    const { type, person, role } = dlg
    if (type === 'role') return done(changeRole(person.id, role), `${person.name} is now ${ROLES[role]}. It applies the next time they sign in.`)
    if (type === 'deactivate') return done(setActive(person.id, false), `${person.name} was deactivated.`)
    if (type === 'reactivate') return done(setActive(person.id, true), `${person.name} was reactivated.`)
    if (type === 'remove') return done(removeUser(person.id, typed), `${person.name} was removed.`)
    if (type === 'reset') {
      const res = await resetPassword(person.id)
      if (res.ok) setDlg({ ...dlg, temp: res.temp }); else setError(res.error)
    }
  }

  const d = dlg
  const first = d?.person.name.split(' ')[0]
  const gained = d ? pagesOf(d.role).filter((k) => !pagesOf(d.person.role).includes(k)) : []
  const lost = d ? pagesOf(d.person.role).filter((k) => !pagesOf(d.role).includes(k)) : []

  return (
    <Layout title="Team & Access" subtitle="Manage who can sign in and what each role can see">
      {flash && <div className="banner banner--ok flash">{flash} <button className="link" onClick={() => setFlash('')}>Dismiss</button></div>}

      <div className="split">
        <section className="card">
          <div className="card__head">
            <div>
              <h2 className="card__title">Team members</h2>
              <p className="card__sub">{people.length} {people.length === 1 ? 'person' : 'people'} · Roles are assigned by administrators</p>
            </div>
            <Link to="/team/new" className="btn btn--sage btn--lg"><Plus size={16} /> Create account</Link>
          </div>

          <table className="table team">
            <thead><tr><th>MEMBER</th><th>ROLE</th><th>STATUS</th><th /></tr></thead>
            <tbody>
              {people.map((p) => {
                const me = p.id === user.id
                // Guardrails mirrored from the store: the owner is untouchable, and only the owner manages admins.
                const locked = me || p.owner || (p.role === 'admin' && !user.owner)
                const lockWhy = me ? 'This is you' : p.owner ? 'The owner account is protected' : 'Only the owner can manage administrators'
                return (
                  <tr key={p.id} className={p.status === 'deactivated' ? 'is-off' : ''}>
                    <td>
                      <div className="who">
                        <Avatar name={p.name} role={p.role} />
                        <div>
                          <strong>{p.name}</strong>{p.owner && <span className="you you--owner">OWNER</span>}{me && <span className="you">YOU</span>}
                          <div className="muted small">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {locked || !user.owner ? (
                        <span className="rolepill rolepill--locked" title={locked ? lockWhy : 'Only the owner can change roles'}>{ROLES[p.role]} <Lock size={13} /></span>
                      ) : (
                        <span className="select">
                          <select aria-label={`Role for ${p.name}`} value={p.role} onChange={(e) => open('role', p, e.target.value)}>
                            {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                          <ChevronDown size={14} />
                        </span>
                      )}
                    </td>
                    <td><span className={`status2 status2--${p.status}`}><i />{STATUS[p.status]}</span></td>
                    <td className="num"><RowMenu person={p} disabled={locked} canChangeRole={!!user.owner} onPick={(t) => open(t, p)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="card__foot">Role changes apply the next time the person signs in. The owner account is protected, only the owner can manage administrators, and at least one administrator is always required.</p>
        </section>

        <aside className="card">
          <h2 className="card__title">Role access</h2>
          <p className="card__sub">What each role can open</p>
          <RoleMatrix />
          <p className="card__foot">Employees don’t see Discounts, Team &amp; Access or Settings in their menu.</p>
        </aside>
      </div>

      {d?.type === 'role' && (
        <ConfirmDialog
          tone="ok" icon={<Shield size={20} />} confirmLabel="Change role" error={error} onCancel={close} onConfirm={confirm}
          title={`Change ${d.person.name} to ${ROLES[d.role]}?`}
          text={`The new role applies the next time ${first} signs in. They will ${d.role === 'admin' ? 'gain' : 'lose'} access to:`}
          items={(d.role === 'admin' ? gained : lost).map((k) => ({ sign: d.role === 'admin' ? 'check' : 'minus', text: label(k) }))}
        />
      )}
      {d?.type === 'deactivate' && (
        <ConfirmDialog
          tone="warn" icon={<UserX size={20} />} confirmLabel="Deactivate" error={error} onCancel={close} onConfirm={confirm}
          title={`Deactivate ${d.person.name}?`}
          text="They’ll be signed out right away and won’t be able to log in until you reactivate them."
          items={[
            { sign: 'minus', text: 'Signed out of all devices' },
            { sign: 'check', text: 'Sales and inventory history is kept' },
            { sign: 'check', text: 'You can reactivate them any time' },
          ]}
        />
      )}
      {d?.type === 'reactivate' && (
        <ConfirmDialog
          tone="ok" icon={<UserCheck size={20} />} confirmLabel="Reactivate" error={error} onCancel={close} onConfirm={confirm}
          title={`Reactivate ${d.person.name}?`} text="They’ll be able to log in again with their current password."
        />
      )}
      {d?.type === 'remove' && (
        <ConfirmDialog
          tone="danger" icon={<Trash2 size={20} />} confirmLabel="Remove member" error={error} onCancel={close} onConfirm={confirm}
          disabled={typed.trim().toLowerCase() !== d.person.email}
          title={`Remove ${d.person.name}?`} text="This permanently deletes their account. This can’t be undone."
          items={[{ sign: 'minus', text: 'Account and login are deleted' }, { sign: 'check', text: 'Entries in the activity log stay' }]}
        >
          <label className="field"><span><strong>Type their email to confirm</strong></span>
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={d.person.email} autoFocus />
          </label>
        </ConfirmDialog>
      )}
      {d?.type === 'reset' && !d.temp && (
        <ConfirmDialog
          tone="warn" icon={<KeyRound size={20} />} confirmLabel="Reset password" error={error} onCancel={close} onConfirm={confirm}
          title={`Reset password for ${d.person.name}?`}
          text="They’ll get a temporary password and must choose a new one the next time they log in."
        />
      )}
      {d?.type === 'reset' && d.temp && (
        <ConfirmDialog
          tone="ok" icon={<KeyRound size={20} />} onCancel={() => { close(); setFlash(`Password reset for ${d.person.name}.`) }}
          title="Temporary password" text={`Share this with ${first}. It won’t be shown again.`}
        >
          <div className="tempbox mono">{d.temp}</div>
        </ConfirmDialog>
      )}
    </Layout>
  )
}
