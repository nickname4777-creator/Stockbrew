import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import DiscountTabs from '../components/DiscountTabs'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../store/AuthContext'
import { buildRecommendations } from '../lib/discounts'
import { money, moneyShort } from '../lib/format'

export default function DiscountsRecommendations() {
  const { products, discounts, transactions, dismissed,
          addDiscount, setDiscountActive, dismissRec, restoreRecs } = useStore()
  const { can } = useAuth()
  const manage = can('discount.manage') // flowchart: Approved? is an admin decision

  const recs = useMemo(
    () => buildRecommendations(products, transactions, new Date()),
    [products, transactions]
  )
  const rows = recs.filter((r) => !dismissed.includes(r.productId))
  const isActive = (pid) => discounts.some((d) => d.active && d.productId === pid)
  const pending = rows.filter((r) => r.percent > 0 && !isActive(r.productId))

  const avg = pending.length ? pending.reduce((s, r) => s + r.percent, 0) / pending.length : null
  const gain = pending.reduce((s, r) => s + r.weeklyGain, 0)

  const stats = [
    { label: 'RECOMMENDATIONS', value: String(pending.length), note: 'Waiting for approval' },
    { label: 'AVG SUGGESTED DISC.', value: avg == null ? '—' : `${avg.toFixed(1)}%`, note: 'Across open suggestions' },
    { label: 'PROJECTED REV. LIFT', value: `${gain >= 0 ? '+' : '−'}${moneyShort(Math.abs(gain))}`,
      note: `${gain >= 0 ? '↑' : '↓'} If all applied this week` },
  ]

  // Manual "Input Discount" form
  const [form, setForm] = useState({ name: '', percent: 10, productId: '' })
  const [error, setError] = useState('')
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function save() {
    const res = addDiscount(form)
    if (!res.ok) return setError(res.error)
    setError('')
    setForm({ name: '', percent: 10, productId: '' })
  }

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
        <div className="card__head">
          <div>
            <h2 className="card__title">Discount Recommendations</h2>
            <p className="card__sub">Suggestions based on stock level, sales speed and margin</p>
          </div>
          {manage && dismissed.length > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={restoreRecs}>
              Restore {dismissed.length} dismissed
            </button>
          )}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th><th className="num">Price</th><th className="num">Discount</th>
                <th className="num">Lift</th><th>Margin</th><th>Reason</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td>{r.name}</td>
                  <td className="num mono">{money(r.price)}</td>
                  <td className="num mono">{r.percent ? `−${r.percent}%` : '—'}</td>
                  <td className="num mono">{r.percent ? `+${r.lift}%` : '—'}</td>
                  <td><span className={`badge badge--${r.marginLabel.toLowerCase()}`}>{r.marginLabel}</span></td>
                  <td>{r.reason}</td>
                  <td className="num nowrap">
                    {r.percent > 0 && (isActive(r.productId) ? (
                      <span className="tag tag--ok">Active</span>
                    ) : !manage ? (
                      <span className="tag">Awaiting approval</span>
                    ) : (
                      <>
                        <button className="btn btn--primary btn--sm"
                          onClick={() => addDiscount({ name: `${r.percent}% off ${r.name}`, percent: r.percent, productId: r.productId, source: 'suggested' })}>
                          Approve
                        </button>{' '}
                        <button className="btn btn--ghost btn--sm" onClick={() => dismissRec(r.productId)}>Dismiss</button>
                      </>
                    ))}
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="empty">Nothing to suggest right now. Stock and sales look balanced.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Active discounts</h2>
        <p className="card__sub">Discounts on a product apply automatically at checkout. “Whole order” ones are picked per sale.</p>

        {manage && (<>
        <div className="row">
          <label className="field grow">
            <span>Name</span>
            <input className="input" value={form.name} onChange={setF('name')} placeholder="e.g. Weekend special" />
          </label>
          <label className="field">
            <span>Percent</span>
            <input className="input input--qty" type="number" min="1" max="90" value={form.percent} onChange={setF('percent')} />
          </label>
          <label className="field">
            <span>Applies to</span>
            <select className="input" value={form.productId} onChange={setF('productId')}>
              <option value="">Whole order</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <button className="btn btn--primary" onClick={save}>Save discount</button>
        </div>
        {error && <div className="banner banner--err">{error}</div>}
        </>)}

        <table className="table">
          <thead><tr><th>Name</th><th>Applies to</th><th className="num">Percent</th><th className="num">Status</th></tr></thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className={d.active ? '' : 'is-off'}>
                <td>{d.name}</td>
                <td>{d.productId ? products.find((p) => p.id === d.productId)?.name ?? 'Unknown product' : 'Whole order'}</td>
                <td className="num mono">{d.percent}%</td>
                <td className="num">
                  {manage ? (
                    <button className="btn btn--ghost btn--sm" onClick={() => setDiscountActive(d.id, !d.active)}>
                      {d.active ? 'Turn off' : 'Turn on'}
                    </button>
                  ) : (
                    <span className={'tag' + (d.active ? ' tag--ok' : '')}>{d.active ? 'On' : 'Off'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  )
}
