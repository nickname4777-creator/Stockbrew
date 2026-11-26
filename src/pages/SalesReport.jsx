import { useMemo, useState } from 'react'
import { Download, Printer } from 'lucide-react'
import Layout from '../components/Layout'
import SalesTabs from '../components/SalesTabs'
import { useStore } from '../store/StoreContext'
import { RANGES, rangeDays, salesReport, totalsFor, toCsv, download } from '../lib/reports'
import { money, shortDate, delta } from '../lib/format'

// Flowchart: System output → Sales report. Admin only (see lib/roles.js).
export default function SalesReport() {
  const { transactions } = useStore()
  const [range, setRange] = useState('7')

  const r = useMemo(() => {
    const now = new Date()
    const days = rangeDays(transactions, range, now)
    const rep = salesReport(transactions, now, days)
    const prev = range === 'all' ? null : totalsFor(transactions, now, days, days)
    return { days, rep, prev }
  }, [transactions, range])

  const t = r.rep.totals
  const label = RANGES.find((x) => x.key === range).label.toLowerCase()
  const vs = r.prev ? `vs previous ${r.days === 1 ? 'day' : `${r.days} days`}` : ''
  const stats = [
    { label: 'REVENUE', value: money(t.revenue), note: r.prev ? delta(t.revenue, r.prev.revenue, vs) : `${r.days} days of sales` },
    { label: 'ORDERS', value: t.orders.toLocaleString(), note: r.prev ? delta(t.orders, r.prev.orders, vs) : 'All completed sales' },
    { label: 'UNITS SOLD', value: t.units.toLocaleString(), note: t.orders ? `${(t.units / t.orders).toFixed(1)} per order` : '—' },
    { label: 'DISCOUNTS GIVEN', value: money(t.discount), note: t.revenue + t.discount ? `${Math.round((t.discount / (t.revenue + t.discount)) * 100)}% of gross sales` : '—' },
  ]

  function exportCsv() {
    const days = toCsv(['Date', 'Orders', 'Units', 'Revenue', 'Discounts'],
      r.rep.perDay.map((d) => [d.date.toISOString().slice(0, 10), d.orders, d.units, d.revenue.toFixed(2), d.discount.toFixed(2)]))
    const prods = toCsv(['Product', 'Category', 'Units', 'Revenue'], r.rep.products.map((p) => [p.name, p.category, p.units, p.revenue.toFixed(2)]))
    download(`sales-report-${range}.csv`, `${days}\n\n${prods}`)
  }

  return (
    <Layout title="Sales & Demand" subtitle="Revenue performance, demand forecasting, and model accuracy">
      <SalesTabs />

      <div className="toolbar no-print">
        <div className="filters">
          {RANGES.map((x) => (
            <button key={x.key} className={'chip' + (range === x.key ? ' chip--on' : '')} onClick={() => setRange(x.key)}>{x.label}</button>
          ))}
        </div>
        <div className="actions actions--inline">
          <button className="btn btn--ghost" onClick={exportCsv}><Download size={15} /> Export CSV</button>
          <button className="btn btn--ghost" onClick={() => window.print()}><Printer size={15} /> Print</button>
        </div>
      </div>

      <section className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__label">{s.label}</div>
            <div className="stat__value">{s.value}</div>
            <div className="stat__note">{s.note}</div>
          </div>
        ))}
      </section>

      <div className="split">
        <section className="card">
          <h2 className="card__title">By day</h2>
          <p className="card__sub">Completed sales {label}, newest first. Voided sales are not counted.</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th className="num">Orders</th><th className="num">Units</th><th className="num">Discounts</th><th className="num">Revenue</th></tr></thead>
              <tbody>
                {r.rep.perDay.map((d) => (
                  <tr key={d.date.toISOString()}>
                    <td>{shortDate(d.date)}</td>
                    <td className="num mono">{d.orders}</td>
                    <td className="num mono">{d.units}</td>
                    <td className="num mono">{d.discount ? `−${money(d.discount)}` : '—'}</td>
                    <td className="num mono strong">{money(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">Top products</h2>
          <p className="card__sub">Ranked by revenue</p>
          <table className="table">
            <thead><tr><th>Product</th><th className="num">Units</th><th className="num">Revenue</th></tr></thead>
            <tbody>
              {r.rep.products.slice(0, 10).map((p) => (
                <tr key={p.name}><td>{p.name}<div className="muted small">{p.category}</div></td><td className="num mono">{p.units}</td><td className="num mono strong">{money(p.revenue)}</td></tr>
              ))}
              {!r.rep.products.length && <tr><td colSpan={3} className="empty">No sales in this period.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </Layout>
  )
}
