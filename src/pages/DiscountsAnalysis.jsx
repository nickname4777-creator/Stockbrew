import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer,
} from 'recharts'
import Layout from '../components/Layout'
import DiscountTabs from '../components/DiscountTabs'
import { useStore } from '../store/StoreContext'
import { discountImpact, TARGET_DEPTH, ELASTICITY } from '../lib/discounts'
import { axisMoney, moneyShort } from '../lib/format'

const tick = { fill: '#6F6A61', fontSize: 11 }

export default function DiscountsAnalysis() {
  const { transactions } = useStore()
  const res = useMemo(() => discountImpact(transactions, new Date()), [transactions])
  const none = res.depth == null

  const stats = [
    { label: 'PROMOS APPLIED', value: String(res.promos), note: 'Last 30 days' },
    { label: 'AVG DISCOUNT DEPTH', value: none ? '—' : `${res.depth.toFixed(1)}%`,
      note: none ? 'No discounted sales yet' : `${res.depth <= TARGET_DEPTH ? '↓' : '↑'} vs ${TARGET_DEPTH}% target` },
    { label: 'INCREMENTAL REVENUE', value: `${res.incremental >= 0 ? '+' : '−'}${moneyShort(Math.abs(res.incremental))}`,
      note: '↑ Estimated, attributed to promotions' },
  ]

  return (
    <Layout title="Discounts" subtitle="Discount recommendations and impact analysis">
      <DiscountTabs />

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
        <h2 className="card__title">Revenue Impact of Discounts</h2>
        <p className="card__sub">
          Monthly comparison: with vs without discounts. “Without” is an estimate that assumes a {ELASTICITY}× sales response to price cuts.
        </p>
        <div className="chart chart--tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={res.buckets} margin={{ top: 10, right: 16, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid stroke="#DDD8CC" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={tick} />
              <YAxis domain={[0, 'auto']} tickFormatter={axisMoney} tickLine={false} axisLine={false} tick={tick} width={48} />
              <Tooltip formatter={(v) => moneyShort(v)} />
              <Legend verticalAlign="bottom" iconType="square" height={32} wrapperStyle={{ fontSize: 12, color: '#6F6A61' }} />
              <Bar name="With Discounts" dataKey="with" fill="#302820" barSize={32} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              <Bar name="Without Discounts" dataKey="without" fill="#3E78B2" barSize={32} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </Layout>
  )
}
