import { endOfDay, endOfMonth, eachDayOfInterval, format, startOfDay, startOfMonth } from 'date-fns'
import { getAdminSupabase, getOwnerUserId } from './desktop-supabase'

type CategoryType = 'product' | 'expense'
type ExpenseType = 'materials' | 'operating'

type ProductRow = {
  id: string
  name: string
  default_price: number
  is_active: boolean
  category_id: string
  owner_user_id: string
}

type SaleRow = {
  id: string
  sale_date: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  payment_method_id: string
  owner_user_id: string
}

type ExpenseRow = {
  id: string
  expense_date: string
  category_id: string
  expense_type: ExpenseType
  amount: number
  supplier: string
  notes: string | null
  owner_user_id: string
}

type CategoryRow = {
  id: string
  name: string
  type: CategoryType
  owner_user_id: string
}

type PaymentMethodRow = {
  id: string
  name: string
  owner_user_id: string
}

type ClientRow = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  owner_user_id: string
}

type InventoryRow = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  min_stock: number
  cost_per_unit: number
  notes: string | null
  owner_user_id: string
}

type SyncOperation = {
  id: string
  table: SyncTable
  type: 'upsert' | 'delete'
  recordId: string
  payload?: Record<string, unknown>
  createdAt: string
}

type SyncTable =
  | 'products'
  | 'sales'
  | 'expenses'
  | 'categories'
  | 'payment_methods'
  | 'clients'
  | 'inventory_items'

type LocalDb = {
  meta: {
    schemaVersion: 1
    ownerUserId: string | null
    bootstrappedAt: string | null
    lastSyncAt: string | null
  }
  products: ProductRow[]
  sales: SaleRow[]
  expenses: ExpenseRow[]
  categories: CategoryRow[]
  payment_methods: PaymentMethodRow[]
  clients: ClientRow[]
  inventory_items: InventoryRow[]
  syncQueue: SyncOperation[]
}

const DB_KEY = 'blessfresh.desktop.localdb.v1'
const OFFLINE_OWNER_FALLBACK = 'offline-owner'
let cache: LocalDb | null = null
let listenersReady = false
let bootstrapPromise: Promise<void> | null = null
let syncPromise: Promise<void> | null = null

function createEmptyDb(): LocalDb {
  return {
    meta: {
      schemaVersion: 1,
      ownerUserId: null,
      bootstrappedAt: null,
      lastSyncAt: null,
    },
    products: [],
    sales: [],
    expenses: [],
    categories: [],
    payment_methods: [],
    clients: [],
    inventory_items: [],
    syncQueue: [],
  }
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export function isDesktopAppRuntime() {
  if (!isBrowser()) return false
  const hasTauriInternals = Boolean((window as any).__TAURI_INTERNALS__)
  return hasTauriInternals || window.location.hostname === 'tauri.localhost'
}

function isOnline() {
  return !isBrowser() || navigator.onLine
}

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readDb() {
  if (!isBrowser()) return createEmptyDb()
  if (cache) return cache
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      cache = createEmptyDb()
      return cache
    }
    const parsed = JSON.parse(raw) as LocalDb
    cache = {
      ...createEmptyDb(),
      ...parsed,
      meta: {
        ...createEmptyDb().meta,
        ...(parsed.meta || {}),
      },
    }
    return cache
  } catch {
    cache = createEmptyDb()
    return cache
  }
}

function writeDb(db: LocalDb) {
  if (!isBrowser()) return
  cache = db
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function ensureListeners() {
  if (!isBrowser() || listenersReady) return
  listenersReady = true
  window.addEventListener('online', () => {
    void syncPendingOperations()
  })
}

function hasLocalData(db: LocalDb) {
  return (
    db.products.length > 0 ||
    db.sales.length > 0 ||
    db.expenses.length > 0 ||
    db.categories.length > 0 ||
    db.payment_methods.length > 0 ||
    db.clients.length > 0 ||
    db.inventory_items.length > 0
  )
}

async function ensureOwnerUserId(db: LocalDb) {
  if (db.meta.ownerUserId && db.meta.ownerUserId !== OFFLINE_OWNER_FALLBACK) {
    return db.meta.ownerUserId
  }
  const envOwner = process.env.NEXT_PUBLIC_OWNER_USER_ID?.trim()
  if (envOwner) {
    db.meta.ownerUserId = envOwner
    writeDb(db)
    return envOwner
  }
  if (isOnline()) {
    try {
      const ownerUserId = await getOwnerUserId()
      db.meta.ownerUserId = ownerUserId
      writeDb(db)
      return ownerUserId
    } catch {}
  }
  db.meta.ownerUserId = OFFLINE_OWNER_FALLBACK
  writeDb(db)
  return db.meta.ownerUserId
}

async function bootstrapFromServerIfNeeded() {
  const db = readDb()
  ensureListeners()
  if (!isDesktopAppRuntime() || !isOnline() || db.meta.bootstrappedAt || hasLocalData(db)) return
  if (bootstrapPromise) {
    await bootstrapPromise
    return
  }
  bootstrapPromise = (async () => {
    try {
      const adminSupabase = getAdminSupabase()
      const ownerUserId = await getOwnerUserId()
      const [products, sales, expenses, categories, paymentMethods, clients, inventory] = await Promise.all([
        adminSupabase.from('products').select('*').eq('owner_user_id', ownerUserId),
        adminSupabase.from('sales').select('*').eq('owner_user_id', ownerUserId),
        adminSupabase.from('expenses').select('*').eq('owner_user_id', ownerUserId),
        adminSupabase.from('categories').select('*').eq('owner_user_id', ownerUserId),
        adminSupabase.from('payment_methods').select('*').eq('owner_user_id', ownerUserId),
        adminSupabase.from('clients').select('*').eq('owner_user_id', ownerUserId),
        adminSupabase.from('inventory_items').select('*').eq('owner_user_id', ownerUserId),
      ])
      const responses = [products, sales, expenses, categories, paymentMethods, clients, inventory]
      if (responses.some((r) => r.error)) return

      db.meta.ownerUserId = ownerUserId
      db.meta.bootstrappedAt = new Date().toISOString()
      db.products = (products.data || []) as ProductRow[]
      db.sales = (sales.data || []) as SaleRow[]
      db.expenses = (expenses.data || []) as ExpenseRow[]
      db.categories = (categories.data || []) as CategoryRow[]
      db.payment_methods = (paymentMethods.data || []) as PaymentMethodRow[]
      db.clients = (clients.data || []) as ClientRow[]
      db.inventory_items = (inventory.data || []) as InventoryRow[]
      writeDb(db)
    } catch {
      // Keep local mode if bootstrap fails.
    } finally {
      bootstrapPromise = null
    }
  })()
  await bootstrapPromise
}

function enqueueOperation(op: Omit<SyncOperation, 'id' | 'createdAt'>) {
  const db = readDb()
  const existingIdx = db.syncQueue.findIndex(
    (item) => item.table === op.table && item.recordId === op.recordId && item.type === op.type
  )
  const fullOp: SyncOperation = {
    ...op,
    id: uuid(),
    createdAt: new Date().toISOString(),
  }
  if (existingIdx >= 0) {
    db.syncQueue[existingIdx] = fullOp
  } else {
    db.syncQueue.push(fullOp)
  }
  writeDb(db)
}

async function runSyncWithServer(db: LocalDb) {
  if (!db.syncQueue.length || !isOnline()) return
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await ensureOwnerUserId(db)
  const remaining: SyncOperation[] = []

  for (const op of db.syncQueue) {
    try {
      if (op.type === 'delete') {
        const query = adminSupabase.from(op.table).delete().eq('id', op.recordId)
        if (ownerUserId !== OFFLINE_OWNER_FALLBACK) {
          query.eq('owner_user_id', ownerUserId)
        }
        const { error } = await query
        if (error) throw error
      } else {
        const payload = { ...(op.payload || {}) } as Record<string, unknown>
        if (!payload.owner_user_id && ownerUserId !== OFFLINE_OWNER_FALLBACK) {
          payload.owner_user_id = ownerUserId
        }
        const { error } = await adminSupabase.from(op.table).upsert(payload, { onConflict: 'id' })
        if (error) throw error
      }
    } catch {
      remaining.push(op)
    }
  }

  db.syncQueue = remaining
  db.meta.lastSyncAt = new Date().toISOString()
  writeDb(db)
}

export async function syncPendingOperations() {
  if (!isDesktopAppRuntime() || !isOnline()) return
  if (syncPromise) {
    await syncPromise
    return
  }
  syncPromise = (async () => {
    const db = readDb()
    try {
      await runSyncWithServer(db)
    } catch {
      // Silent: app stays usable offline.
    } finally {
      syncPromise = null
    }
  })()
  await syncPromise
}

async function initDesktopStore() {
  await bootstrapFromServerIfNeeded()
  void syncPendingOperations()
}

function sortByNameAsc<T extends { name: string }>(rows: T[]) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name))
}

function sortByDateDesc<T>(rows: T[], getDate: (row: T) => string) {
  return [...rows].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime())
}

async function ensureGeneralProductCategory(db: LocalDb) {
  const ownerUserId = await ensureOwnerUserId(db)
  let category = db.categories.find((c) => c.name.toLowerCase() === 'general' && c.type === 'product')
  if (category) return category.id

  category = {
    id: uuid(),
    name: 'General',
    type: 'product',
    owner_user_id: ownerUserId,
  }
  db.categories.push(category)
  writeDb(db)
  enqueueOperation({
    table: 'categories',
    type: 'upsert',
    recordId: category.id,
    payload: category,
  })
  return category.id
}

export async function getProducts() {
  await initDesktopStore()
  const db = readDb()
  const categoriesById = new Map(db.categories.map((c) => [c.id, c]))
  const products = db.products
    .map((product) => ({
      ...product,
      categories: categoriesById.get(product.category_id)
        ? { name: categoriesById.get(product.category_id)!.name }
        : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  return products
}

export async function createProduct(payload: {
  name: string
  default_price: number
  is_active?: boolean
  category_id?: string
}) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const categoryId = payload.category_id || (await ensureGeneralProductCategory(db))
  const product: ProductRow = {
    id: uuid(),
    name: payload.name,
    default_price: payload.default_price,
    is_active: payload.is_active ?? true,
    category_id: categoryId,
    owner_user_id: ownerUserId,
  }
  db.products.push(product)
  writeDb(db)
  enqueueOperation({
    table: 'products',
    type: 'upsert',
    recordId: product.id,
    payload: product,
  })
  return [product]
}

export async function deleteProduct(id: string) {
  await initDesktopStore()
  const db = readDb()
  db.products = db.products.filter((p) => p.id !== id)
  writeDb(db)
  enqueueOperation({ table: 'products', type: 'delete', recordId: id })
}

export async function updateProduct(
  id: string,
  payload: Partial<{
    name: string
    category_id: string
    default_price: number
    is_active: boolean
  }>
) {
  await initDesktopStore()
  const db = readDb()
  const idx = db.products.findIndex((p) => p.id === id)
  if (idx < 0) return null
  db.products[idx] = { ...db.products[idx], ...payload }
  writeDb(db)
  enqueueOperation({
    table: 'products',
    type: 'upsert',
    recordId: id,
    payload: db.products[idx],
  })
  return db.products[idx]
}

export async function getSales() {
  await initDesktopStore()
  const db = readDb()
  const productsById = new Map(db.products.map((p) => [p.id, p]))
  const paymentById = new Map(db.payment_methods.map((m) => [m.id, m]))
  return sortByDateDesc(
    db.sales.map((sale) => ({
      ...sale,
      products: productsById.get(sale.product_id) ? { name: productsById.get(sale.product_id)!.name } : null,
      payment_methods: paymentById.get(sale.payment_method_id)
        ? { name: paymentById.get(sale.payment_method_id)!.name }
        : null,
    })),
    (row) => row.sale_date
  )
}

export async function createSale(payload: {
  date: string
  product_id: string
  quantity: number
  unit_price: number
  payment_method_id: string
}) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const sale: SaleRow = {
    id: uuid(),
    sale_date: payload.date,
    product_id: payload.product_id,
    quantity: payload.quantity,
    unit_price: payload.unit_price,
    total_amount: payload.quantity * payload.unit_price,
    payment_method_id: payload.payment_method_id,
    owner_user_id: ownerUserId,
  }
  db.sales.push(sale)
  writeDb(db)
  enqueueOperation({
    table: 'sales',
    type: 'upsert',
    recordId: sale.id,
    payload: sale,
  })
  return [sale]
}

export async function deleteSale(id: string) {
  await initDesktopStore()
  const db = readDb()
  db.sales = db.sales.filter((s) => s.id !== id)
  writeDb(db)
  enqueueOperation({ table: 'sales', type: 'delete', recordId: id })
}

export async function getExpenses() {
  await initDesktopStore()
  const db = readDb()
  const categoriesById = new Map(db.categories.map((c) => [c.id, c]))
  return sortByDateDesc(
    db.expenses.map((expense) => ({
      ...expense,
      categories: categoriesById.get(expense.category_id)
        ? { name: categoriesById.get(expense.category_id)!.name }
        : null,
    })),
    (row) => row.expense_date
  )
}

export async function createExpense(payload: {
  date: string
  category_id: string
  type: ExpenseType
  amount: number
  supplier: string
  description?: string
}) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const expense: ExpenseRow = {
    id: uuid(),
    expense_date: payload.date,
    category_id: payload.category_id,
    expense_type: payload.type,
    amount: payload.amount,
    supplier: payload.supplier,
    notes: payload.description || null,
    owner_user_id: ownerUserId,
  }
  db.expenses.push(expense)
  writeDb(db)
  enqueueOperation({
    table: 'expenses',
    type: 'upsert',
    recordId: expense.id,
    payload: expense,
  })
  return [expense]
}

export async function deleteExpense(id: string) {
  await initDesktopStore()
  const db = readDb()
  db.expenses = db.expenses.filter((e) => e.id !== id)
  writeDb(db)
  enqueueOperation({ table: 'expenses', type: 'delete', recordId: id })
}

export async function getCategories() {
  await initDesktopStore()
  const db = readDb()
  return sortByNameAsc(db.categories)
}

export async function createCategory(payload: { name: string; type: CategoryType }) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const category: CategoryRow = {
    id: uuid(),
    name: payload.name,
    type: payload.type,
    owner_user_id: ownerUserId,
  }
  db.categories.push(category)
  writeDb(db)
  enqueueOperation({
    table: 'categories',
    type: 'upsert',
    recordId: category.id,
    payload: category,
  })
  return [category]
}

export async function getPaymentMethods() {
  await initDesktopStore()
  const db = readDb()
  return sortByNameAsc(db.payment_methods)
}

export async function createPaymentMethod(payload: { name: string }) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const method: PaymentMethodRow = {
    id: uuid(),
    name: payload.name,
    owner_user_id: ownerUserId,
  }
  db.payment_methods.push(method)
  writeDb(db)
  enqueueOperation({
    table: 'payment_methods',
    type: 'upsert',
    recordId: method.id,
    payload: method,
  })
  return [method]
}

export async function getClients() {
  await initDesktopStore()
  const db = readDb()
  return sortByNameAsc(db.clients)
}

export async function createClient(payload: {
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
}) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const client: ClientRow = {
    id: uuid(),
    name: payload.name,
    phone: payload.phone,
    email: payload.email || null,
    address: payload.address || null,
    notes: payload.notes || null,
    owner_user_id: ownerUserId,
  }
  db.clients.push(client)
  writeDb(db)
  enqueueOperation({
    table: 'clients',
    type: 'upsert',
    recordId: client.id,
    payload: client,
  })
  return [client]
}

export async function updateClient(
  id: string,
  payload: Partial<{
    name: string
    phone: string
    email: string
    address: string
    notes: string
  }>
) {
  await initDesktopStore()
  const db = readDb()
  const idx = db.clients.findIndex((c) => c.id === id)
  if (idx < 0) return null
  db.clients[idx] = { ...db.clients[idx], ...payload }
  writeDb(db)
  enqueueOperation({
    table: 'clients',
    type: 'upsert',
    recordId: id,
    payload: db.clients[idx],
  })
  return db.clients[idx]
}

export async function deleteClient(id: string) {
  await initDesktopStore()
  const db = readDb()
  db.clients = db.clients.filter((c) => c.id !== id)
  writeDb(db)
  enqueueOperation({ table: 'clients', type: 'delete', recordId: id })
}

export async function getInventoryItems() {
  await initDesktopStore()
  const db = readDb()
  return sortByNameAsc(db.inventory_items)
}

export async function createInventoryItem(payload: {
  name: string
  category: string
  quantity: number
  unit: string
  min_stock: number
  cost_per_unit: number
  notes?: string
}) {
  await initDesktopStore()
  const db = readDb()
  const ownerUserId = await ensureOwnerUserId(db)
  const item: InventoryRow = {
    id: uuid(),
    name: payload.name,
    category: payload.category,
    quantity: payload.quantity,
    unit: payload.unit,
    min_stock: payload.min_stock,
    cost_per_unit: payload.cost_per_unit,
    notes: payload.notes || null,
    owner_user_id: ownerUserId,
  }
  db.inventory_items.push(item)
  writeDb(db)
  enqueueOperation({
    table: 'inventory_items',
    type: 'upsert',
    recordId: item.id,
    payload: item,
  })
  return [item]
}

export async function updateInventoryItem(
  id: string,
  payload: Partial<{
    name: string
    category: string
    quantity: number
    unit: string
    min_stock: number
    cost_per_unit: number
    notes: string
  }>
) {
  await initDesktopStore()
  const db = readDb()
  const idx = db.inventory_items.findIndex((i) => i.id === id)
  if (idx < 0) return null
  db.inventory_items[idx] = { ...db.inventory_items[idx], ...payload }
  writeDb(db)
  enqueueOperation({
    table: 'inventory_items',
    type: 'upsert',
    recordId: id,
    payload: db.inventory_items[idx],
  })
  return db.inventory_items[idx]
}

export async function deleteInventoryItem(id: string) {
  await initDesktopStore()
  const db = readDb()
  db.inventory_items = db.inventory_items.filter((i) => i.id !== id)
  writeDb(db)
  enqueueOperation({ table: 'inventory_items', type: 'delete', recordId: id })
}

export async function getStats() {
  await initDesktopStore()
  const db = readDb()
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const salesToday = db.sales.filter((sale) => {
    const d = new Date(sale.sale_date)
    return d >= todayStart && d <= todayEnd
  })
  const salesMonth = db.sales.filter((sale) => {
    const d = new Date(sale.sale_date)
    return d >= monthStart && d <= monthEnd
  })
  const expensesToday = db.expenses.filter((expense) => {
    const d = new Date(expense.expense_date)
    return d >= todayStart && d <= todayEnd
  })
  const expensesMonth = db.expenses.filter((expense) => {
    const d = new Date(expense.expense_date)
    return d >= monthStart && d <= monthEnd
  })

  const salesTodayTotal = salesToday.reduce((sum, row) => sum + (row.total_amount || 0), 0)
  const salesMonthTotal = salesMonth.reduce((sum, row) => sum + (row.total_amount || 0), 0)
  const expensesTodayTotal = expensesToday.reduce((sum, row) => sum + (row.amount || 0), 0)
  const expensesMonthTotal = expensesMonth.reduce((sum, row) => sum + (row.amount || 0), 0)
  const profitToday = salesTodayTotal - expensesTodayTotal
  const profitMonth = salesMonthTotal - expensesMonthTotal
  const avgTicket = salesToday.length > 0 ? salesTodayTotal / salesToday.length : 0

  return {
    sales_today: salesTodayTotal,
    sales_month: salesMonthTotal,
    expenses_today: expensesTodayTotal,
    expenses_month: expensesMonthTotal,
    profit_today: profitToday,
    profit_month: profitMonth,
    profit_margin_today: salesTodayTotal > 0 ? (profitToday / salesTodayTotal) * 100 : 0,
    profit_margin_month: salesMonthTotal > 0 ? (profitMonth / salesMonthTotal) * 100 : 0,
    total_orders: db.sales.length,
    avg_ticket: Math.round(avgTicket * 100) / 100,
  }
}

export async function getChartData() {
  await initDesktopStore()
  const db = readDb()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const sales = db.sales.filter((sale) => {
    const d = new Date(sale.sale_date)
    return d >= monthStart && d <= monthEnd
  })
  const expenses = db.expenses.filter((expense) => {
    const d = new Date(expense.expense_date)
    return d >= monthStart && d <= monthEnd
  })

  const categoriesById = new Map(db.categories.map((category) => [category.id, category]))
  const productsById = new Map(db.products.map((product) => [product.id, product]))
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const salesAndProfit = days.map((day) => {
    const dayString = format(day, 'yyyy-MM-dd')
    const daySales = sales.filter((sale) => String(sale.sale_date).startsWith(dayString))
    const dayExpenses = expenses.filter((expense) => String(expense.expense_date).startsWith(dayString))
    const totalSales = daySales.reduce((sum, row) => sum + (row.total_amount || 0), 0)
    const totalExpenses = dayExpenses.reduce((sum, row) => sum + (row.amount || 0), 0)
    return {
      date: format(day, 'MMM dd'),
      sales: totalSales,
      expenses: totalExpenses,
      profit: totalSales - totalExpenses,
    }
  })

  const categoryMap = new Map<string, number>()
  for (const expense of expenses) {
    const name = categoriesById.get(expense.category_id)?.name || 'Other'
    categoryMap.set(name, (categoryMap.get(name) || 0) + (expense.amount || 0))
  }

  const productMap = new Map<string, number>()
  for (const sale of sales) {
    const name = productsById.get(sale.product_id)?.name || 'Other'
    productMap.set(name, (productMap.get(name) || 0) + (sale.quantity || 0))
  }

  return {
    salesAndProfit,
    expensesByCategory: Array.from(categoryMap, ([name, value]) => ({ name, value })),
    topProducts: Array.from(productMap, ([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  }
}
