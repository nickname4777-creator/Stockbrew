// Pure helpers for the Sales report and Data set pages. Transactions in, numbers / rows out.
import { dayIdx, startOfDay, txNet, txSubtotal, txUnits, lineNet } from './analytics'

export const RANGES = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
]

const live = (txs) => txs.filter((t) => t.status !== 'voided')

// Number of days a range covers (for "all": back to the oldest sale, at most 120 days).
export function rangeDays(txs, key, today) {
  const r = RANGES.find((x) => x.key === key)
  if (r.days) return r.days
  const oldest = live(txs).reduce((m, t) => Math.max(m, dayIdx(t.createdAt, today)), 0)
  return Math.min(120, oldest + 1)
}

// Totals for `days` days ending `offset` days ago (offset 0 = ending today).
export function totalsFor(txs, today, days, offset = 0) {
  const out = { revenue: 0, orders: 0, units: 0, discount: 0 }
  for (const t of live(txs)) {
    const i = dayIdx(t.createdAt, today) - offset
    if (i < 0 || i >= days) continue
    out.revenue += txNet(t); out.orders += 1; out.units += txUnits(t); out.discount += txSubtotal(t) - txNet(t)
  }
  return out
}

// Everything the report shows. Voided sales are excluded.
export function salesReport(txs, today, days) {
  const base = startOfDay(today)
  const perDay = Array.from({ length: days }, (_, k) => {
    const date = new Date(base); date.setDate(date.getDate() - (days - 1 - k))
    return { date, orders: 0, units: 0, revenue: 0, discount: 0 }
  })
  const top = new Map()
  for (const t of live(txs)) {
    const idx = dayIdx(t.createdAt, today)
    if (idx < 0 || idx >= days) continue
    const d = perDay[days - 1 - idx]
    d.orders += 1; d.units += txUnits(t); d.revenue += txNet(t); d.discount += txSubtotal(t) - txNet(t)
    for (const i of t.items) {
      const row = top.get(i.productId) || { name: i.name, category: i.category, units: 0, revenue: 0 }
      row.units += i.qty; row.revenue += lineNet(i, t.discountPct)
      top.set(i.productId, row)
    }
  }
  const products = [...top.values()].sort((a, b) => b.revenue - a.revenue)
  const totals = perDay.reduce((s, d) => ({
    revenue: s.revenue + d.revenue, orders: s.orders + d.orders, units: s.units + d.units, discount: s.discount + d.discount,
  }), { revenue: 0, orders: 0, units: 0, discount: 0 })
  return { perDay: perDay.reverse(), products, totals } // newest day first
}

export function toCsv(columns, rows) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [columns.map(q).join(','), ...rows.map((r) => r.map(q).join(','))].join('\n')
}

export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}
