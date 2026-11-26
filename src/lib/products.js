// Flowchart: Products → Input Product Data → validate → Save Changes.
// Change the rules here and the form and store pick them up.
export const CATEGORIES = ['Hot Drinks', 'Cold Drinks', 'Pastries', 'Sandwiches', 'Retail']
export const LOW_STOCK = 15

export function stockStatus(stock) {
  if (stock === 0) return { key: 'out', label: 'Out of Stock' }
  if (stock <= LOW_STOCK) return { key: 'low', label: 'Low Stock' }
  return { key: 'in', label: 'In Stock' }
}

export function nextSku(products) {
  const n = products.reduce((m, p) => Math.max(m, parseInt(String(p.sku).replace(/\D/g, ''), 10) || 0), 0)
  return `CAF-${String(n + 1).padStart(3, '0')}`
}

// Turns raw form strings into a clean product record.
export function cleanProduct(f) {
  return {
    sku: String(f.sku).trim().toUpperCase(),
    name: String(f.name).trim(),
    category: f.category,
    price: Number(f.price),
    cost: Number(f.cost),
    stock: Number(f.stock),
    rating: f.rating === '' || f.rating == null ? null : Number(f.rating),
  }
}

// Returns an error message, or null when the product is OK to save.
export function validateProduct(f, products, editingId = null) {
  const p = cleanProduct(f)
  if (!p.name) return 'Give the product a name.'
  if (!p.sku) return 'SKU is required.'
  if (products.some((x) => x.id !== editingId && x.sku.toLowerCase() === p.sku.toLowerCase()))
    return `SKU ${p.sku} is already used by another product.`
  if (!p.category) return 'Choose a category.'
  if (!Number.isFinite(p.price) || p.price <= 0) return 'Price must be greater than 0.'
  if (!Number.isFinite(p.cost) || p.cost < 0) return 'Cost must be 0 or more.'
  if (!Number.isInteger(p.stock) || p.stock < 0) return 'Stock must be a whole number, 0 or more.'
  if (p.rating !== null && (!Number.isFinite(p.rating) || p.rating < 0 || p.rating > 5))
    return 'Rating must be between 0 and 5 (or left empty).'
  return null
}
