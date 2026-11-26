import { useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import Layout from '../components/Layout'
import SalesTabs from '../components/SalesTabs'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../store/AuthContext'
import { LOW_STOCK } from '../lib/products'
import { dailySeries, txNet, txUnits, txSubtotal } from '../lib/analytics'
import { money, moneyShort, axisMoney, shortDate, dateTimeOf, delta } from '../lib/format'

const sum = (a, k) => a.reduce((s, d) => s + d[k], 0)
const tick = { fill: '#6F6A61', fontSize: 11 }

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="tip">
      <strong>{d.day}</strong>
      <div>Revenue: {money(d.revenue)}</div>
      <div>Units: {d.units}</div>
      <div className="tip__muted">Same day last week: {money(d.previous)}</div>
    </div>
  )
}

export default function SalesOverview() {
  const { transactions, products, voidSale } = useStore()
  const { can } = useAuth()

  const m = useMemo(() => {
    const now = new Date()
    const cur = dailySeries(transactions, 7, now)
    const prev = dailySeries(transactions, 7, now, 7)
    return { cur, prev }
  }, [transactions])

  const rev = sum(m.cur, 'revenue'), prevRev = sum(m.prev, 'revenue')
  const units = sum(m.cur, 'units'), prevUnits = sum(m.prev, 'units')
  const orders = sum(m.cur, 'orders'), prevOrders = sum(m.prev, 'orders')
  const aov = orders ? rev / orders : 0
  const prevAov = prevOrders ? prevRev / prevOrders : 0
  const low = products.filter((p) => p.stock <= LOW_STOCK).length

  const stats = [
    { label: 'TOTAL REVENUE', value: moneyShort(rev), note: delta(rev, prevRev, 'vs last week') },
    { label: 'UNITS SOLD', value: units.toLocaleString(), note: delta(units, prevUnits, 'vs last week') },
    { label: 'AVG ORDER VALUE', value: money(aov), note: delta(aov, prevAov, 'vs last week') },
    { label: 'ACTIVE SKUS', value: String(products.length), note: `${low} low stock` },
  ]

  const data = m.cur.map((d, i) => ({
    day: shortDate(d.date), revenue: d.revenue, units: d.units, previous: m.prev[i].revenue,
  }))
  const range = `${shortDate(m.cur[0].date)}–${shortDate(m.cur[6].date)}`.toUpperCase()

  const recent = [...transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)

  return (
    <Layout title="Sales & Demand" subtitle="Revenue performance, demand forecasting, and model accuracy">
      <SalesTabs />

      <section className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__label">{s.label}</div>
            <div className="stat__value">{s.value}</div>
            <div className="stat__note">{s.note}</div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card__head">
          <div>
            <h2 className="card__title">Revenue & Units — Last 7 Days</h2>
            <p className="card__sub">Daily revenue across all channels. Dashed line (when available) is the same day last week.</p>
          </div>
          <span className="chip">{range}</span>
        </div>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#302820" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#302820" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#DDD8CC" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={tick} />
              <YAxis domain={[0, 'auto']} tickFormatter={axisMoney} tickLine={false} axisLine={false} tick={tick} width={48} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="revenue" stroke="#302820" strokeWidth={2}
                    fill="url(#fill)" dot={{ r: 4, fill: '#302820' }} isAnimationActive={false} />
              {prevRev > 0 && (
                <Line type="monotone" dataKey="previous" stroke="#3E78B2" strokeWidth={1.5}
                      strokeDasharray="4 3" dot={false} isAnimationActive={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Recent transactions</h2>
        <p className="card__sub">Voiding a sale (admin only) removes it from every total and returns its stock.</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>When</th><th>Items</th><th>Discount</th><th className="num">Total</th><th /></tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className={t.status === 'voided' ? 'is-void' : ''}>
                  <td className="mono">{t.id}</td>
                  <td>{dateTimeOf(t.createdAt)}</td>
                  <td>{txUnits(t)} item{txUnits(t) === 1 ? '' : 's'}</td>
                  <td>{t.discountName ? `${t.discountName} (−${money(txSubtotal(t) - txNet(t))})` : '—'}</td>
                  <td className="num mono">{money(txNet(t))}</td>
                  <td className="num">
                    {t.status === 'voided' ? (
                      <span className="tag">Voided</span>
                    ) : can('sales.void') && (
                      <button className="btn btn--ghost btn--sm"
                        onClick={() => window.confirm(`Void ${t.id}? This can't be undone.`) && voidSale(t.id)}>
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={6} className="empty">No sales yet. Use “New sale” to record the first one.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  )
}
