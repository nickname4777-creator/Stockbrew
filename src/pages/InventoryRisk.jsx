import { useMemo } from 'react'
import Layout from '../components/Layout'
import InventoryTabs from '../components/InventoryTabs'
import { useStore } from '../store/StoreContext'
import { buildAlerts } from '../lib/inventory'

export default function InventoryRisk() {
  const { supplies } = useStore()

  // Flowchart: Stock Low / Out? → Generate Reorder Alert. The alert list is rebuilt from live stock.
  const alerts = useMemo(() => buildAlerts(supplies), [supplies])
  const over = alerts.filter((a) => a.kind === 'over')
  const stockouts = alerts.filter((a) => a.kind === 'stockout')
  const critical = stockouts.filter((a) => a.severity === 'critical').length

  return (
    <Layout title="Inventory" subtitle="Stock positions, flow tracking, and risk alerts">
      <InventoryTabs />

      <section className="stats stats--wide">
        <div className="stat">
          <div className="stat__label">OVERSTOCK ITEMS</div>
          <div className="stat__value">{over.length}</div>
          <div className="stat__note">{over.length ? '↓ Expiry risk, consider a discount' : 'No overstock'}</div>
        </div>
        <div className="stat">
          <div className="stat__label">STOCKOUT RISK</div>
          <div className={'stat__value' + (stockouts.length ? ' stat__value--crit' : '')}>{stockouts.length}</div>
          <div className="stat__note">
            {stockouts.length ? `↓ ${critical} critical — action needed now` : 'Nothing running short'}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">Active Risk Alerts</h2>
        <div className="alerts">
          {alerts.map((a) => (
            <div key={a.id} className={`alert alert--${a.severity}`}>
              <div className="alert__head">
                <div><span className="mono muted">{a.sku}</span> <strong>{a.name}</strong></div>
                <span className={`badge badge--sev-${a.severity}`}>{a.severity.toUpperCase()}</span>
              </div>
              <div className="alert__text">{a.text}</div>
            </div>
          ))}
          {!alerts.length && <div className="empty">Keep monitoring. Every item is within its min/max levels.</div>}
        </div>
      </section>
    </Layout>
  )
}
