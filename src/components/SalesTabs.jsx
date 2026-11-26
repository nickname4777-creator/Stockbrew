import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

const TABS = [
  { to: '/sales', label: 'Overview', end: true },
  { to: '/sales/forecast', label: 'Forecast' },
  { to: '/sales/accuracy', label: 'Accuracy' },
  { to: '/sales/report', label: 'Report', page: 'report' }, // admin only, see lib/roles.js
]

// Shared by every Sales & Demand page. "New sale" is the flowchart's "Input Sales" entry point.
export default function SalesTabs() {
  const { canOpen } = useAuth()
  return (
    <div className="toolbar">
      <div className="tabs">
        {TABS.filter((t) => !t.page || canOpen(t.page)).map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}
          >
            {label}
          </NavLink>
        ))}
      </div>
      <Link to="/sales/new" className="btn btn--primary">+ New sale</Link>
    </div>
  )
}
