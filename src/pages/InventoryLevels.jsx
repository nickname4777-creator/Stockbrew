import { useState } from 'react'
import Layout from '../components/Layout'
import InventoryTabs from '../components/InventoryTabs'
import StockDialog from '../components/StockDialog'
import SupplyForm from '../components/SupplyForm'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../store/AuthContext'
import { levelOf, fmtQty } from '../lib/inventory'

export default function InventoryLevels() {
  const { supplies, receiveStock, addSupply, updateSupply } = useStore()
  const { can } = useAuth()
  // null = nothing open | { type: 'stock', itemId } | { type: 'supply', item: supply | null }
  const [dialog, setDialog] = useState(null)
  const close = () => setDialog(null)

  const done = (res) => { if (res.ok) close(); return res }

  return (
    <Layout title="Inventory" subtitle="Stock positions, flow tracking, and risk alerts">
      <div className="toolbar">
        <InventoryTabs />
        <div className="actions actions--inline">
          <button className="btn btn--primary" onClick={() => setDialog({ type: 'stock', itemId: '' })}>+ Receive stock</button>
          {can('supply.edit') && <button className="btn btn--ghost" onClick={() => setDialog({ type: 'supply', item: null })}>+ Add item</button>}
        </div>
      </div>

      <section className="card">
        <h2 className="card__title">Stock Levels</h2>
        <p className="card__sub">Current supply positions against daily min/max par levels</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th className="num">Min</th><th className="num">Stock</th><th className="num">Max</th><th className="num">Status</th><th /></tr>
            </thead>
            <tbody>
              {supplies.map((s) => {
                const lvl = levelOf(s)
                const pct = s.max ? Math.min(100, (s.stock / s.max) * 100) : 0
                return (
                  <tr key={s.id}>
                    <td className="wide">
                      {s.name}
                      <div className="bar" role="img" aria-label={`${Math.round(pct)}% of par max`}>
                        <div className={`bar__fill bar__fill--${lvl.key}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="num mono">{fmtQty(s.min)}</td>
                    <td className={'num mono strong' + (lvl.key === 'out' ? ' is-zero' : '')}>{fmtQty(s.stock)}</td>
                    <td className="num mono">{fmtQty(s.max)}</td>
                    <td className="num"><span className={`badge badge--${lvl.key}`}>{lvl.label}</span></td>
                    <td className="num nowrap">
                      <button className="btn btn--ghost btn--sm" onClick={() => setDialog({ type: 'stock', itemId: s.id })}>Receive</button>{' '}
                      {can('supply.edit') && <button className="btn btn--ghost btn--sm" onClick={() => setDialog({ type: 'supply', item: s })}>Edit</button>}
                    </td>
                  </tr>
                )
              })}
              {!supplies.length && <tr><td colSpan={6} className="empty">No items yet. Use “Add item” to start tracking supplies.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {dialog?.type === 'stock' && (
        <StockDialog supplies={supplies} itemId={dialog.itemId} onCancel={close} onSave={(f) => done(receiveStock(f))} />
      )}
      {dialog?.type === 'supply' && (
        <SupplyForm supply={dialog.item} supplies={supplies} onCancel={close}
          onSave={(f) => done(dialog.item ? updateSupply(dialog.item.id, f) : addSupply(f))} />
      )}
    </Layout>
  )
}
