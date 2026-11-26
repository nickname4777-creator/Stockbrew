import { startOfDay } from '../lib/analytics.js'

// How many days of fake sales history to generate on first load.
// 7 = one simulated week. Use 98 (14 weeks) if you want Forecast and Accuracy to have data too.
export const SEED_DAYS = 7

export const seedProducts = [
  { id: 'p1', sku: 'CAF-001', name: 'Espresso', category: 'Hot Drinks', price: 3.5, cost: 0.9, stock: 90, rating: 4.9, pop: 5 },
  { id: 'p2', sku: 'CAF-002', name: 'Flat White', category: 'Hot Drinks', price: 4.8, cost: 1.5, stock: 70, rating: 4.8, pop: 4 },
  { id: 'p3', sku: 'CAF-003', name: 'Oat Milk Latte', category: 'Hot Drinks', price: 5.5, cost: 1.9, stock: 60, rating: 4.7, pop: 3 },
  { id: 'p4', sku: 'CAF-004', name: 'Chai Latte', category: 'Hot Drinks', price: 5.5, cost: 1.7, stock: 55, rating: 4.5, pop: 2 },
  { id: 'p5', sku: 'CAF-005', name: 'Iced Americano', category: 'Cold Drinks', price: 4.2, cost: 1.0, stock: 80, rating: 4.6, pop: 3 },
  { id: 'p6', sku: 'CAF-006', name: 'Cold Brew', category: 'Cold Drinks', price: 5.8, cost: 1.8, stock: 24, rating: 4.8, pop: 2 },
  { id: 'p7', sku: 'CAF-007', name: 'Matcha Latte', category: 'Cold Drinks', price: 5.8, cost: 2.0, stock: 18, rating: 4.7, pop: 2 },
  { id: 'p8', sku: 'CAF-008', name: 'Butter Croissant', category: 'Pastries', price: 3.5, cost: 1.2, stock: 0, rating: 4.8, pop: 3 },
  { id: 'p9', sku: 'CAF-009', name: 'Almond Danish', category: 'Pastries', price: 4.2, cost: 1.5, stock: 8, rating: 4.6, pop: 2 },
  { id: 'p10', sku: 'CAF-010', name: 'Banana Bread Slice', category: 'Pastries', price: 3.8, cost: 1.3, stock: 12, rating: 4.5, pop: 2 },
  { id: 'p11', sku: 'CAF-011', name: 'Chicken Pesto Sandwich', category: 'Sandwiches', price: 8.5, cost: 3.6, stock: 6, rating: 4.4, pop: 2 },
  { id: 'p12', sku: 'CAF-012', name: 'Turkey Club Sandwich', category: 'Sandwiches', price: 8.9, cost: 3.9, stock: 30, rating: 4.5, pop: 1 },
  { id: 'p13', sku: 'CAF-013', name: 'Retail Beans 250g', category: 'Retail', price: 16, cost: 8.0, stock: 40, rating: 4.6, pop: 1 },
  { id: 'p14', sku: 'CAF-014', name: 'Ceramic Mug', category: 'Retail', price: 12, cost: 5.0, stock: 25, rating: 4.3, pop: 1 },
]

// Ingredients & supplies. `stock` is what's on the shelf right now; min/max are par levels.
export const seedSupplies = [
  { id: 's1', sku: 'SUP-001', name: 'Espresso Beans — House Blend (1kg)', category: 'Coffee & Tea', unit: 'bags', stock: 18, min: 10, max: 40, cost: 18 },
  { id: 's2', sku: 'SUP-009', name: 'Whole Milk (1L cartons)', category: 'Dairy', unit: 'cartons', stock: 6, min: 12, max: 48, cost: 3.1 },
  { id: 's3', sku: 'SUP-014', name: 'Oat Milk (1L cartons)', category: 'Dairy', unit: 'cartons', stock: 67, min: 10, max: 36, cost: 3.7 },
  { id: 's4', sku: 'SUP-003', name: 'Croissants — Butter', category: 'Bakery', unit: 'units', stock: 0, min: 12, max: 30, cost: 1.4 },
  { id: 's5', sku: 'SUP-015', name: 'Paper Cups 12oz (sleeve of 50)', category: 'Packaging', unit: 'sleeves', stock: 4, min: 5, max: 20, cost: 4 },
  { id: 's6', sku: 'SUP-011', name: 'Vanilla Syrup (750ml)', category: 'Syrups & Sauces', unit: 'bottles', stock: 14, min: 4, max: 16, cost: 9.8 },
  { id: 's7', sku: 'SUP-021', name: 'Chai Concentrate (1L)', category: 'Syrups & Sauces', unit: 'cartons', stock: 38, min: 6, max: 20, cost: 7.3 },
  { id: 's8', sku: 'SUP-004', name: 'Almond Danish', category: 'Bakery', unit: 'units', stock: 8, min: 6, max: 30, cost: 1.5 },
  { id: 's9', sku: 'SUP-005', name: 'Banana Bread Slices', category: 'Bakery', unit: 'slices', stock: 12, min: 10, max: 30, cost: 1.3 },
  { id: 's10', sku: 'SUP-006', name: 'Chicken Pesto Sandwich', category: 'Bakery', unit: 'units', stock: 6, min: 8, max: 24, cost: 3.6 },
  { id: 's11', sku: 'SUP-007', name: 'Turkey Club Sandwich', category: 'Bakery', unit: 'units', stock: 22, min: 8, max: 24, cost: 3.9 },
  { id: 's12', sku: 'SUP-030', name: 'Matcha Powder (500g tin)', category: 'Coffee & Tea', unit: 'tins', stock: 5, min: 3, max: 12, cost: 22 },
  { id: 's13', sku: 'SUP-031', name: 'Retail Beans 250g', category: 'Retail', unit: 'bags', stock: 28, min: 10, max: 30, cost: 8 },
  { id: 's14', sku: 'SUP-032', name: 'Ceramic Mug', category: 'Retail', unit: 'units', stock: 18, min: 6, max: 20, cost: 5 },
]

// Discounts belong to the Discounts module later; Sales only reads the active ones.
export const seedDiscounts = [
  { id: 'd1', name: 'Happy Hour', percent: 10, active: true, productId: null },
  { id: 'd2', name: 'Loyalty', percent: 15, active: true, productId: null },
  { id: 'd3', name: 'Holiday Promo', percent: 20, active: false, productId: null },
]

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic fake history (same numbers every time) ending today.
export function makeSeedTransactions(products, discounts, today = new Date(), days = SEED_DAYS) {
  const r = rng(42)
  const active = discounts.filter((d) => d.active)
  const total = products.reduce((s, p) => s + p.pop, 0)
  const pick = (exclude) => {
    for (;;) {
      let x = r() * total
      for (const p of products) { x -= p.pop; if (x <= 0) { if (!exclude.includes(p.id)) return p; break } }
    }
  }
  const txs = []
  let n = 1
  for (let d = days - 1; d >= 0; d--) {
    const day = startOfDay(today)
    day.setDate(day.getDate() - d)
    const weekend = [0, 6].includes(day.getDay()) ? 1.3 : 1
    // Shop hours 7:00–19:00. Today only runs up to the current time, so it never has "future" sales.
    const nowM = today.getHours() * 60 + today.getMinutes()
    const maxM = d === 0 ? Math.max(2, Math.min(1140, nowM)) : 1140
    const minM = d === 0 ? Math.min(420, Math.floor(maxM / 2)) : 420
    const share = (maxM - minM) / 720
    const count = Math.max(1, Math.round((10 + r() * 4) * weekend * (1 + (days - d) * 0.004) * share))
    const mins = Array.from({ length: count }, () => minM + Math.floor(r() * (maxM - minM))).sort((a, b) => a - b)
    for (const m of mins) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(m / 60), m % 60)
      if (at > today) continue
      const items = []
      const k = 1 + Math.floor(r() * 3)
      for (let i = 0; i < k; i++) {
        const p = pick(items.map((x) => x.productId))
        items.push({ productId: p.id, name: p.name, category: p.category, qty: r() < 0.25 ? 2 : 1, price: p.price })
      }
      const disc = r() < 0.15 && active.length ? active[Math.floor(r() * active.length)] : null
      txs.push({
        id: `T-${String(n++).padStart(5, '0')}`,
        createdAt: at.toISOString(),
        items,
        discountId: disc?.id ?? null,
        discountName: disc?.name ?? null,
        discountPct: disc?.percent ?? 0,
        status: 'completed',
        seeded: true,
      })
    }
  }
  return txs
}

const at = (today, daysBack, h, m) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysBack, h, m)
  return d > today ? today : d
}

// Two weeks of stock movements: deliveries (in) and stock used in service (out).
export function makeSeedMovements(supplies, today = new Date(), days = 14) {
  const r = rng(7)
  const out = []
  let n = 1
  for (let d = days - 1; d >= 0; d--) {
    for (const type of ['in', 'out']) {
      const count = 1 + Math.floor(r() * 3)
      for (let k = 0; k < count; k++) {
        const s = supplies[Math.floor(r() * supplies.length)]
        const qty = Math.max(1, Math.round((s.max - s.min) * (0.08 + r() * 0.2)))
        out.push({ id: `m${n++}`, at: at(today, d, 6 + Math.floor(r() * 12), Math.floor(r() * 60)).toISOString(), itemId: s.id, type, qty })
      }
    }
  }
  return out
}

// A few hand-picked waste entries (days back, hour, minute, supply, qty, reason).
export function makeSeedWaste(supplies, today = new Date()) {
  const specs = [
    [0, 7, 12, 's4', 6, 'Expired'], [0, 6, 45, 's2', 2, 'Spoilage'],
    [1, 16, 20, 's3', 3, 'Overstock Expiry'], [1, 9, 5, 's6', 1, 'Damaged'],
    [2, 14, 30, 's5', 1, 'Prep Waste'], [2, 8, 10, 's7', 2, 'Spoilage'],
    [4, 7, 40, 's8', 3, 'Expired'], [5, 11, 15, 's2', 1, 'Spoilage'],
    [9, 7, 30, 's4', 5, 'Expired'], [10, 10, 0, 's3', 2, 'Spoilage'], [12, 15, 45, 's7', 1, 'Spoilage'],
  ]
  return specs.map(([d, h, m, id, qty, reason], i) => {
    const s = supplies.find((x) => x.id === id)
    return { id: `w${i + 1}`, at: at(today, d, h, m).toISOString(), itemId: id, name: s.name, unit: s.unit,
             qty, reason, cost: Math.round(qty * s.cost * 100) / 100 }
  }).sort((a, b) => a.at.localeCompare(b.at))
}
