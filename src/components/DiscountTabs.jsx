import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/discounts', label: 'Recommendations', end: true },
  { to: '/discounts/analysis', label: 'Analysis' },
]

export default function DiscountTabs() {
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
