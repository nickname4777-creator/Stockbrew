import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  seedProducts, seedSupplies, seedDiscounts,
  makeSeedTransactions, makeSeedMovements, makeSeedWaste, SEED_DAYS,
} from './seed'
import { pickDiscount } from '../lib/discounts'
import { validateProduct, cleanProduct } from '../lib/products'
import { r3, validateSupply, cleanSupply } from '../lib/inventory'
import { useAuth } from './AuthContext'
import { log } from './activity'

// All persistence lives in this file. When the backend arrives, replace load/save
// and the actions below with API calls. The pages never touch localStorage directly.
const KEY = 'stockbrew:v6'

const fresh = () => {
  const now = new Date()
  return {
    products: seedProducts,
    supplies: seedSupplies,
    discounts: seedDiscounts,
    dismissed: [], // product ids whose discount suggestion was declined
    transactions: makeSeedTransactions(seedProducts, seedDiscounts, now, SEED_DAYS),
    movements: makeSeedMovements(seedSupplies, now), // supply in / out, feeds the flow chart
    waste: makeSeedWaste(seedSupplies, now),
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through to fresh data */ }
  return fresh()
}

const StoreContext = createContext(null)
export const useStore = () => useContext(StoreContext)

export function StoreProvider({ children }) {
  const [data, setData] = useState(load)
  const { user } = useAuth()
  const who = user?.name || 'Unknown' // for the activity log

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* storage full or blocked */ }
  }, [data])

  // ---------- Sales ----------
  // Flowchart: process order → apply discount → record transaction → deduct stock → complete.
  const addSale = useCallback(({ lines, discountId }) => {
    if (!lines.length) return { ok: false, error: 'Add at least one item to the order.' }
    const items = []
    for (const l of lines) {
      const p = data.products.find((x) => x.id === l.productId)
      if (!p) return { ok: false, error: 'A product in this order no longer exists.' }
      if (!Number.isInteger(l.qty) || l.qty < 1) return { ok: false, error: `Invalid quantity for ${p.name}.` }
      if (l.qty > p.stock) return { ok: false, error: `Only ${p.stock} of ${p.name} left in stock.` }
      const disc = pickDiscount(data.discounts, p.id, discountId)
      items.push({
        productId: p.id, name: p.name, category: p.category, qty: l.qty, price: p.price,
        discountPct: disc.percent, discountName: disc.name,
      })
    }
    const maxN = data.transactions.reduce((m, t) => Math.max(m, parseInt(t.id.slice(2), 10) || 0), 0)
    const names = [...new Set(items.map((i) => i.discountName).filter(Boolean))]
    const transaction = {
      id: `T-${String(maxN + 1).padStart(5, '0')}`,
      createdAt: new Date().toISOString(),
      items,
      discountId: discountId || null,
      discountName: names.length ? names.join(', ') : null,
      discountPct: 0, // per-item discounts live on each item
      status: 'completed',
    }
    setData((d) => ({
      ...d,
      transactions: [...d.transactions, transaction],
      products: d.products.map((p) => {
        const l = lines.find((x) => x.productId === p.id)
        return l ? { ...p, stock: p.stock - l.qty } : p
      }),
    }))
    return { ok: true, transaction }
  }, [data])

  // Void instead of delete: keeps the record, drops it from every total, puts stock back.
  const voidSale = useCallback((id) => {
    setData((d) => {
      const t = d.transactions.find((x) => x.id === id)
      if (!t || t.status === 'voided') return d
      return {
        ...d,
        transactions: d.transactions.map((x) =>
          x.id === id ? { ...x, status: 'voided', voidedAt: new Date().toISOString() } : x),
        products: d.products.map((p) => {
          const i = t.items.find((x) => x.productId === p.id)
          return i ? { ...p, stock: p.stock + i.qty } : p
        }),
      }
    })
  }, [])

  // ---------- Products ----------
  // Flowchart: Action Choose? → Add / Edit / Delete → Save Changes.
  const addProduct = useCallback((fields) => {
    const error = validateProduct(fields, data.products)
    if (error) return { ok: false, error }
    setData((d) => ({ ...d, products: [...d.products, { id: `p${Date.now()}`, ...cleanProduct(fields) }] }))
    return { ok: true }
  }, [data.products])

  const updateProduct = useCallback((id, fields) => {
    const error = validateProduct(fields, data.products, id)
    if (error) return { ok: false, error }
    setData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...cleanProduct(fields) } : p)) }))
    return { ok: true }
  }, [data.products])

  // Past sales keep their own copy of name/price, so history is unaffected.
  const deleteProduct = useCallback((id) =>
    setData((d) => ({
      ...d,
      products: d.products.filter((p) => p.id !== id),
      discounts: d.discounts.filter((x) => x.productId !== id),
      dismissed: (d.dismissed ?? []).filter((x) => x !== id),
    })), [])

  // ---------- Inventory ----------
  // Flowchart: Input Stock. Adds a delivery to a supply item and records it for the flow chart.
  const receiveStock = useCallback(({ itemId, qty }) => {
    const s = data.supplies.find((x) => x.id === itemId)
    if (!s) return { ok: false, error: 'Choose an item.' }
    const n = Number(qty)
    if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Quantity must be greater than 0.' }
    setData((d) => ({
      ...d,
      supplies: d.supplies.map((x) => (x.id === itemId ? { ...x, stock: r3(x.stock + n) } : x)),
      movements: [...d.movements, { id: `m${Date.now()}`, at: new Date().toISOString(), itemId, type: 'in', qty: n }],
    }))
    return { ok: true }
  }, [data.supplies])

  const addSupply = useCallback((fields) => {
    const error = validateSupply(fields, data.supplies)
    if (error) return { ok: false, error }
    setData((d) => ({ ...d, supplies: [...d.supplies, { id: `s${Date.now()}`, ...cleanSupply(fields) }] }))
    return { ok: true }
  }, [data.supplies])

  // Stock itself changes through deliveries and waste, not by editing the item.
  const updateSupply = useCallback((id, fields) => {
    const error = validateSupply(fields, data.supplies, id)
    if (error) return { ok: false, error }
    const { stock, ...rest } = cleanSupply(fields)
    setData((d) => ({ ...d, supplies: d.supplies.map((s) => (s.id === id ? { ...s, ...rest } : s)) }))
    return { ok: true }
  }, [data.supplies])

  const logWaste = useCallback(({ itemId, qty, reason }) => {
    const s = data.supplies.find((x) => x.id === itemId)
    if (!s) return { ok: false, error: 'Choose an item.' }
    const n = Number(qty)
    if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Quantity must be greater than 0.' }
    if (n > s.stock + 1e-9) return { ok: false, error: `Only ${s.stock} ${s.unit} in stock.` }
    if (!reason) return { ok: false, error: 'Choose a reason.' }
    const entry = {
      id: `w${Date.now()}`, at: new Date().toISOString(), itemId, name: s.name, unit: s.unit,
      qty: n, reason, cost: Math.round(n * s.cost * 100) / 100,
    }
    setData((d) => ({
      ...d,
      waste: [...d.waste, entry],
      supplies: d.supplies.map((x) => (x.id === itemId ? { ...x, stock: r3(Math.max(0, x.stock - n)) } : x)),
    }))
    return { ok: true }
  }, [data.supplies])

  // For entries made by mistake: removes the entry and puts the stock back.
  const removeWaste = useCallback((id) => {
    setData((d) => {
      const w = d.waste.find((x) => x.id === id)
      if (!w) return d
      return {
        ...d,
        waste: d.waste.filter((x) => x.id !== id),
        supplies: d.supplies.map((s) => (s.id === w.itemId ? { ...s, stock: r3(s.stock + w.qty) } : s)),
      }
    })
  }, [])

  // ---------- Discounts ----------
  // Flowchart: Input Discount → Add Discount → Approved? → Save Discount.
  const addDiscount = useCallback(({ name, percent, productId = null, source = 'manual' }) => {
    const n = String(name || '').trim()
    const p = Number(percent)
    if (!n) return { ok: false, error: 'Give the discount a name.' }
    if (!Number.isFinite(p) || p < 1 || p > 90) return { ok: false, error: 'Percent must be between 1 and 90.' }
    setData((d) => ({
      ...d,
      discounts: [...d.discounts, { id: `d${Date.now()}`, name: n, percent: p, active: true, productId: productId || null, source }],
    }))
    log(who, 'discount', `${source === 'suggested' ? 'Approved' : 'Created'} discount “${n}”`)
    return { ok: true }
  }, [who])

  const setDiscountActive = useCallback((id, active) => {
    const name = data.discounts.find((x) => x.id === id)?.name
    setData((d) => ({ ...d, discounts: d.discounts.map((x) => (x.id === id ? { ...x, active } : x)) }))
    if (name) log(who, 'discount', `Turned ${active ? 'on' : 'off'} discount “${name}”`)
  }, [data.discounts, who])

  const dismissRec = useCallback((productId) =>
    setData((d) => ({ ...d, dismissed: [...(d.dismissed ?? []), productId] })), [])
  const restoreRecs = useCallback(() => setData((d) => ({ ...d, dismissed: [] })), [])

  const resetData = useCallback(() => setData(fresh()), [])

  return (
    <StoreContext.Provider value={{
      ...data, dismissed: data.dismissed ?? [],
      addSale, voidSale, addProduct, updateProduct, deleteProduct,
      receiveStock, addSupply, updateSupply, logWaste, removeWaste,
      addDiscount, setDiscountActive, dismissRec, restoreRecs, resetData,
    }}>
      {children}
    </StoreContext.Provider>
  )
}
