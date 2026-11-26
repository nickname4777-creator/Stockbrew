import Modal from './Modal'
import { stockStatus } from '../lib/products'
import { money } from '../lib/format'

// Flowchart: View details → Update? . "Edit" leads to Save changes; Close = Keep details.
// `onEdit` is null for people who may not edit (employees), so the button just isn't shown.
export default function ProductDetails({ product: p, sold30, onEdit, onClose }) {
  const st = stockStatus(p.stock)
  const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0
  const rows = [
    ['SKU', p.sku], ['Category', p.category], ['Price', money(p.price)], ['Cost', money(p.cost)],
    ['Margin', `${margin}%`], ['In stock', `${p.stock} (${st.label})`],
    ['Sold, last 30 days', String(sold30)], ['Rating', p.rating == null ? '—' : `★ ${p.rating.toFixed(1)}`],
  ]
  return (
    <Modal title={p.name} onClose={onClose}>
      <dl className="details">
        {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd className="mono">{v}</dd></div>))}
      </dl>
      <div className="actions">
        {onEdit && <button className="btn btn--primary" onClick={onEdit}>Edit product</button>}
        <button className="btn btn--ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}
