import { Routes, Route, Navigate } from 'react-router-dom'
import SalesOverview from './pages/SalesOverview'
import SalesForecast from './pages/SalesForecast'
import SalesAccuracy from './pages/SalesAccuracy'
import NewSale from './pages/NewSale'
import DiscountsRecommendations from './pages/DiscountsRecommendations'
import DiscountsAnalysis from './pages/DiscountsAnalysis'
import Products from './pages/Products'
import InventoryOverview from './pages/InventoryOverview'
import InventoryLevels from './pages/InventoryLevels'
import InventoryRisk from './pages/InventoryRisk'
import InventoryWaste from './pages/InventoryWaste'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import Dashboard from './pages/Dashboard'
import SalesReport from './pages/SalesReport'
import DataSet from './pages/DataSet'
import Team from './pages/Team'
import TeamNew from './pages/TeamNew'
import SettingsGeneral from './pages/SettingsGeneral'
import SettingsActivity from './pages/SettingsActivity'
import SettingsRoles from './pages/SettingsRoles'
import RequireAuth from './components/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/set-password" element={<SetPassword />} />
      {/* Everything below needs a login (flowchart: Valid login? → Dashboard) */}
      <Route element={<RequireAuth />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/sales" element={<SalesOverview />} />
      <Route path="/sales/new" element={<NewSale />} />
 <Route element={<RequireAuth page="report" />}>
        <Route path="/sales/report" element={<SalesReport />} />
      </Route>
      <Route element={<RequireAuth page="data" />}>
        <Route path="/data" element={<DataSet />} />
      </Route>
      <Route path="/sales/forecast" element={<SalesForecast />} />
      <Route path="/sales/accuracy" element={<SalesAccuracy />} />
      <Route path="/inventory" element={<InventoryOverview />} />
      <Route path="/inventory/levels" element={<InventoryLevels />} />
      <Route path="/inventory/risk" element={<InventoryRisk />} />
      <Route path="/inventory/waste" element={<InventoryWaste />} />
      <Route element={<RequireAuth page="discounts" />}>
        <Route path="/discounts" element={<DiscountsRecommendations />} />
        <Route path="/discounts/analysis" element={<DiscountsAnalysis />} />
      </Route>
      <Route path="/products" element={<Products />} />
      <Route element={<RequireAuth page="team" />}>
        <Route path="/team" element={<Team />} />
        <Route path="/team/new" element={<TeamNew />} />
      </Route>
      <Route element={<RequireAuth page="settings" />}>
        <Route path="/settings" element={<SettingsGeneral />} />
        <Route path="/settings/activity" element={<SettingsActivity />} />
        <Route path="/settings/roles" element={<SettingsRoles />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
