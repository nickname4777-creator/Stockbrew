import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Hexagon, Star, List, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../store/AuthContext'
import { PAGES } from '../lib/roles'
import { dailySeries } from '../lib/analytics'
import { buildAlerts, levelOf } from '../lib/inventory'
import { buildRecommendations } from '../lib/discounts'
import { LOW_STOCK } from '../lib/products'
import { money, axisMoney } from '../lib/format'

const tick = { fill: '#6F6A61', fontSize: 11 }
const ICONS = { sales: BarChart3, inventory: Hexagon, discounts: Star, products: List }
const SUBS = { sales: 'Orders, sales', inventory: 'Stock, alerts', discounts: 'Promos, pricing', products: 'Catalog, details' }

// Flowchart: Dashboard → Select module. One card per module the person's role can open.
export default function Dashboard() {
  const { transactions, products, supplies, discounts, dismissed } = useStore()
  const { user, can, canOpen } = useAuth()
  const showRevenue = can('dashboard.revenue')

  const m = useMemo(() => {
    const now = new Date()
    const week = dailySeries(transactions, 7, now)
    const alerts = buildAlerts(supplies)
    const pending = buildRecommendations(products, transactions, now).filter(
      (r) => r.percent > 0 && !dismissed.includes(r.productId) && !discounts.some((d) => d.active && d.productId === r.productId)
    ).length
    return { week, today: week[6], alerts, pending }
  }, [transactions, products, supplies, discounts, dismissed])

  const metrics = {
    sales: [
      ['Orders today', m.today.orders],
      showRevenue ? ['Revenue today', money(m.today.revenue)] : ['Units today', m.today.units],
    ],
    inventory: [
      ['Low or out', supplies.filter((s) => ['low', 'out'].includes(levelOf(s).key)).length],
      ['Overstocked', supplies.filter((s) => levelOf(s).key === 'over').length],
    ],
    discounts: [['Active', discounts.filter((d) => d.active).length], ['Awaiting approval', m.pending]],
    products: [['In catalog', products.length], ['Low stock', products.filter((p) => p.stock <= LOW_STOCK).length]],
  }

  const chart = m.week.map((d) => ({ day: d.date.toLocaleDateString('en-US', { weekday: 'short' }), revenue: Math.round(d.revenue) }))
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <Layout title="Dashboard" subtitle={`${greet}, ${user.name.split(' ')[0]}. Here is where things stand today.`}>
      <section className="modules">
        {Object.keys(ICONS).filter(canOpen).map((page) => {
          const Icon = ICONS[page]
          return (
            <Link key={page} to={PAGES[page].to} className="module">
              <div className="module__head">
                <span className="module__icon"><Icon size={18} strokeWidth={1.5} /></span>
                <ArrowRight size={16} className="module__go" />
              </div>
              <div className="module__name">{PAGES[page].label}</div>
              <div className="module__sub">{SUBS[page]}</div>
              <div className="module__metrics">
                {metrics[page].map(([label, value]) => (
                  <div key={label}><div className="module__value">{value}</div><div className="module__label">{label}</div></div>
                ))}
              </div>
            </Link>
          )
        })}
      </section>

      <div className={showRevenue ? 'split' : ''}>
        {showRevenue && (
          <section className="card">
            <h2 className="card__title">Revenue — Last 7 Days</h2>
            <p className="card__sub">Daily revenue after discounts</p>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#DDD8CC" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={tick} />
                  <YAxis tickLine={false} axisLine={false} tick={tick} width={44} tickFormatter={axisMoney} />
                  <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(48,40,32,.06)' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#302820" barSize={26} radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="card">
          <div className="card__head">
            <div>
              <h2 className="card__title">Stock alerts</h2>
              <p className="card__sub">Reorder or discount before it costs you</p>
            </div>
            <Link to="/inventory/risk" className="link strong nowrap">All alerts</Link>
          </div>
          <div className="alerts">
            {m.alerts.slice(0, 5).map((a) => (
              <div key={a.id} className={`alert alert--${a.severity}`}>
                <div className="alert__head">
                  <strong>{a.name}</strong>
                  <span className={`badge badge--sev-${a.severity}`}>{a.severity.toUpperCase()}</span>
                </div>
                <div className="alert__text">{a.text}</div>
              </div>
            ))}
            {!m.alerts.length && <div className="empty">Keep monitoring. Every item is within its min/max levels.</div>}
          </div>
        </section>
      </div>
    </Layout>
  )
}
