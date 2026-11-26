import { Check, Minus } from 'lucide-react'
import { PAGES, ACTION_LABELS, actionRoles } from '../lib/roles'

// "What each role can open", built straight from lib/roles.js so it can never disagree with the app.
// `withActions` adds the in-page buttons (void a sale, edit products…) under the pages.
export default function RoleMatrix({ withActions = false }) {
  const Mark = ({ ok }) => (ok ? <Check size={15} className="pos" /> : <Minus size={15} className="muted" />)
  const rows = [
    ...Object.values(PAGES).map((p) => ({ key: p.label, roles: p.roles })),
    ...(withActions ? Object.keys(ACTION_LABELS).map((k) => ({ key: ACTION_LABELS[k], roles: actionRoles(k) })) : []),
  ]
  return (
    <table className="matrix">
      <thead><tr><th /><th>EMPLOYEE</th><th>ADMIN</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td>{r.key}</td>
            <td><Mark ok={r.roles.includes('employee')} /></td>
            <td><Mark ok={r.roles.includes('admin')} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
