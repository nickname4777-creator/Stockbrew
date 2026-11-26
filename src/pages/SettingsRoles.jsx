import Layout from '../components/Layout'
import SettingsTabs from '../components/SettingsTabs'
import RoleMatrix from '../components/RoleMatrix'

// Read-only. To change who can do what, edit lib/roles.js.
export default function SettingsRoles() {
  return (
    <Layout title="Settings" subtitle="Workspace preferences and a record of admin activity">
      <SettingsTabs />
      <section className="card">
        <h2 className="card__title">Role permissions</h2>
        <p className="card__sub">Pages each role can open, and what they can do inside them. Roles are assigned in Team &amp; Access.</p>
        <RoleMatrix withActions />
      </section>
    </Layout>
  )
}
