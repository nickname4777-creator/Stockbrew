import { useState } from 'react'
import Modal from './Modal'
import { SUPPLY_CATEGORIES, nextSupplySku } from '../lib/inventory'

// Add / edit a supply item. `supply` = null means "add".
// Stock is only entered when adding; afterwards use Receive stock.
export default function SupplyForm({ supply, supplies, onSave, onCancel }) {
  const [f, setF] = useState(() =>
    supply
      ? {
          sku: supply.sku, name: supply.name, category: supply.category, unit: supply.unit,
          stock: String(supply.stock), min: String(supply.min), max: String(supply.max),
          cost: String(supply.cost),
        }
      : { sku: nextSupplySku(supplies), name: '', category: SUPPLY_CATEGORIES[0], unit: 'units',
          stock: '0', min: '', max: '', cost: '' }
  )
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const cats = SUPPLY_CATEGORIES.includes(f.category) ? SUPPLY_CATEGORIES : [...SUPPLY_CATEGORIES, f.category]

  function submit(e) {
    e.preventDefault()
    const res = onSave(f)
    if (!res.ok) setError(res.error)
  }

  return (
    <Modal title={supply ? 'Edit item' : 'Add item'} onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="grid2">
          <label className="field span2">
            <span>Name</span>
            <input className="input" value={f.name} onChange={set('name')} autoFocus />
          </label>
          <label className="field">
            <span>SKU</span>
            <input className="input mono" value={f.sku} onChange={set('sku')} />
          </label>
          <label className="field">
            <span>Category</span>
            <select className="input" value={f.category} onChange={set('category')}>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Unit</span>
            <input className="input" value={f.unit} onChange={set('unit')} placeholder="cartons, bags, units…" />
          </label>
          <label className="field">
            <span>Cost per unit ($)</span>
            <input className="input" type="number" step="0.01" min="0" value={f.cost} onChange={set('cost')} />
          </label>
          <label className="field">
            <span>Min (reorder at or below)</span>
            <input className="input" type="number" step="any" min="0" value={f.min} onChange={set('min')} />
          </label>
          <label className="field">
            <span>Max (par level)</span>
            <input className="input" type="number" step="any" min="0" value={f.max} onChange={set('max')} />
          </label>
          {!supply && (
            <label className="field">
              <span>Starting stock</span>
              <input className="input" type="number" step="any" min="0" value={f.stock} onChange={set('stock')} />
            </label>
          )}
        </div>
        {error && <div className="banner banner--err">{error}</div>}
        <div className="actions">
          <button type="submit" className="btn btn--primary">Save changes</button>
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
