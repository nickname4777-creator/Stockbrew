import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import Layout from '../components/Layout'
import SettingsTabs from '../components/SettingsTabs'
import { useActivity, csv, TYPES } from '../store/activity'

const FILTERS = [['All', null], ['Accounts', 'ACCOUNT'], ['Roles', 'ROLE'], ['Discounts', 'DISCOUNT'], ['Security', 'SECURITY']]
const PAGE = 8
const DAYS = 30

const when = (iso) => {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${day} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function SettingsActivity() {
  const all = useActivity()
  const [type, setType] = useState(null)
  const [shown, setShown] = useState(PAGE)

  const recent = useMemo(() => {
    const cutoff = Date.now() - DAYS * 86400000
    return all.filter((e) => new Date(e.at).getTime() >= cutoff)
  }, [all])
  const rows = recent.filter((e) => !type || e.type === type)

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([csv(rows)], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'stockbrew-activity.csv' })
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Settings" subtitle="Workspace preferences and a record of admin activity">
      <SettingsTabs />
      <section className="card">
        <div className="toolbar">
          <div className="filters">
            {FILTERS.map(([label, t]) => (
              <button key={label} className={'chip' + (type === t ? ' chip--on' : '')} onClick={() => { setType(t); setShown(PAGE) }}>{label}</button>
            ))}
          </div>
          <button className="btn btn--ghost" onClick={exportCsv}><Download size={15} /> Export CSV</button>
        </div>

        <table className="table activity">
          <thead><tr><th>WHEN</th><th>WHO</th><th>TYPE</th><th>DETAILS</th></tr></thead>
          <tbody>
            {rows.slice(0, shown).map((e) => (
              <tr key={e.id}>
                <td className="mono muted nowrap">{when(e.at)}</td>
                <td><strong>{e.who}</strong></td>
                <td><span className={`tagtype tagtype--${e.type.toLowerCase()}`}>{e.type}</span></td>
                <td>{e.text}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={4} className="empty">No activity to show yet.</td></tr>}
          </tbody>
        </table>

        <p className="card__foot">
          Showing the last {DAYS} days · {Math.min(shown, rows.length)} of {rows.length} events{' '}
          {rows.length > shown && <button className="link" onClick={() => setShown(shown + PAGE)}>Show more</button>}
        </p>
      </section>
    </Layout>
  )
}
