// Pure helpers for the login / password forms. No React, no storage.
export const MIN_PASSWORD = 8
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const normEmail = (e) => String(e || '').trim().toLowerCase()
export const isEmail = (e) => EMAIL.test(normEmail(e))

// Flowchart: Valid login? Returns an error string, or '' when the fields look fine.
export function validateLogin({ email, password }) {
  if (!normEmail(email) || !password) return 'Enter your email and password.'
  if (!isEmail(email)) return 'Enter a valid email address.'
  return ''
}

// Rule from the design: at least 8 characters and one number.
export function validatePassword(pw) {
  if (String(pw || '').length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  if (!/\d/.test(pw)) return 'Include at least one number.'
  return ''
}

// A readable temporary password that always satisfies validatePassword (letters + at least one number).
export function generatePassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ'
  const digits = '23456789'
  const pick = (set, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => set[v % set.length]).join('')
  return pick(letters, 5) + pick(digits, 3) + pick(letters, 2)
}
