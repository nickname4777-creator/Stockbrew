import { dayIdx, startOfDay } from './analytics.js'

export const SUPPLY_CATEGORIES = ['Coffee & Tea', 'Dairy', 'Bakery', 'Packaging', 'Syrups & Sauces', 'Retail']
export const WASTE_REASONS = ['Expired', 'Spoilage', 'Overstock Expiry', 'Damaged', 'Prep Waste']

export const r3 = (n) => Math.round(n * 1000) / 1000
export const fmtQty = (n) => String(+Number(n).toFixed(2))
export const unitLabel = (qty, unit) => `${fmtQty(qty)} ${qty === 1 ? unit.replace(/s$/, '') : unit}`

// Flowchart: Check Current Stock Levels → Stock Low / Out?
export function levelOf(s) {
  if (s.stock <= 0) return { key: 'out', label: 'OUT' }
  if (s.stock <= s.min) return { key: 'low', label: 'LOW' }
  if (s.stock > s.max) return { key: 'over', label: 'OVERSTOCK' }
  return { key: 'ok', label: 'OK' }
}

// Flowchart: Generate Reorder Alert. Rebuilt from live stock every time, so "continue monitoring" is automatic.
const ORDER = { critical: 0, high: 1, medium: 2 }
export function buildAlerts(supplies) {
  const alerts = []
  for (const s of supplies) {
    const lvl = levelOf(s).key
    if (lvl === 'over') {
      const pct = Math.round((s.stock / s.max - 1) * 100)
      alerts.push({ id: s.id, sku: s.sku, name: s.name, kind: 'over', severity: pct >= 80 ? 'high' : 'medium',
        text: `📦 Stock: ${fmtQty(s.stock)} / Par max: ${fmtQty(s.max)} — ${pct}% over par` })
    } else if (lvl === 'low' || lvl === 'out') {
      alerts.push({ id: s.id, sku: s.sku, name: s.name, kind: 'stockout', severity: lvl === 'out' ? 'critical' : 'high',
        text: `⚠ Stock: ${fmtQty(s.stock)} / Par min: ${fmtQty(s.min)} — reorder ${Math.ceil(s.max - s.stock)} ${s.unit}` })
    }
  }
  return alerts.sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
}

const within = (list, today, days) => list.filter((x) => { const i = dayIdx(x.at, today); return i >= 0 && i < days })

// Inbound (deliveries) and outbound (used in service) per day, oldest first.
export function flowByDay(movements, today, days) {
  const base = startOfDay(today)
  const out = Array.from({ length: days }, (_, i) => {
    const date = new Date(base)
    date.setDate(date.getDate() - (days - 1 - i))
    return { date, in: 0, out: 0 }
  })
  for (const m of within(movements, today, days)) {
    if (m.type === 'in' || m.type === 'out') out[days - 1 - dayIdx(m.at, today)][m.type] += m.qty
  }
  return out
}

// Stock value now, and a week ago (today's stock with the last 7 days of movement undone).
export function stockValues(supplies, movements, waste, today) {
  const net = {}
  for (const m of within(movements, today, 7)) net[m.itemId] = (net[m.itemId] || 0) + (m.type === 'out' ? -m.qty : m.qty)
  for (const w of within(waste, today, 7)) net[w.itemId] = (net[w.itemId] || 0) - w.qty
  let now = 0, then = 0
  for (const s of supplies) {
    now += s.stock * s.cost
    then += Math.max(0, s.stock - (net[s.id] || 0)) * s.cost
  }
  return { now, then }
}

// ---------- Supply form rules ----------
export function cleanSupply(f) {
  return {
    sku: String(f.sku).trim().toUpperCase(), name: String(f.name).trim(), category: f.category,
    unit: String(f.unit).trim(), stock: Number(f.stock), min: Number(f.min), max: Number(f.max), cost: Number(f.cost),
  }
}

export function validateSupply(f, supplies, editingId = null) {
  const s = cleanSupply(f)
  if (!s.name) return 'Give the item a name.'
  if (!s.sku) return 'SKU is required.'
  if (supplies.some((x) => x.id !== editingId && x.sku.toLowerCase() === s.sku.toLowerCase()))
    return `SKU ${s.sku} is already used by another item.`
  if (!s.unit) return 'Enter a unit (for example cartons, bags, units).'
  if (!Number.isFinite(s.stock) || s.stock < 0) return 'Stock must be 0 or more.'
  if (!Number.isFinite(s.min) || s.min < 0) return 'Min must be 0 or more.'
  if (!Number.isFinite(s.max) || s.max <= s.min) return 'Max must be greater than min.'
  if (!Number.isFinite(s.cost) || s.cost < 0) return 'Cost must be 0 or more.'
  return null
}

export function nextSupplySku(supplies) {
  const n = supplies.reduce((m, s) => Math.max(m, parseInt(String(s.sku).replace(/\D/g, ''), 10) || 0), 0)
  return `SUP-${String(n + 1).padStart(3, '0')}`
}
