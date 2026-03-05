import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns'
import { getServerSupabaseContext } from '@/lib/server-supabase'

export async function GET() {
  try {
    const { supabase, ownerUserId } = await getServerSupabaseContext()
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const { data: sales } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .eq('owner_user_id', ownerUserId)
      .gte('sale_date', monthStart.toISOString())
      .lte('sale_date', monthEnd.toISOString())

    const { data: expenses } = await supabase
      .from('expenses')
      .select('expense_date, amount')
      .eq('owner_user_id', ownerUserId)
      .gte('expense_date', monthStart.toISOString())
      .lte('expense_date', monthEnd.toISOString())

    const { data: expensesByCategory } = await supabase
      .from('expenses')
      .select('categories(name), amount')
      .eq('owner_user_id', ownerUserId)
      .gte('expense_date', monthStart.toISOString())
      .lte('expense_date', monthEnd.toISOString())

    const { data: topProducts } = await supabase
      .from('sales')
      .select('products(name), quantity')
      .eq('owner_user_id', ownerUserId)
      .gte('sale_date', monthStart.toISOString())
      .lte('sale_date', monthEnd.toISOString())

    const days = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    })

    const salesByDay = days.map((day) => {
      const dayString = format(day, 'yyyy-MM-dd')
      const daySales = sales?.filter((s) => s.sale_date.startsWith(dayString)) || []
      const dayExpenses = expenses?.filter((e) => e.expense_date.startsWith(dayString)) || []
      const totalSales = daySales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
      const totalExpenses = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

      return {
        date: format(day, 'MMM dd'),
        sales: totalSales,
        expenses: totalExpenses,
        profit: totalSales - totalExpenses,
      }
    })

    const categoryMap = new Map<string, number>()
    expensesByCategory?.forEach((e) => {
      const categoryRel = Array.isArray(e.categories) ? e.categories[0] : e.categories
      const categoryName = categoryRel?.name || 'Other'
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + (e.amount || 0))
    })

    const expensesByCategoryData = Array.from(categoryMap, ([name, amount]) => ({
      name,
      value: amount,
    }))

    const productMap = new Map<string, number>()
    topProducts?.forEach((p) => {
      const productRel = Array.isArray(p.products) ? p.products[0] : p.products
      const productName = productRel?.name || 'Other'
      productMap.set(productName, (productMap.get(productName) || 0) + (p.quantity || 0))
    })

    const topProductsData = Array.from(productMap, ([name, quantity]) => ({
      name,
      quantity,
    }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return NextResponse.json({
      salesAndProfit: salesByDay,
      expensesByCategory: expensesByCategoryData,
      topProducts: topProductsData,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
