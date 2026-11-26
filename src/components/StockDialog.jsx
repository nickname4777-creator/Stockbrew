import { useState } from 'react'
import Modal from './Modal'
import { fmtQty } from '../lib/inventory'

// Flowchart: Input Stock. A delivery arrived: pick the item and how much.
export default function StockDialog({ supplies, itemId = '', onSave, onCancel }) {
  const [f, setF] = useState({ itemId, qty: '' })
  const [error, setError] = useState('')
  const item = supplies.find((s) => s.id === f.itemId)

  function submit(e) {
    e.preventDefault()
    const res = onSave(f)
    if (!res.ok) setError(res.error)
  }

  return (
    <Modal title="Receive stock" onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="grid2">
          <label className="field span2"><span>Item</span>
            <select className="input" value={f.itemId} onChange={(e) => setF({ ...f, itemId: e.target.value })} autoFocus>
              <option value="">Choose an item…</option>
              {supplies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
          <label className="field"><span>Quantity received{item ? ` (${item.unit})` : ''}</span>
            <input className="input" type="number" step="any" min="0" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></label>
        </div>
        {item && <p className="hint">Currently {fmtQty(item.stock)} {item.unit} on the shelf.</p>}
        {error && <div className="banner banner--err">{error}</div>}
        <div className="actions">
          <button type="submit" className="btn btn--primary">Save</button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
