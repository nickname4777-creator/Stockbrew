import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer,
} from 'recharts'
import Layout from '../components/Layout'
import SalesTabs from '../components/SalesTabs'
import { useStore } from '../store/StoreContext'
import { runForecast } from '../lib/analytics'
import { moneyShort, axisMoney, delta } from '../lib/format'

const tick = { fill: '#6F6A61', fontSize: 11 }

export default function SalesForecast() {
  const { transactions, discounts } = useStore()
  // Flowchart: Run Demand Forecasting → input parameters → Forecast.
  const [draft, setDraft] = useState({ history: 4, horizon: 2 })
  const [applied, setApplied] = useState(draft)

  const result = useMemo(
    () => runForecast(transactions, applied, new Date()),
    [transactions, applied]
  )
  const promos = discounts.filter((d) => d.active).length
  const ok = !result.error

  const stats = [
    {
      label: 'NEXT WEEK FORECAST',
      value: ok ? moneyShort(result.next) : '—',
      note: ok ? delta(result.next, result.lastActual, 'projected') : 'Not enough data',
    },
    {
      label: 'FORECAST HORIZON',
      value: `${applied.horizon} Week${applied.horizon === 1 ? '' : 's'}`,
      note: ok ? `Model confidence: ${result.confidence}%` : 'Model confidence: —',
    },
    { label: 'DEMAND EVENTS', value: String(promos), note: 'Active promotions' },
  ]

  const set = (k) => (e) => setDraft({ ...draft, [k]: Number(e.target.value) })

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
        <div className="card__head">
          <div>
            <h2 className="card__title">Actual vs Predicted Demand</h2>
            <p className="card__sub">
              Weeks 1–{applied.history} actuals, Weeks {applied.history + 1}–{applied.history + applied.horizon} projected
            </p>
          </div>
          <div className="params">
            <label className="field">
              <span>History</span>
              <select className="input" value={draft.history} onChange={set('history')}>
                {[3, 4, 6, 8, 12].map((n) => <option key={n} value={n}>{n} weeks</option>)}
              </select>
            </label>
            <label className="field">
              <span>Forecast ahead</span>
              <select className="input" value={draft.horizon} onChange={set('horizon')}>
                {[1, 2, 3, 4, 6].map((n) => <option key={n} value={n}>{n} week{n > 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <button className="btn btn--primary" onClick={() => setApplied(draft)}>Run forecast</button>
          </div>
        </div>

        {ok ? (
          <div className="chart chart--tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.rows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DDD8CC" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="wk" tickLine={false} axisLine={false} tick={tick} padding={{ left: 8, right: 8 }} />
                <YAxis domain={[0, 'auto']} tickFormatter={axisMoney} tickLine={false} axisLine={false} tick={tick} width={52} />
                <Tooltip formatter={(v) => moneyShort(v)} />
                <Legend verticalAlign="bottom" iconType="plainline" height={32} wrapperStyle={{ fontSize: 12, color: '#6F6A61' }} />
                <Line name="Actual" type="monotone" dataKey="actual" stroke="#302820" strokeWidth={2}
                      dot={{ r: 4, fill: '#302820' }} isAnimationActive={false} />
                <Line name="Predicted" type="monotone" dataKey="predicted" stroke="#3E78B2" strokeWidth={2}
                      strokeDasharray="5 3" dot={{ r: 3, fill: '#3E78B2' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="banner banner--warn">{result.error}</div>
        )}
      </section>
    </Layout>
  )
}
