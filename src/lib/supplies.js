import { useCallback, useState } from 'react'
import { SUPPLIES } from './inventoryData'

// Same approach as StoreContext: persist to localStorage. When the backend arrives,
// replace load/save and receiveStock with API calls (or move this into StoreContext).
const KEY = 'stockbrew:supplies:v1'
const fresh = () => ({ supplies: SUPPLIES, receipts: [] })

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* fall through to fresh data */ }
  return fresh()
}
const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* blocked */ } }

export function useSupplies() {
  const [data, setData] = useState(load)

  // Flowchart: Input Stock → update stock levels → continue monitoring.
  const receiveStock = useCallback((supplyId, rawQty) => {
    const qty = Number(rawQty)
    const s = data.supplies.find((x) => x.id === supplyId)
    if (!s) return { ok: false, error: 'Choose a supply item.' }
    if (!Number.isInteger(qty) || qty < 1) return { ok: false, error: 'Enter a whole quantity of 1 or more.' }
    const next = {
      supplies: data.supplies.map((x) => (x.id === supplyId ? { ...x, stock: x.stock + qty } : x)),
      receipts: [...data.receipts, {
        id: `R-${String(data.receipts.length + 1).padStart(4, '0')}`,
        supplyId, qty, at: new Date().toISOString(),
      }],
    }
    save(next)
    setData(next)
    return { ok: true, supply: { ...s, stock: s.stock + qty }, qty }
  }, [data])

  return { ...data, receiveStock }
}
