import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import Layout from './Layout'
import { PAGES } from '../lib/roles'

// Shown inside the normal page shell when a role opens a page it isn't allowed to.
export default function AccessRestricted({ page }) {
  const p = PAGES[page]
  const [sent, setSent] = useState(false)
  return (
    <Layout title={p.label} subtitle={p.blurb}>
      <div className="restricted">
        <div className="restricted__icon"><Lock size={22} strokeWidth={1.5} /></div>
        <div className="restricted__eyebrow mono">ADMINISTRATORS ONLY</div>
        <h2>Administrator access required</h2>
        <p>{p.label} is available to administrators. If you need access, ask an administrator to update your role in Team &amp; Access.</p>
        <div className="actions actions--center">
          <Link to="/dashboard" className="btn btn--sage">Back to Dashboard</Link>
          <button className="btn btn--ghost" disabled={sent} onClick={() => setSent(true)}>{sent ? 'Request sent' : 'Request access'}</button>
        </div>
      </div>
    </Layout>
  )
}
