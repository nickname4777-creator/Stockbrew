import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import ProductForm from '../components/ProductForm'
import ProductDetails from '../components/ProductDetails'
import { useAuth } from '../store/AuthContext'
import { useStore } from '../store/StoreContext'
import { CATEGORIES, stockStatus } from '../lib/products'
import { dayIdx } from '../lib/analytics'
import { money } from '../lib/format'

const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

export default function Products() {
  const { products, transactions, addProduct, updateProduct, deleteProduct } = useStore()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const { can } = useAuth()
  const canEdit = can('product.edit')
  const [editing, setEditing] = useState(null) // null = closed, 'new' = add, or a product = edit
  const [viewing, setViewing] = useState(null) // flowchart: Select product → View details

  // Units sold per product in the last 30 days (voided sales excluded).
  const sales30 = useMemo(() => {
    const now = new Date()
    const out = {}
    for (const t of transactions) {
      if (t.status === 'voided') continue
      const idx = dayIdx(t.createdAt, now)
      if (idx < 0 || idx >= 30) continue
      for (const i of t.items) out[i.productId] = (out[i.productId] || 0) + i.qty
    }
    return out
  }, [transactions])

  const filters = ['All', ...new Set([...CATEGORIES, ...products.map((p) => p.category)])]
  const q = query.trim().toLowerCase()
  const rows = products.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  )

  // Flowchart: Action Choose? → Add / Edit → Save Changes
  function save(fields) {
    const res = editing === 'new' ? addProduct(fields) : updateProduct(editing.id, fields)
    if (res.ok) setEditing(null)
    return res
  }

  // Flowchart: Action Choose? → Delete
  function remove(p) {
    if (window.confirm(`Delete ${p.name}? Past sales are kept, but any discounts on it are removed.`)) deleteProduct(p.id)
  }

  return (
    <Layout title="Products" subtitle="Full menu catalog with sales performance and stock status">
      <div className="toolbar">
        <div className="filters">
          <input className="input search" type="search" placeholder="Search products"
                 aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
          {filters.map((c) => (
            <button key={c} className={'tab' + (category === c ? ' tab--active' : '')} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        {canEdit && <button className="btn btn--primary" onClick={() => setEditing('new')}>+ Add product</button>}
      </div>

      <section className="card card--flush">
        <div className="table-wrap">
          <table className="table table--catalog">
            <thead>
              <tr>
                <th>SKU</th><th>Name</th><th>Category</th>
                <th className="num">Price</th><th className="num" >Stock</th>
                <th className="num">Sales 30D</th><th className="num">Rating</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stockStatus(p.stock)
                return (
                  <tr key={p.id}>
                    <td className="mono muted">{p.sku}</td>
                    <td>
                      <button className="link" onClick={() => setViewing(p)}>{p.name}</button>
                      <span className={`status status--${st.key}`}><i className="dot" />{st.label}</span>
                    </td>
                    <td className="muted">{p.category}</td>
                    <td className="num mono">{money(p.price)}</td>
                    <td className={'num mono' + (p.stock === 0 ? ' is-zero' : '')}>{p.stock}</td>
                    <td className="num mono">{compact(sales30[p.id] || 0)}</td>
                    <td className="num mono">{p.rating == null ? '—' : `★ ${p.rating.toFixed(1)}`}</td>
                    <td className="num nowrap">
                      <button className="btn btn--ghost btn--sm" onClick={() => setViewing(p)}>Details</button>
                      {canEdit && <>{' '}<button className="btn btn--ghost btn--sm" onClick={() => setEditing(p)}>Edit</button>{' '}
                      <button className="btn btn--ghost btn--sm" onClick={() => remove(p)}>Delete</button></>}
                    </td>
                  </tr>
                )
              })}
              {!rows.length && (
                <tr><td colSpan={8} className="empty">
                  {products.length ? 'No products match your search.' : 'No products yet. Use “Add product” to create one.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {viewing && (
        <ProductDetails
          product={products.find((p) => p.id === viewing.id) || viewing}
          sold30={sales30[viewing.id] || 0}
          onEdit={canEdit ? () => { setEditing(viewing); setViewing(null) } : null}
          onClose={() => setViewing(null)}
        />
      )}

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          products={products}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </Layout>
  )
}
