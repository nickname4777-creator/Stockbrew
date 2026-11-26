import { useState } from 'react'
import Modal from './Modal'
import { WASTE_REASONS, fmtQty } from '../lib/inventory'
import { money } from '../lib/format'

export default function WasteForm({ supplies, onSave, onCancel }) {
  const [f, setF] = useState({ itemId: '', qty: '', reason: WASTE_REASONS[0] })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const item = supplies.find((s) => s.id === f.itemId)
  const cost = item && Number(f.qty) > 0 ? Number(f.qty) * item.cost : 0

  function submit(e) {
    e.preventDefault()
    const res = onSave(f)
    if (!res.ok) setError(res.error)
  }

  return (
    <Modal title="Log waste" onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="grid2">
          <label className="field span2">
            <span>Item</span>
            <select className="input" value={f.itemId} onChange={set('itemId')} autoFocus>
              <option value="">Choose an item…</option>
              {supplies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Quantity{item ? ` (${item.unit})` : ''}</span>
            <input className="input" type="number" step="any" min="0" value={f.qty} onChange={set('qty')} />
          </label>
          <label className="field">
            <span>Reason</span>
            <select className="input" value={f.reason} onChange={set('reason')}>
              {WASTE_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </div>
        {item && <p className="hint">{fmtQty(item.stock)} {item.unit} in stock. Cost of this waste: {money(cost)}.</p>}
        {error && <div className="banner banner--err">{error}</div>}
        <div className="actions">
          <button type="submit" className="btn btn--primary">Log waste</button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
