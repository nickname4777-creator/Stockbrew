import { dayIdx } from './analytics.js'
import { LOW_STOCK } from './products.js'

export const ELASTICITY = 2.5   // assumed: a 10% discount lifts units ~25%. Replace with a measured value later.
export const TARGET_DEPTH = 12   // target average discount depth (%)

export const marginLabel = (m) => (m >= 0.6 ? 'Strong' : m >= 0.45 ? 'Good' : m >= 0.3 ? 'Fair' : 'Thin')

// Picks the better of: a discount on this product, or the order-level one chosen at checkout. No stacking.
export function pickDiscount(discounts, productId, orderDiscountId) {
  const active = discounts.filter((d) => d.active)
  const product = active.filter((d) => d.productId === productId).sort((a, b) => b.percent - a.percent)[0]
  const order = active.find((d) => d.id === orderDiscountId && !d.productId)
  const best = [product, order].filter(Boolean).sort((a, b) => b.percent - a.percent)[0]
  return best ? { id: best.id, name: best.name, percent: best.percent } : { id: null, name: null, percent: 0 }
}

// Rule-based suggestions from stock level and last-7-day sales speed.
export function buildRecommendations(products, txs, today) {
  const sold = {}
  for (const t of txs) {
    if (t.status === 'voided') continue
    const idx = dayIdx(t.createdAt, today)
    if (idx < 0 || idx >= 7) continue
    for (const i of t.items) sold[i.productId] = (sold[i.productId] || 0) + i.qty
  }
  return products.map((p) => {
    const units = sold[p.id] || 0
    const cover = units > 0 ? p.stock / (units / 7) : Infinity // days of stock left
    let percent = 0, reason = null
    if (p.stock === 0) reason = 'Out of stock — hold price until restocked'
    else if (p.stock <= LOW_STOCK) reason = 'Low stock — hold price until restocked'
    else if (units === 0) { percent = 15; reason = 'No sales in the last 7 days' }
    else if (cover > 45) { percent = 20; reason = `Overstocked: about ${Math.round(cover)} days of stock` }
    else if (cover > 30) { percent = 15; reason = `Overstocked: about ${Math.round(cover)} days of stock` }
    else if (cover > 21) { percent = 10; reason = `Slow mover: about ${Math.round(cover)} days of stock` }
    if (!reason) return null
    const lift = Math.round(percent * ELASTICITY)
    const newPrice = p.price * (1 - percent / 100)
    const margin = (newPrice - p.cost) / newPrice
    return {
      productId: p.id, name: p.name, price: p.price, percent, lift, margin,
      marginLabel: marginLabel(margin), reason,
      weeklyGain: units * (1 + lift / 100) * newPrice - units * p.price,
    }
  }).filter(Boolean).sort((a, b) => b.percent - a.percent)
}

// "With" = what we actually took. "Without" = estimate of revenue had there been no discounts
// (discounted lines would have sold fewer units, at full price).
export function discountImpact(txs, today, months = 4) {
  const buckets = Array.from({ length: months }, (_, i) => {
    const back = months - 1 - i
    const label = new Date(today.getFullYear(), today.getMonth() - back, 1)
      .toLocaleDateString('en-US', { month: 'short' })
    return { month: label, with: 0, without: 0 }
  })
  const last = { promos: 0, grossDiscounted: 0, discountAmt: 0, incremental: 0 }

  for (const t of txs) {
    if (t.status === 'voided') continue
    const d = new Date(t.createdAt)
    const back = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth())
    const inMonths = back >= 0 && back < months
    const in30 = dayIdx(d, today) >= 0 && dayIdx(d, today) < 30
    let any = false
    for (const i of t.items) {
      const pct = (i.discountPct ?? t.discountPct ?? 0) / 100
      const gross = i.qty * i.price
      const withD = gross * (1 - pct)
      const withoutD = pct > 0 ? gross / (1 + ELASTICITY * pct) : gross
      if (inMonths) { buckets[months - 1 - back].with += withD; buckets[months - 1 - back].without += withoutD }
      if (in30 && pct > 0) {
        any = true
        last.grossDiscounted += gross
        last.discountAmt += gross * pct
        last.incremental += withD - withoutD
      }
    }
    if (in30 && any) last.promos += 1
  }
  return {
    buckets,
    promos: last.promos,
    depth: last.grossDiscounted ? (last.discountAmt / last.grossDiscounted) * 100 : null,
    incremental: last.incremental,
  }
}
