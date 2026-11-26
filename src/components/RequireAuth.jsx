import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import AccessRestricted from './AccessRestricted'

// Nested routes need a signed-in user, otherwise → /login.
// First login → /set-password. Add `page="discounts"` (see lib/roles.js) to also require access to that page.
export default function RequireAuth({ page }) {
  const { user, canOpen } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.mustChange) return <Navigate to="/set-password" replace />
  if (page && !canOpen(page)) return <AccessRestricted page={page} />
  return <Outlet />
}
