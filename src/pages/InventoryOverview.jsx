import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import InventoryTabs from '../components/InventoryTabs'
import { useStore } from '../store/StoreContext'
import { levelOf, flowByDay, stockValues, fmtQty } from '../lib/inventory'
import { money, delta } from '../lib/format'

const tick = { fill: '#6F6A61', fontSize: 11 }

export default function InventoryOverview() {
  const { supplies, movements, waste } = useStore()

  const m = useMemo(() => {
    const now = new Date()
    return { flow: flowByDay(movements, now, 7), values: stockValues(supplies, movements, waste, now) }
  }, [supplies, movements, waste])

  const total = supplies.length
  const ok = supplies.filter((s) => levelOf(s).key === 'ok').length
  const needs = supplies.filter((s) => ['low', 'out'].includes(levelOf(s).key)).length
  const categories = new Set(supplies.map((s) => s.category)).size

  const stats = [
    { label: 'INGREDIENTS & SUPPLIES', value: String(total), note: `Across ${categories} categories` },
    { label: 'WELL STOCKED', value: String(ok), note: `↑ ${total ? Math.round((ok / total) * 100) : 0}% of items healthy` },
    { label: 'LOW / OUT', value: String(needs), tone: needs ? 'warn' : '', note: needs ? '↓ Need restocking today' : 'Nothing to reorder' },
    { label: 'EST. STOCK VALUE', value: money(m.values.now).replace('.00', ''), note: delta(m.values.now, m.values.then, 'vs last week') },
  ]

  const data = m.flow.map((d) => ({
    day: d.date.toLocaleDateString('en-US', { weekday: 'short' }),
    inbound: +d.in.toFixed(1),
    outbound: +d.out.toFixed(1),
  }))

  return (
    <Layout title="Inventory" subtitle="Stock positions, flow tracking, and risk alerts">
      <InventoryTabs />

      <section className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__label">{s.label}</div>
            <div className={'stat__value' + (s.tone ? ` stat__value--${s.tone}` : '')}>{s.value}</div>
            <div className="stat__note">{s.note}</div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="card__title">Supply Flow — Last 7 Days</h2>
        <p className="card__sub">Daily deliveries received vs consumed in service (all items, in their own units)</p>
        <div className="chart chart--tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid stroke="#DDD8CC" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={tick} />
              <YAxis domain={[0, 'auto']} tickLine={false} axisLine={false} tick={tick} width={40} />
              <Tooltip formatter={(v) => fmtQty(v)} />
              <Legend verticalAlign="bottom" iconType="square" height={32} wrapperStyle={{ fontSize: 12, color: '#6F6A61' }} />
              <Bar name="Inbound" dataKey="inbound" fill="#302820" barSize={20} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Bar name="Outbound" dataKey="outbound" fill="#3E78B2" barSize={20} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </Layout>
  )
}
