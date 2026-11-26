import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/settings', label: 'General', end: true },
  { to: '/settings/activity', label: 'Activity log' },
  { to: '/settings/roles', label: 'Roles' },
]

export default function SettingsTabs() {
  return (
    <div className="tabs">
      {TABS.map(({ to, label, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}>{label}</NavLink>
      ))}
    </div>
  )
}
