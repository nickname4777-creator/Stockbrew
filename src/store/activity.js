import { useEffect, useState } from 'react'

// Admin activity log (Settings → Activity log). Kept apart from the other stores so anything
// can write to it with log(). When the backend arrives, only this file changes.
const KEY = 'stockbrew:activity'
const EVENT = 'stockbrew:activity'
export const TYPES = { account: 'ACCOUNT', role: 'ROLE', discount: 'DISCOUNT', security: 'SECURITY' }

const HOUR = 3600 * 1000
const SEED = [
  [2, 'Admin User', 'account', 'Created account for Leo Cruz (Employee)'],
  [26, 'Admin User', 'role', 'Changed Ana Reyes from Employee to Administrator'],
  [40, 'Ana Reyes', 'discount', 'Created discount “Pastry Pairing −15%”'],
  [52, 'Admin User', 'security', 'Reset password for Maya Santos'],
  [76, 'Admin User', 'account', 'Deactivated account for Jon Park'],
  [90, 'Ana Reyes', 'discount', 'Edited discount “Morning Rush −10%”'],
  [124, 'Admin User', 'account', 'Created account for Sam Rivera (Employee)'],
  [140, 'Admin User', 'role', 'Changed Maya Santos from Administrator to Employee'],
]

function read() {
  try {
    const v = localStorage.getItem(KEY)
    if (v) return JSON.parse(v)
  } catch { /* ignore */ }
  const now = Date.now()
  const seeded = SEED.map(([h, who, type, text], i) => ({ id: `a${i}`, at: new Date(now - h * HOUR).toISOString(), who, type: TYPES[type], text }))
  save(seeded)
  return seeded
}
function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* ignore */ } }

// log('Admin User', 'account', 'Created account for …')
export function log(who, type, text) {
  const entry = { id: `a${Date.now()}${Math.random().toString(36).slice(2, 5)}`, at: new Date().toISOString(), who, type: TYPES[type], text }
  save([entry, ...read()].slice(0, 500))
  window.dispatchEvent(new Event(EVENT))
}

export function useActivity() {
  const [list, setList] = useState(read)
  useEffect(() => {
    const on = () => setList(read())
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  return list
}

export const csv = (list) => {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`
  return ['When,Who,Type,Details', ...list.map((e) => [e.at, e.who, e.type, e.text].map(q).join(','))].join('\n')
}
