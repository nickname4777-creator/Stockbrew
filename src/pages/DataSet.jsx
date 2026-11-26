import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import Layout from '../components/Layout'
import { useStore } from '../store/StoreContext'
import { lineNet } from '../lib/analytics'
import { toCsv, download } from '../lib/reports'
import { fmtQty } from '../lib/inventory'
import { money, dateTimeOf } from '../lib/format'

const PAGE = 25
const newest = (a, b) => new Date(b[0]) - new Date(a[0])

// Flowchart: Data processing and analysis → Collect data / Data set. Read-only, admin only.
// Each set is { columns, rows } so adding another dataset later is one more entry below.
export default function DataSet() {
  const { transactions, supplies, movements, waste } = useStore()
  const [tab, setTab] = useState('sales')
  const [shown, setShown] = useState(PAGE)

  const sets = useMemo(() => {
    const name = (id) => supplies.find((s) => s.id === id)?.name ?? 'Removed item'
    const unit = (id) => supplies.find((s) => s.id === id)?.unit ?? ''
    return {
      sales: {
        label: 'Sales lines',
        columns: ['When', 'Sale', 'Product', 'Category', 'Qty', 'Unit price', 'Discount %', 'Net', 'Status'],
        rows: transactions.flatMap((t) => t.items.map((i) => [
          t.createdAt, t.id, i.name, i.category, i.qty, i.price.toFixed(2), (i.discountPct ?? t.discountPct) || 0,
          lineNet(i, t.discountPct).toFixed(2), t.status === 'voided' ? 'voided' : 'completed',
        ])).sort(newest),
      },
      movements: {
        label: 'Stock movements',
        columns: ['When', 'Item', 'Direction', 'Quantity'],
        rows: movements.map((m) => [m.at, name(m.itemId), m.type === 'in' ? 'In (delivery)' : 'Out (used)', `${fmtQty(m.qty)} ${unit(m.itemId)}`]).sort(newest),
      },
      waste: {
        label: 'Waste',
        columns: ['When', 'Item', 'Quantity', 'Reason', 'Cost'],
        rows: waste.map((w) => [w.at, w.name, `${fmtQty(w.qty)} ${w.unit}`, w.reason, w.cost.toFixed(2)]).sort(newest),
      },
    }
  }, [transactions, supplies, movements, waste])

  const set = sets[tab]
  const cell = (c, v) => (c === 'When' ? dateTimeOf(v) : c === 'Unit price' || c === 'Net' || c === 'Cost' ? money(Number(v)) : v)

  return (
    <Layout title="Data set" subtitle="The raw records behind every report and forecast">
      <section className="card">
        <div className="toolbar">
          <div className="filters">
            {Object.entries(sets).map(([k, s]) => (
              <button key={k} className={'chip' + (tab === k ? ' chip--on' : '')} onClick={() => { setTab(k); setShown(PAGE) }}>
                {s.label} <span className="chip__n">{s.rows.length}</span>
              </button>
            ))}
          </div>
          <button className="btn btn--ghost" onClick={() => download(`stockbrew-${tab}.csv`, toCsv(set.columns, set.rows))}>
            <Download size={15} /> Export CSV
          </button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead><tr>{set.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {set.rows.slice(0, shown).map((r, i) => (
                <tr key={i} className={r[r.length - 1] === 'voided' ? 'is-void' : ''}>
                  {r.map((v, j) => <td key={j} className={j === 0 || typeof v === 'number' ? 'mono nowrap' : ''}>{cell(set.columns[j], v)}</td>)}
                </tr>
              ))}
              {!set.rows.length && <tr><td colSpan={set.columns.length} className="empty">No records yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="card__foot">
          Showing {Math.min(shown, set.rows.length)} of {set.rows.length} records{' '}
          {set.rows.length > shown && <button className="link strong" onClick={() => setShown(shown + PAGE)}>Show more</button>}
        </p>
      </section>
    </Layout>
  )
}
