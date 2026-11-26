import { createContext, useCallback, useContext, useState } from 'react'
import { validateLogin, validatePassword, normEmail, isEmail, generatePassword } from '../lib/auth'
import { can as canDo, canOpen as canOpenPage, ROLES } from '../lib/roles'
import { log } from './activity'

// All account storage lives in this file. When the backend arrives, replace the actions
// below with API calls; nothing else needs to change.
// NOTE: front-end only. Passwords are hashed but this is NOT real security.
const USERS = 'stockbrew:users'
const SEEDED = 'stockbrew:users-seeded'
const SESSION = 'stockbrew:session' // user id; localStorage = "remember me", sessionStorage = this tab only

const read = (store, key, fallback) => {
  try { const v = store.getItem(key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
const write = (store, key, value) => { try { store.setItem(key, JSON.stringify(value)) } catch { /* ignore */ } }
const norm = (u) => ({ role: 'admin', status: 'active', ...u })
// There is always exactly one owner. Older data without one: the first administrator becomes the owner.
const ensureOwner = (list) => {
  if (list.some((u) => u.owner)) return list
  const i = list.findIndex((u) => u.role === 'admin')
  return i < 0 ? list : list.map((u, j) => (j === i ? { ...u, owner: true } : u))
}

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Demo accounts so every screen can be tried straight away. `hint` = shown under the login form.
export const DEMO = [
  { id: 'u1', name: 'Admin User', email: 'demo@stockbrew.com', password: 'brew12345', role: 'admin', owner: true, hint: true },
  { id: 'u2', name: 'Demo Barista', email: 'staff@stockbrew.com', password: 'brew12345', role: 'employee', hint: true },
  // Never logged in yet: signing in sends them to "Set your password".
  { id: 'u3', name: 'Sam Rivera', email: 'sam@yourcafe.com', password: 'Welcome1', role: 'employee', status: 'invited', mustChange: true, hint: true },
  { id: 'u4', name: 'Maya Santos', email: 'maya@yourcafe.com', password: 'brew12345', role: 'employee' },
  { id: 'u5', name: 'Leo Cruz', email: 'leo@yourcafe.com', password: 'Welcome1', role: 'employee', status: 'invited', mustChange: true },
  { id: 'u6', name: 'Ana Reyes', email: 'ana@yourcafe.com', password: 'brew12345', role: 'admin', hint: true },
]

// Adds the demo accounts once (so removing one later sticks).
async function loadUsers() {
  let users = read(localStorage, USERS, []).map(norm)
  if (!localStorage.getItem(SEEDED)) {
    for (const d of DEMO) {
      if (users.some((u) => u.email === d.email)) continue
      const { password, hint, ...rest } = d
      users.push(norm({ ...rest, pass: await hash(password) }))
    }
    write(localStorage, SEEDED, '1')
  }
  users = ensureOwner(users)
  write(localStorage, USERS, users)
  return users
}

const toPublic = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, mustChange: !!u.mustChange, owner: !!u.owner })

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const id = sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION)
    const found = ensureOwner(read(localStorage, USERS, []).map(norm)).find((u) => u.id === id && u.status !== 'deactivated')
    return found ? toPublic(found) : null
  })
  const [users, setUsers] = useState(() => ensureOwner(read(localStorage, USERS, []).map(norm)).map(toPublic))

  const persist = (list) => { write(localStorage, USERS, list); setUsers(list.map(toPublic)) }
  const stored = () => ensureOwner(read(localStorage, USERS, []).map(norm))
  const activeAdmins = (list) => list.filter((u) => u.role === 'admin' && u.status !== 'deactivated').length

  const start = (u, remember) => {
    try {
      localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION)
      ;(remember ? localStorage : sessionStorage).setItem(SESSION, u.id)
    } catch { /* ignore */ }
    setUser(toPublic(u))
  }

  // Flowchart: User login → Valid login? → Dashboard / Error wrong password/acc.
  const login = useCallback(async ({ email, password, remember }) => {
    const bad = validateLogin({ email, password })
    if (bad) return { ok: false, error: bad }
    const list = await loadUsers()
    setUsers(list.map(toPublic))
    const u = list.find((x) => x.email === normEmail(email))
    if (!u || u.pass !== (await hash(password))) return { ok: false, error: 'Wrong email or password.' }
    if (u.status === 'deactivated') return { ok: false, error: 'This account is deactivated. Ask your administrator.' }
    start(u, remember)
    return { ok: true, mustChange: !!u.mustChange }
  }, [])

  // First login: replace the temporary password, become 'active'.
  const setPassword = useCallback(async (password, confirm) => {
    const bad = validatePassword(password)
    if (bad) return { ok: false, error: bad }
    if (password !== confirm) return { ok: false, error: 'The two passwords don’t match.' }
    const list = stored()
    const me = list.find((u) => u.id === user?.id)
    if (!me) return { ok: false, error: 'Please sign in again.' }
    if (me.pass === (await hash(password))) return { ok: false, error: 'Choose a password different from the temporary one.' }
    const next = { ...me, pass: await hash(password), mustChange: false, status: 'active' }
    persist(list.map((u) => (u.id === me.id ? next : u)))
    log(me.name, 'security', `${me.name} set a new password`)
    setUser(toPublic(next))
    return { ok: true }
  }, [user])

  // Flowchart: End.
  const logout = useCallback(() => {
    try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION) } catch { /* ignore */ }
    setUser(null)
  }, [])

  // ---------- Team & Access ----------
  // Guardrails (re-checked here, not just in the UI):
  //  1. Only an active administrator can do any of this.
  //  2. The owner account can't be changed, reset, deactivated or removed by anyone.
  //  3. Only the owner can create administrators or manage them (role, reset, deactivate, remove).
  //  4. The last active administrator can't be demoted, deactivated or removed.
  // Blocked attempts are written to the activity log as SECURITY events.
  const actor = user?.name || 'Unknown'

  const blocked = (what, error) => { log(actor, 'security', `Blocked: tried to ${what}`); return { ok: false, error } }
  const denyAdminWork = (list, target, what) => {
    const me = list.find((u) => u.id === user?.id)
    if (!me || me.role !== 'admin' || me.status === 'deactivated') return blocked(what, 'Only administrators can do this.')
    if (target?.id === me.id) return { ok: false, error: 'You can’t do this to your own account.' }
    if (target?.owner) return blocked(`${what} (the owner account)`, 'The owner account is protected and can’t be changed.')
    if (target?.role === 'admin' && !me.owner) return blocked(`${what} (an administrator)`, 'Only the owner can manage administrators.')
    return null
  }

  const createUser = useCallback(async ({ name, email, role, password, mustChange }) => {
    const list = stored()
    const me = list.find((u) => u.id === user?.id)
    if (!me || me.role !== 'admin') return blocked('create an account', 'Only administrators can do this.')
    if (role === 'admin' && !me.owner) return blocked('create an administrator account', 'Only the owner can create administrators.')
    if (!String(name || '').trim()) return { ok: false, error: 'Enter their full name.' }
    if (!isEmail(email)) return { ok: false, error: 'Enter a valid work email.' }
    if (list.some((u) => u.email === normEmail(email))) return { ok: false, error: 'Someone with this email already exists.' }
    if (!ROLES[role]) return { ok: false, error: 'Choose a role.' }
    const bad = validatePassword(password)
    if (bad) return { ok: false, error: `Temporary password: ${bad.toLowerCase()}` }
    const u = {
      id: `u${Date.now()}`, name: name.trim(), email: normEmail(email), role,
      status: mustChange ? 'invited' : 'active', mustChange: !!mustChange, pass: await hash(password),
    }
    persist([...list, u])
    log(actor, 'account', `Created account for ${u.name} (${ROLES[role]})`)
    return { ok: true }
  }, [user, actor])

  const changeRole = useCallback((id, role) => {
    const list = stored(); const t = list.find((u) => u.id === id)
    if (!t) return { ok: false, error: 'Person not found.' }
    if (!ROLES[role]) return { ok: false, error: 'Choose a role.' }
    const denied = denyAdminWork(list, t, `change the role of ${t.name}`)
    if (denied) return denied
    if (role === 'admin' && !list.find((u) => u.id === user.id).owner) return blocked(`make ${t.name} an administrator`, 'Only the owner can make someone an administrator.')
    if (t.role === 'admin' && role !== 'admin' && activeAdmins(list) < 2) return { ok: false, error: 'At least one administrator is required.' }
    persist(list.map((u) => (u.id === id ? { ...u, role } : u)))
    log(actor, 'role', `Changed ${t.name} from ${ROLES[t.role]} to ${ROLES[role]}`)
    return { ok: true }
  }, [user, actor])

  const resetPassword = useCallback(async (id) => {
    const list = stored(); const t = list.find((u) => u.id === id)
    if (!t) return { ok: false, error: 'Person not found.' }
    const denied = denyAdminWork(list, t, `reset the password of ${t.name}`)
    if (denied) return denied
    const temp = generatePassword()
    const pass = await hash(temp)
    persist(list.map((u) => (u.id === id ? { ...u, pass, mustChange: true, status: u.status === 'deactivated' ? u.status : 'invited' } : u)))
    log(actor, 'security', `Reset password for ${t.name}`)
    return { ok: true, temp }
  }, [user, actor])

  const setActive = useCallback((id, active) => {
    const list = stored(); const t = list.find((u) => u.id === id)
    if (!t) return { ok: false, error: 'Person not found.' }
    const denied = denyAdminWork(list, t, `${active ? 'reactivate' : 'deactivate'} ${t.name}`)
    if (denied) return denied
    if (!active && t.role === 'admin' && activeAdmins(list) < 2) return { ok: false, error: 'At least one administrator is required.' }
    persist(list.map((u) => (u.id === id ? { ...u, status: active ? (u.mustChange ? 'invited' : 'active') : 'deactivated' } : u)))
    log(actor, 'account', `${active ? 'Reactivated' : 'Deactivated'} account for ${t.name}`)
    return { ok: true }
  }, [user, actor])

  const removeUser = useCallback((id, typedEmail) => {
    const list = stored(); const t = list.find((u) => u.id === id)
    if (!t) return { ok: false, error: 'Person not found.' }
    const denied = denyAdminWork(list, t, `remove ${t.name}`)
    if (denied) return denied
    if (normEmail(typedEmail) !== t.email) return { ok: false, error: 'Type their email exactly to confirm.' }
    if (t.role === 'admin' && activeAdmins(list) < 2) return { ok: false, error: 'At least one administrator is required.' }
    persist(list.filter((u) => u.id !== id))
    log(actor, 'account', `Removed account for ${t.name}`)
    return { ok: true }
  }, [user, actor])

  return (
    <AuthContext.Provider value={{
      user, users, login, logout, setPassword,
      createUser, changeRole, resetPassword, setActive, removeUser,
      can: (action) => canDo(user?.role, action),
      canOpen: (page) => canOpenPage(user?.role, page),
    }}>
      {children}
    </AuthContext.Provider>
  )
}
