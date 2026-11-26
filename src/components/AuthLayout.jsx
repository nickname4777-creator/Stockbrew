import { Link } from 'react-router-dom'
import { Layers } from 'lucide-react'

const POINTS = [
  ['01', 'Know what’s brewing', 'Understand sales and forecast demand.'],
  ['02', 'Keep your shelves ready', 'Stay ahead of low stock and waste.'],
  ['03', 'Make every decision count', 'Turn daily insights into better choices.'],
]

// Shared frame for the login and password pages. `topText` / `topStrong` (and optional `topTo` link) fill the top-right corner.
export default function AuthLayout({ topText, topStrong, topTo, children }) {
  return (
    <div className="auth">
      <aside className="auth__side">
        <div className="auth__brand">
          <div className="auth__logo"><Layers size={20} strokeWidth={1.5} /></div>
          <div><div className="auth__name">STOCK</div><div className="auth__sub">BREW</div></div>
        </div>
        <div className="auth__pitch">
          <h2>A better day,<br />from the first brew.</h2>
          <p>Your sales, stock, and next smart move.<br />All in one place.</p>
          <ol className="auth__points">
            {POINTS.map(([n, t, d]) => (
              <li key={n}><span className="mono">{n}</span><div><strong>{t}</strong><small>{d}</small></div></li>
            ))}
          </ol>
        </div>
        <div className="auth__craft mono">CRAFTED FOR YOUR DAILY GRIND.</div>
      </aside>

      <main className="auth__main">
        <div className="auth__top">
          <span>{topText}</span>{' '}
          {topTo ? <Link to={topTo}><strong>{topStrong}</strong></Link> : <strong>{topStrong}</strong>}
        </div>
        <div className="auth__card">{children}</div>
        <div className="auth__foot"><span>Stock Brew</span><span>Help &amp; support</span></div>
      </main>
    </div>
  )
}
