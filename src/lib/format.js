export const money = (v) =>
  `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const moneyShort = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`)
export const axisMoney = (v) => (v >= 1000 ? `$${+(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`)
export const shortDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
export const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const dateTimeOf = (iso) => `${shortDate(new Date(iso))}, ${timeOf(iso)}`

// "↑ +12.3% vs last week"; returns a fallback when there is nothing to compare to.
export function delta(cur, prev, suffix) {
  if (!prev) return `No data ${suffix.replace('vs ', '')}`
  const pct = ((cur - prev) / prev) * 100
  return `${pct >= 0 ? '↑ +' : '↓ '}${pct.toFixed(1)}% ${suffix}`
}
