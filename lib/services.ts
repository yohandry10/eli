import { getAdminSupabase, getOwnerUserId } from './desktop-supabase'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'

// ─── Products ────────────────────────────────────────────────────────────────

export async function getProducts() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('products')
    .select('*, categories(name)')
    .eq('owner_user_id', ownerUserId)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(payload: {
  name: string
  default_price: number
  is_active?: boolean
  category_id?: string
}) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  let categoryId = payload.category_id

  if (!categoryId || categoryId === '') {
    const { data: existingCat } = await adminSupabase
      .from('categories')
      .select('id')
      .eq('owner_user_id', ownerUserId)
      .eq('name', 'General')
      .maybeSingle()

    if (existingCat) {
      categoryId = existingCat.id
    } else {
      const { data: newCat, error: catError } = await adminSupabase
        .from('categories')
        .insert({ name: 'General', type: 'product', owner_user_id: ownerUserId })
        .select('id')
        .single()
      if (catError || !newCat) throw new Error('No se pudo asignar categoría: ' + catError?.message)
      categoryId = newCat.id
    }
  }

  const { data, error } = await adminSupabase
    .from('products')
    .insert({
      name: payload.name,
      default_price: payload.default_price,
      is_active: payload.is_active ?? true,
      owner_user_id: ownerUserId,
      category_id: categoryId,
    })
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteProduct(id: string) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { error } = await adminSupabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', ownerUserId)
  if (error) throw new Error(error.message)
}

export async function updateProduct(id: string, payload: Partial<{
  name: string
  category_id: string
  default_price: number
  is_active: boolean
}>) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .eq('owner_user_id', ownerUserId)
    .select()
  if (error) throw new Error(error.message)
  return data?.[0]
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export async function getSales() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('sales')
    .select('*, products(name), payment_methods(name)')
    .eq('owner_user_id', ownerUserId)
    .order('sale_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createSale(payload: {
  date: string
  product_id: string
  quantity: number
  unit_price: number
  payment_method_id: string
}) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('sales')
    .insert({
      sale_date: payload.date,
      product_id: payload.product_id,
      quantity: payload.quantity,
      unit_price: payload.unit_price,
      total_amount: payload.quantity * payload.unit_price,
      payment_method_id: payload.payment_method_id,
      owner_user_id: ownerUserId,
    })
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteSale(id: string) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { error } = await adminSupabase
    .from('sales')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', ownerUserId)
  if (error) throw new Error(error.message)
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function getExpenses() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('expenses')
    .select('*, categories(name)')
    .eq('owner_user_id', ownerUserId)
    .order('expense_date', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function createExpense(payload: {
  date: string
  category_id: string
  type: 'materials' | 'operating'
  amount: number
  supplier: string
  description?: string
}) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('expenses')
    .insert({
      expense_date: payload.date,
      category_id: payload.category_id,
      expense_type: payload.type,
      amount: payload.amount,
      supplier: payload.supplier,
      notes: payload.description || null,
      owner_user_id: ownerUserId,
    })
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteExpense(id: string) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { error } = await adminSupabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('owner_user_id', ownerUserId)
  if (error) throw new Error(error.message)
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('categories')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(payload: { name: string; type: 'product' | 'expense' }) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('categories')
    .insert({ name: payload.name, type: payload.type, owner_user_id: ownerUserId })
    .select()
  if (error) throw new Error(error.message)
  return data
}

// ─── Payment Methods ─────────────────────────────────────────────────────────

export async function getPaymentMethods() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('payment_methods')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

export async function createPaymentMethod(payload: { name: string }) {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const { data, error } = await adminSupabase
    .from('payment_methods')
    .insert({ name: payload.name, owner_user_id: ownerUserId })
    .select()
  if (error) throw new Error(error.message)
  return data
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStats() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [{ data: salesToday }, { data: salesMonth }, { data: expensesToday }, { data: expensesMonth }, { count: ordersCount }] =
    await Promise.all([
      adminSupabase.from('sales').select('total_amount').eq('owner_user_id', ownerUserId).gte('sale_date', todayStart.toISOString()).lte('sale_date', todayEnd.toISOString()),
      adminSupabase.from('sales').select('total_amount').eq('owner_user_id', ownerUserId).gte('sale_date', monthStart.toISOString()).lte('sale_date', monthEnd.toISOString()),
      adminSupabase.from('expenses').select('amount').eq('owner_user_id', ownerUserId).gte('expense_date', todayStart.toISOString()).lte('expense_date', todayEnd.toISOString()),
      adminSupabase.from('expenses').select('amount').eq('owner_user_id', ownerUserId).gte('expense_date', monthStart.toISOString()).lte('expense_date', monthEnd.toISOString()),
      adminSupabase.from('sales').select('*', { count: 'exact', head: true }).eq('owner_user_id', ownerUserId),
    ])

  const salesTodayTotal = salesToday?.reduce((s, r) => s + (r.total_amount || 0), 0) || 0
  const salesMonthTotal = salesMonth?.reduce((s, r) => s + (r.total_amount || 0), 0) || 0
  const expensesTodayTotal = expensesToday?.reduce((s, r) => s + (r.amount || 0), 0) || 0
  const expensesMonthTotal = expensesMonth?.reduce((s, r) => s + (r.amount || 0), 0) || 0
  const profitToday = salesTodayTotal - expensesTodayTotal
  const profitMonth = salesMonthTotal - expensesMonthTotal
  const avgTicket = salesToday && salesToday.length > 0 ? salesTodayTotal / salesToday.length : 0

  return {
    sales_today: salesTodayTotal,
    sales_month: salesMonthTotal,
    expenses_today: expensesTodayTotal,
    expenses_month: expensesMonthTotal,
    profit_today: profitToday,
    profit_month: profitMonth,
    profit_margin_today: salesTodayTotal > 0 ? (profitToday / salesTodayTotal) * 100 : 0,
    profit_margin_month: salesMonthTotal > 0 ? (profitMonth / salesMonthTotal) * 100 : 0,
    total_orders: ordersCount || 0,
    avg_ticket: Math.round(avgTicket * 100) / 100,
  }
}

// ─── Chart Data ──────────────────────────────────────────────────────────────

export async function getChartData() {
  const adminSupabase = getAdminSupabase()
  const ownerUserId = await getOwnerUserId()
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [{ data: sales }, { data: expenses }, { data: expensesByCategory }, { data: topProducts }] =
    await Promise.all([
      adminSupabase.from('sales').select('sale_date, total_amount').eq('owner_user_id', ownerUserId).gte('sale_date', monthStart.toISOString()).lte('sale_date', monthEnd.toISOString()),
      adminSupabase.from('expenses').select('expense_date, amount').eq('owner_user_id', ownerUserId).gte('expense_date', monthStart.toISOString()).lte('expense_date', monthEnd.toISOString()),
      adminSupabase.from('expenses').select('categories(name), amount').eq('owner_user_id', ownerUserId).gte('expense_date', monthStart.toISOString()).lte('expense_date', monthEnd.toISOString()),
      adminSupabase.from('sales').select('products(name), quantity').eq('owner_user_id', ownerUserId).gte('sale_date', monthStart.toISOString()).lte('sale_date', monthEnd.toISOString()),
    ])

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const salesAndProfit = days.map((day) => {
    const dayString = format(day, 'yyyy-MM-dd')
    const daySales = sales?.filter((s) => s.sale_date.startsWith(dayString)) || []
    const dayExpenses = expenses?.filter((e) => e.expense_date.startsWith(dayString)) || []
    const totalSales = daySales.reduce((s, r) => s + (r.total_amount || 0), 0)
    const totalExpenses = dayExpenses.reduce((s, r) => s + (r.amount || 0), 0)
    return { date: format(day, 'MMM dd'), sales: totalSales, expenses: totalExpenses, profit: totalSales - totalExpenses }
  })

  const categoryMap = new Map<string, number>()
  expensesByCategory?.forEach((e) => {
    const cat = Array.isArray(e.categories) ? e.categories[0] : e.categories
    const name = (cat as any)?.name || 'Other'
    categoryMap.set(name, (categoryMap.get(name) || 0) + (e.amount || 0))
  })

  const productMap = new Map<string, number>()
  topProducts?.forEach((p) => {
    const prod = Array.isArray(p.products) ? p.products[0] : p.products
    const name = (prod as any)?.name || 'Other'
    productMap.set(name, (productMap.get(name) || 0) + (p.quantity || 0))
  })

  return {
    salesAndProfit,
    expensesByCategory: Array.from(categoryMap, ([name, value]) => ({ name, value })),
    topProducts: Array.from(productMap, ([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
  }
}
