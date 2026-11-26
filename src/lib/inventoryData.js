// Placeholder seed data — swap for your store/API. Shapes are what the pages expect.
// Optional fields: perDay + unitRev (usage and revenue per unit, for stockout alerts), shelfDays (for overstock alerts).
export const SUPPLIES = [
  { id: 'SUP-001', name: 'Espresso Beans — House Blend (1kg)', min: 10, stock: 18, max: 40, cost: 24 },
  { id: 'SUP-009', name: 'Whole Milk (1L cartons)', min: 12, stock: 6, max: 48, cost: 1.4 },
  { id: 'SUP-014', name: 'Oat Milk (1L cartons)', min: 10, stock: 67, max: 36, cost: 2.1, shelfDays: 4 },
  { id: 'SUP-003', name: 'Croissants — Butter', min: 12, stock: 0, max: 30, cost: 1.1, perDay: 27, unitRev: 3.5 },
  { id: 'SUP-006', name: 'Paper Cups 12oz (sleeve of 50)', min: 5, stock: 4, max: 20, cost: 6.5 },
  { id: 'SUP-011', name: 'Vanilla Syrup (750ml)', min: 4, stock: 14, max: 16, cost: 8.9 },
  { id: 'SUP-021', name: 'Chai Concentrate (1L)', min: 6, stock: 38, max: 20, cost: 5.2, shelfDays: 6 },
]

export const FLOW = [
  { day: 'Mon', inbound: 42, outbound: 38 },
  { day: 'Tue', inbound: 28, outbound: 41 },
  { day: 'Wed', inbound: 55, outbound: 36 },
  { day: 'Thu', inbound: 20, outbound: 49 },
  { day: 'Fri', inbound: 60, outbound: 44 },
  { day: 'Sat', inbound: 14, outbound: 68 },
  { day: 'Sun', inbound: 10, outbound: 52 },
]

export const WASTE = [
  { id: 'W-210', date: 'May 7', item: 'Butter Croissants', qty: 6, reason: 'Unsold at close', cost: 6.6 },
  { id: 'W-209', date: 'May 7', item: 'Whole Milk (1L cartons)', qty: 2, reason: 'Expired', cost: 2.8 },
  { id: 'W-208', date: 'May 6', item: 'Oat Milk (1L cartons)', qty: 3, reason: 'Spoiled', cost: 6.3 },
  { id: 'W-207', date: 'May 6', item: 'Vanilla Syrup (750ml)', qty: 1, reason: 'Spilled', cost: 8.9 },
  { id: 'W-206', date: 'May 5', item: 'Espresso Beans — House Blend (1kg)', qty: 1, reason: 'Stale', cost: 24 },
  { id: 'W-205', date: 'May 5', item: 'Butter Croissants', qty: 9, reason: 'Unsold at close', cost: 9.9 },
]

export const statusOf = (s) =>
  s.stock === 0 ? 'out' : s.stock < s.min ? 'low' : s.stock > s.max ? 'overstock' : 'ok'

export const STATUS_LABEL = { ok: 'OK', low: 'LOW', overstock: 'OVERSTOCK', out: 'OUT' }

// Reorder suggestion: how many units bring stock back up to par max.
export const reorderQty = (s) => Math.max(0, s.max - s.stock)

const RANK = { critical: 0, high: 1, medium: 2 }

// Flowchart: "Stock low / out of stock?" → "Generate reorder alert". Alerts are derived, so they
// update as soon as stock is received.
export function buildAlerts(supplies) {
  const alerts = []
  for (const s of supplies) {
    const st = statusOf(s)
    if (st === 'out' || st === 'low') {
      const loss = st === 'out' && s.perDay && s.unitRev
        ? ` — avg ${s.perDay} sold/day, losing ~$${Math.floor(s.perDay * s.unitRev)} revenue daily`
        : ''
      alerts.push({
        id: s.id, name: s.name, kind: 'out',
        level: st === 'out' || s.stock < s.min / 2 ? 'critical' : 'high',
        detail: `Stock: ${s.stock} / Par min: ${s.min}${loss}`,
        reorder: reorderQty(s),
      })
    } else if (st === 'overstock') {
      const pct = Math.round(((s.stock - s.max) / s.max) * 100)
      alerts.push({
        id: s.id, name: s.name, kind: 'over',
        level: pct >= 80 ? 'high' : 'medium',
        detail: `Stock: ${s.stock} / Par max: ${s.max} — ${pct}% over par${s.shelfDays ? `, shelf life ${s.shelfDays} days` : ''}`,
      })
    }
  }
  return alerts.sort((a, b) => RANK[a.level] - RANK[b.level])
}
