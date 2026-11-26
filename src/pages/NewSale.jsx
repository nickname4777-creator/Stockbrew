import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SalesTabs from '../components/SalesTabs'
import { useStore } from '../store/StoreContext'
import { pickDiscount } from '../lib/discounts'
import { money } from '../lib/format'

export default function NewSale() {
  const { products, discounts, addSale } = useStore()
  const navigate = useNavigate()

  const [lines, setLines] = useState([])   // [{ productId, name, price, qty }]
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState(1)
  const [discountId, setDiscountId] = useState('')
  const [error, setError] = useState('')

  // Product discounts apply automatically; the dropdown is for whole-order discounts.
  const orderDiscounts = discounts.filter((d) => d.active && !d.productId)
  const priced = lines.map((l) => {
    const d = pickDiscount(discounts, l.productId, discountId)
    return { ...l, percent: d.percent, discountName: d.name, off: (l.price * l.qty * d.percent) / 100 }
  })
  const subtotal = priced.reduce((s, l) => s + l.price * l.qty, 0)
  const discount = priced.reduce((s, l) => s + l.off, 0)

  function addItem() {
    const product = products.find((p) => p.id === productId)
    if (!product) return setError('Pick a product first.')

    const amount = Number(qty)
    if (!Number.isInteger(amount) || amount < 1) return setError('Quantity must be 1 or more.')

    const already = lines.find((l) => l.productId === productId)
    const newQty = (already ? already.qty : 0) + amount
    if (newQty > product.stock) return setError(`Only ${product.stock} of ${product.name} left in stock.`)
    const next = already
      ? lines.map((l) => (l.productId === productId ? { ...l, qty: newQty } : l))
      : [...lines, { productId, name: product.name, price: product.price, qty: amount }]

    setError('')
    setQty(1)
    setLines(next)
  }

  function completeSale() {
    const result = addSale({ lines, discountId })
    if (!result.ok) return setError(result.error)
    navigate('/sales')
  }

  return (
    <Layout title="Sales & Demand" subtitle="Revenue performance, demand forecasting, and model accuracy">
      <SalesTabs />

      <section className="card narrow">
        <h2 className="card__title">New sale</h2>

        <div className="row">
          <label className="field grow">
            <span>Product</span>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock === 0}>
                  {p.name} · {money(p.price)} · {p.stock} left
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Qty</span>
            <input className="input input--qty" type="number" min="1"
                   value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <button className="btn btn--ghost" onClick={addItem}>Add item</button>
        </div>

        {error && <div className="banner banner--err">{error}</div>}

        <table className="table">
          <tbody>
            {priced.map((l) => (
              <tr key={l.productId}>
                <td>
                  {l.qty} × {l.name}
                  {l.percent > 0 && <span className="tag tag--ok">−{l.percent}% {l.discountName}</span>}
                </td>
                <td className="num mono">{money(l.price * l.qty - l.off)}</td>
                <td className="num">
                  <button className="btn btn--ghost btn--sm"
                          onClick={() => setLines(lines.filter((x) => x.productId !== l.productId))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!lines.length && <tr><td className="empty">No items yet.</td></tr>}
          </tbody>
        </table>

        <div className="row row--end">
          <label className="field">
            <span>Whole-order discount</span>
            <select className="input" value={discountId} onChange={(e) => setDiscountId(e.target.value)}>
              <option value="">None</option>
              {orderDiscounts.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.percent}%)</option>)}
            </select>
          </label>
          <div className="summary">
            <div><span>Subtotal</span><span className="mono">{money(subtotal)}</span></div>
            <div><span>Discount</span><span className="mono">−{money(discount)}</span></div>
            <div className="total"><span>Total</span><span className="mono">{money(subtotal - discount)}</span></div>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn--primary" onClick={completeSale}>Complete sale</button>
          <Link to="/sales" className="btn btn--ghost">Cancel</Link>
        </div>
      </section>
    </Layout>
  )
}
