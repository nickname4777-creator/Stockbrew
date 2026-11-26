import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BarChart3, Hexagon, Star, List, Layers, LogOut, Users, SlidersHorizontal, Database } from 'lucide-react'
import { useAuth } from '../store/AuthContext'
import { PAGES } from '../lib/roles'

// Edit this array to add/rename pages. `to` must match a <Route path> in App.jsx.
// `page` is the key in lib/roles.js, which decides who sees the link.
const NAV_ITEMS = [
  { page: 'dashboard', icon: LayoutDashboard },
  { page: 'sales', icon: BarChart3 },
  { page: 'inventory', icon: Hexagon },
  { page: 'discounts', icon: Star },
  { page: 'products', icon: List },
]
// Shown under an "ADMINISTRATION" heading, only to roles that can open them.
const ADMIN_ITEMS = [
  { page: 'data', icon: Database },
  { page: 'team', icon: Users },
  { page: 'settings', icon: SlidersHorizontal },
]

export default function Sidebar() {
  const { user, logout, canOpen } = useAuth()
  const navigate = useNavigate()
  const out = () => { logout(); navigate('/login', { replace: true }) }
  const links = (items) => items.filter((n) => canOpen(n.page)).map(({ page, icon: Icon }) => (
    <NavLink
      key={page}
      to={PAGES[page].to}
      className={({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '')}
    >
      <Icon size={16} strokeWidth={1.5} />
      <span>{PAGES[page].label}</span>
    </NavLink>
  ))
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          <Layers size={20} strokeWidth={1.5} />
        </div>
        <div>
          <div className="sidebar__name">STOCK</div>
          <div className="sidebar__sub">BREW</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {links(NAV_ITEMS)}
        {ADMIN_ITEMS.some((n) => canOpen(n.page)) && <div className="sidebar__section">ADMINISTRATION</div>}
        {links(ADMIN_ITEMS)}
      </nav>

      <div className="sidebar__user">
        <div className="sidebar__avatar">{(user?.name || '?')[0].toUpperCase()}</div>
        <div className="sidebar__who">
          <div className="sidebar__user-name">{user?.name}</div>
          <div className="sidebar__user-role">{user?.role === 'employee' ? 'EMPLOYEE' : 'ADMIN'}</div>
        </div>
        <button className="sidebar__logout" onClick={out} title="Log out" aria-label="Log out"><LogOut size={16} strokeWidth={1.5} /></button>
      </div>
    </aside>
  )
}
