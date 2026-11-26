import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import InventoryTabs from '../components/InventoryTabs'
import WasteForm from '../components/WasteForm'
import { useStore } from '../store/StoreContext'
import { dayIdx } from '../lib/analytics'
import { unitLabel, fmtQty } from '../lib/inventory'
import { money, delta, timeOf } from '../lib/format'

function logged(iso, now) {
  const i = dayIdx(iso, now)
  return i === 0 ? `Today ${timeOf(iso)}` : i === 1 ? 'Yesterday' : `${i} days ago`
}

export default function InventoryWaste() {
  const { supplies, waste, logWaste, removeWaste } = useStore()
  const [open, setOpen] = useState(false)

  const m = useMemo(() => {
    const now = new Date()
    const ago = (w) => dayIdx(w.at, now)
    const today = waste.filter((w) => ago(w) === 0)
    const week = waste.filter((w) => ago(w) >= 0 && ago(w) < 7)
    const prev = waste.filter((w) => ago(w) >= 7 && ago(w) < 14)
    const sum = (list, k) => list.reduce((s, w) => s + w[k], 0)
    const counts = {}
    for (const w of week) counts[w.reason] = (counts[w.reason] || 0) + 1
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return {
      now,
      todayUnits: sum(today, 'qty'), todayCost: sum(today, 'cost'),
      weekCost: sum(week, 'cost'), prevCost: sum(prev, 'cost'),
      top: top ? { reason: top[0], pct: Math.round((top[1] / week.length) * 100) } : null,
      recent: [...waste].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15),
    }
  }, [waste])

  const stats = [
    { label: 'TOTAL WASTE (TODAY)', value: `${fmtQty(m.todayUnits)} units`, note: `↑ ${money(m.todayCost)} lost value` },
    { label: 'WASTE COST (7 DAYS)', value: money(m.weekCost), note: delta(m.weekCost, m.prevCost, 'vs last week') },
    { label: 'TOP WASTE CAUSE', value: m.top ? m.top.reason : '—', note: m.top ? `${m.top.pct}% of incidents` : 'No waste logged this week' },
  ]

  return (
    <Layout title="Inventory" subtitle="Stock positions, flow tracking, and risk alerts">
      <div className="toolbar">
        <InventoryTabs />
        <button className="btn btn--primary" onClick={() => setOpen(true)}>+ Log waste</button>
      </div>

      <section className="stats stats--wide">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__label">{s.label}</div>
            <div className="stat__value">{s.value}</div>
            <div className="stat__note">{s.note}</div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="card__title">Waste Log</h2>
        <p className="card__sub">Recent discarded and expired inventory items</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th className="num">Quantity</th><th>Reason</th><th className="num">Cost</th><th className="num">Logged</th><th /></tr>
            </thead>
            <tbody>
              {m.recent.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td className="num mono">{unitLabel(w.qty, w.unit)}</td>
                  <td><span className="reason">{w.reason}</span></td>
                  <td className="num mono strong">{money(w.cost)}</td>
                  <td className="num mono">{logged(w.at, m.now)}</td>
                  <td className="num">
                    <button className="btn btn--ghost btn--sm"
                      onClick={() => window.confirm('Remove this entry and put the stock back?') && removeWaste(w.id)}>
                      Undo
                    </button>
                  </td>
                </tr>
              ))}
              {!m.recent.length && <tr><td colSpan={6} className="empty">Nothing logged yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <WasteForm supplies={supplies} onCancel={() => setOpen(false)}
          onSave={(f) => { const r = logWaste(f); if (r.ok) setOpen(false); return r }} />
      )}
    </Layout>
  )
}
