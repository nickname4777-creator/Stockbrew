import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/inventory', label: 'Overview', end: true },
  { to: '/inventory/levels', label: 'Levels' },
  { to: '/inventory/risk', label: 'Risk' },
  { to: '/inventory/waste', label: 'Waste' },
]

export default function InventoryTabs() {
  return (
    <div className="tabs">
      {TABS.map(({ to, label, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}>
          {label}
        </NavLink>
      ))}
    </div>
  )
}
