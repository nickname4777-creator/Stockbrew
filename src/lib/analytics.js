// Pure functions: transactions in, numbers out. No React, no storage.
const DAY = 86400000

export const startOfDay = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
// 0 = today, 1 = yesterday, ...
export const dayIdx = (date, today) =>
  Math.round((startOfDay(today) - startOfDay(date)) / DAY)

// New sales store a discount on each item; older seeded sales only have the order-level one.
export const lineNet = (item, pct) => item.qty * item.price * (1 - ((item.discountPct ?? pct) || 0) / 100)
export const txSubtotal = (t) => t.items.reduce((s, i) => s + i.qty * i.price, 0)
export const txNet = (t) => t.items.reduce((s, i) => s + lineNet(i, t.discountPct), 0)
export const txUnits = (t) => t.items.reduce((s, i) => s + i.qty, 0)

// Per-day totals for `days` days ending today (shifted back by offsetDays). Oldest first.
export function dailySeries(txs, days, today, offsetDays = 0) {
  const base = startOfDay(today)
  const out = Array.from({ length: days }, (_, i) => {
    const date = new Date(base)
    date.setDate(date.getDate() - (days - 1 - i + offsetDays))
    return { date, revenue: 0, units: 0, orders: 0 }
  })
  for (const t of txs) {
    if (t.status === 'voided') continue
    const idx = dayIdx(t.createdAt, today) - offsetDays
    if (idx < 0 || idx >= days) continue
    const b = out[days - 1 - idx]
    b.revenue += txNet(t)
    b.units += txUnits(t)
    b.orders += 1
  }
  return out
}

// Weekly revenue (7-day windows ending today). Oldest first.
export function weeklySeries(txs, weeks, today, { category = null, endWeeksAgo = 0 } = {}) {
  const out = Array(weeks).fill(0)
  for (const t of txs) {
    if (t.status === 'voided') continue
    const wk = Math.floor(dayIdx(t.createdAt, today) / 7) - endWeeksAgo
    if (wk < 0 || wk >= weeks) continue
    let v = 0
    for (const i of t.items) {
      if (category && i.category !== category) continue
      v += lineNet(i, t.discountPct)
    }
    out[weeks - 1 - wk] += v
  }
  return out
}

// ---------- Forecasting (simple linear trend; swap for a real model later) ----------
export function linearFit(ys) {
  const n = ys.length
  if (n < 2) return { slope: 0, intercept: ys[0] || 0 }
  const mx = (n - 1) / 2
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  ys.forEach((y, x) => { num += (x - mx) * (y - my); den += (x - mx) ** 2 })
  const slope = den ? num / den : 0
  return { slope, intercept: my - slope * mx }
}
export const fittedValues = (ys) => {
  const { slope, intercept } = linearFit(ys)
  return ys.map((_, x) => Math.max(0, intercept + slope * x))
}
export const projectNext = (ys, steps) => {
  const { slope, intercept } = linearFit(ys)
  return Array.from({ length: steps }, (_, i) => Math.max(0, intercept + slope * (ys.length + i)))
}
export function mape(actual, pred) {
  const errs = []
  actual.forEach((a, i) => { if (a > 0) errs.push(Math.abs(a - pred[i]) / a) })
  return errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : null
}

export function runForecast(txs, { history, horizon }, today) {
  const weekly = weeklySeries(txs, history, today)
  if (weekly.filter((v) => v > 0).length < 3) {
    return { error: 'Not enough sales history. A forecast needs at least 3 weeks with sales.' }
  }
  const fit = fittedValues(weekly)
  const proj = projectNext(weekly, horizon)
  const err = mape(weekly, fit)
  const confidence = Math.round(Math.max(0, 100 - (err ?? 1) * 100))
  const rows = [
    ...weekly.map((a, i) => ({ wk: `Wk ${i + 1}`, actual: a, predicted: fit[i] })),
    ...proj.map((p, i) => ({ wk: `Wk ${history + i + 1}`, actual: null, predicted: p })),
  ]
  const last = weekly[weekly.length - 1]
  return { rows, next: proj[0], lastActual: last, confidence }
}

// ---------- Accuracy (backtest: forecast each recent week from the 4 weeks before it) ----------
function backtest(weekly, train = 4, tests = 4) {
  if (weekly.length < train + tests) return null
  // Need real history, otherwise empty weeks look like "0% accuracy".
  if (weekly.filter((v) => v > 0).length < 6) return null
  const errs = []
  for (let t = weekly.length - tests; t < weekly.length; t++) {
    const p = projectNext(weekly.slice(t - train, t), 1)[0]
    if (weekly[t] > 0) errs.push(Math.abs(weekly[t] - p) / weekly[t])
  }
  return errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : null
}
const toAcc = (m) => (m == null ? null : Math.max(0, 100 - m * 100))

export function accuracyByCategory(txs, categories, today) {
  const rows = categories.map((name) => {
    const now = backtest(weeklySeries(txs, 8, today, { category: name }))
    const before = backtest(weeklySeries(txs, 8, today, { category: name, endWeeksAgo: 4 }))
    return { name, mape: now, accuracy: toAcc(now), prevAccuracy: toAcc(before) }
  })
  const ok = rows.filter((r) => r.accuracy != null)
  const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length
  const prev = rows.filter((r) => r.prevAccuracy != null)
  return {
    rows,
    mape: ok.length ? avg(ok.map((r) => r.mape)) * 100 : null,
    accuracy: ok.length ? avg(ok.map((r) => r.accuracy)) : null,
    deltaPts: ok.length && prev.length ? avg(ok.map((r) => r.accuracy)) - avg(prev.map((r) => r.prevAccuracy)) : null,
  }
}
