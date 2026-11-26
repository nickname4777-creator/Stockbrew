import { useState } from 'react'
import Layout from '../components/Layout'
import SettingsTabs from '../components/SettingsTabs'
import ConfirmDialog from '../components/ConfirmDialog'
import { RotateCcw } from 'lucide-react'
import { useStore } from '../store/StoreContext'

const KEY = 'stockbrew:settings'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }

// Not in the design screens yet: kept deliberately small. Add real preferences here as the design grows.
export default function SettingsGeneral() {
  const { resetData } = useStore()
  const [cafe, setCafe] = useState(() => load().cafe || 'Stock Brew Café')
  const [saved, setSaved] = useState(false)
  const [confirm, setConfirm] = useState(false)

  function save(e) {
    e.preventDefault()
    try { localStorage.setItem(KEY, JSON.stringify({ ...load(), cafe: cafe.trim() })) } catch { /* ignore */ }
    setSaved(true)
  }

  return (
    <Layout title="Settings" subtitle="Workspace preferences and a record of admin activity">
      <SettingsTabs />
      <section className="card">
        <h2 className="card__title">Workspace</h2>
        <form onSubmit={save} className="row">
          <label className="field grow"><span>Café name</span>
            <input className="input" value={cafe} onChange={(e) => { setCafe(e.target.value); setSaved(false) }} /></label>
          <button className="btn btn--sage btn--lg">{saved ? 'Saved' : 'Save'}</button>
        </form>
      </section>
      <section className="card">
        <h2 className="card__title">Demo data</h2>
        <p className="card__sub">Reset sales, products, inventory and discounts to the sample week. Accounts and the activity log are kept.</p>
        <button className="btn btn--ghost" onClick={() => setConfirm(true)}>Reset demo data</button>
      </section>
      {confirm && (
        <ConfirmDialog tone="danger" icon={<RotateCcw size={20} />} title="Reset demo data?" confirmLabel="Reset"
          text="Everything you added or changed in sales, products, inventory and discounts is replaced by the sample data."
          onCancel={() => setConfirm(false)} onConfirm={() => { resetData(); setConfirm(false) }} />
      )}
    </Layout>
  )
}
