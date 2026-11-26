import { useMemo } from 'react'
import {
  BarChart, Bar, LabelList, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import Layout from '../components/Layout'
import SalesTabs from '../components/SalesTabs'
import { useStore } from '../store/StoreContext'
import { accuracyByCategory } from '../lib/analytics'

const tick = { fill: '#6F6A61', fontSize: 11 }

export default function SalesAccuracy() {
  const { transactions, products } = useStore()

  const res = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))]
    return accuracyByCategory(transactions, cats, new Date())
  }, [transactions, products])

  const rows = res.rows.filter((r) => r.accuracy != null).map((r) => ({ name: r.name, accuracy: Math.round(r.accuracy) }))
  const lo = rows.length ? Math.min(60, Math.floor(Math.min(...rows.map((r) => r.accuracy)) / 10) * 10) : 60
  const ticks = []
  for (let v = lo; v <= 100; v += 10) ticks.push(v)

  const stats = [
    { label: 'OVERALL MAPE', value: res.mape == null ? '—' : `${res.mape.toFixed(1)}%`, note: 'Mean Abs % Error' },
    { label: 'AVG ACCURACY', value: res.accuracy == null ? '—' : `${res.accuracy.toFixed(1)}%`,
      note: res.deltaPts == null ? 'No earlier month to compare' :
        `${res.deltaPts >= 0 ? '↑ +' : '↓ '}${res.deltaPts.toFixed(1)}pts vs last month` },
    { label: 'MODELS ACTIVE', value: String(rows.length), note: 'One per category' },
  ]

  return (
    <Layout title="Sales & Demand" subtitle="Revenue performance, demand forecasting, and model accuracy">
      <SalesTabs />

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
        <h2 className="card__title">Forecast Accuracy by Category</h2>
        <p className="card__sub">% accuracy over trailing 4 weeks, forecasting each week from the 4 before it</p>
        {rows.length ? (
          <div className="chart chart--tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DDD8CC" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={tick} />
                <YAxis domain={[lo, 100]} ticks={ticks} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={tick} width={44} />
                <Bar dataKey="accuracy" fill="#302820" barSize={36} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  <LabelList dataKey="accuracy" position="top" formatter={(v) => `${v}%`} style={{ fill: '#6F6A61', fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="banner banner--warn">Not enough history yet. Accuracy needs at least 8 weeks of sales per category.</div>
        )}
      </section>
    </Layout>
  )
}
