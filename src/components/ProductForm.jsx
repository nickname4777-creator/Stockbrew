import { useState } from 'react'
import Modal from './Modal'
import { CATEGORIES, nextSku } from '../lib/products'

// Add / edit dialog. `product` = null means "add".
// Cancel = "keep current product details"; Save = "Save Changes".
export default function ProductForm({ product, products, onSave, onCancel }) {
  const [f, setF] = useState(() =>
    product
      ? {
          sku: product.sku, name: product.name, category: product.category,
          price: String(product.price), cost: String(product.cost), stock: String(product.stock),
          rating: product.rating == null ? '' : String(product.rating),
        }
      : { sku: nextSku(products), name: '', category: CATEGORIES[0], price: '', cost: '', stock: '0', rating: '' }
  )
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const categories = CATEGORIES.includes(f.category) ? CATEGORIES : [...CATEGORIES, f.category]

  function submit(e) {
    e.preventDefault()
    const res = onSave(f)
    if (!res.ok) setError(res.error)
  }

  return (
    <Modal title={product ? 'Edit product' : 'Add product'} onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="grid2">
          <label className="field span2"><span>Name</span>
            <input className="input" value={f.name} onChange={set('name')} autoFocus /></label>
          <label className="field"><span>SKU</span>
            <input className="input mono" value={f.sku} onChange={set('sku')} /></label>
          <label className="field"><span>Category</span>
            <select className="input" value={f.category} onChange={set('category')}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select></label>
          <label className="field"><span>Price ($)</span>
            <input className="input" type="number" step="0.01" min="0" value={f.price} onChange={set('price')} /></label>
          <label className="field"><span>Cost ($)</span>
            <input className="input" type="number" step="0.01" min="0" value={f.cost} onChange={set('cost')} /></label>
          <label className="field"><span>Stock</span>
            <input className="input" type="number" step="1" min="0" value={f.stock} onChange={set('stock')} /></label>
          <label className="field"><span>Rating (optional)</span>
            <input className="input" type="number" step="0.1" min="0" max="5" value={f.rating} onChange={set('rating')} /></label>
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
