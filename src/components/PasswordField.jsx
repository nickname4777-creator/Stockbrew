import { useState } from 'react'

export default function PasswordField({ label = 'Password', value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <label className="field">
      <span className="auth__row">
        {label}
        <button type="button" className="auth__link" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
      </span>
      <input className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete} />
    </label>
  )
}
