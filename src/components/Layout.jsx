import Sidebar from './Sidebar'

// Wrap any page in <Layout> to get the sidebar + header for free.
const today = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()

export default function Layout({ title, subtitle, children }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <header className="header">
          <div>
            <h1 className="header__title">{title}</h1>
            <p className="header__sub">{subtitle}</p>
          </div>
          <div className="header__live">
            <span className="live-badge">LIVE · {today()}</span>
            <span className="live-dot" />
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
