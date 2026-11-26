import Layout from '../components/Layout'

// Temporary stand-in until you build each page. Swap in the real component in App.jsx.
export default function Placeholder({ title }) {
  return (
    <Layout title={title} subtitle="Coming soon">
      <p className="card__sub">This page hasn't been built yet.</p>
    </Layout>
  )
}
