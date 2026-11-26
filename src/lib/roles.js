// Who can do what. This file is the ONLY place access rules live: change a row and the
// sidebar, routes and buttons all follow.
export const ROLES = { admin: 'Administrator', employee: 'Employee' }

// Whole pages (a role that can't open one sees the "Administrator access required" screen).
export const PAGES = {
  dashboard: { label: 'Dashboard',      to: '/dashboard', blurb: 'Today across sales, stock, discounts and products', roles: ['admin', 'employee'] },
  sales:     { label: 'Sales & Demand', to: '/sales',     blurb: 'Revenue performance, demand forecasting, and model accuracy', roles: ['admin', 'employee'] },
  inventory: { label: 'Inventory',      to: '/inventory', blurb: 'Stock positions, flow tracking, and risk alerts', roles: ['admin', 'employee'] },
  products:  { label: 'Products',       to: '/products',  blurb: 'Full menu catalog with sales performance and stock status', roles: ['admin', 'employee'] },
  report:    { label: 'Sales report',   to: '/sales/report', blurb: 'Revenue, orders and top products for any period', roles: ['admin'] },
  data:      { label: 'Data set',       to: '/data',      blurb: 'The raw records behind every report and forecast', roles: ['admin'] },
  discounts: { label: 'Discounts',      to: '/discounts', blurb: 'Promotions and pricing rules', roles: ['admin'] },
  team:      { label: 'Team & Access',  to: '/team',      blurb: 'Manage who can sign in and what each role can see', roles: ['admin'] },
  settings:  { label: 'Settings',       to: '/settings',  blurb: 'Workspace preferences and a record of admin activity', roles: ['admin'] },
}

// Buttons inside pages the role can already open.
const ACTIONS = {
  'sales.void':      ['admin'],
  'dashboard.revenue': ['admin'], // revenue totals on the Dashboard
  'supply.edit':     ['admin'],   // add / edit inventory items
  'discount.manage': ['admin'],
  'product.edit':    ['admin'],   // add / edit / delete products
}
// Plain-English names, used by the Roles tab in Settings.
export const ACTION_LABELS = {
  'dashboard.revenue': 'See revenue totals on the Dashboard',
  'sales.void': 'Void a sale',
  'supply.edit': 'Add or edit inventory items',
  'discount.manage': 'Approve and create discounts',
  'product.edit': 'Add, edit or delete products',
}
export const actionRoles = (key) => ACTIONS[key] ?? ['admin', 'employee']

export const canOpen = (role, page) => (PAGES[page]?.roles ?? []).includes(role)
export const can = (role, action) => !ACTIONS[action] || ACTIONS[action].includes(role)
