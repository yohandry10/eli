import { NextResponse } from 'next/server'
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns'
import { getServerSupabaseContext } from '@/lib/server-supabase'

export async function GET() {
  try {
    const { supabase, ownerUserId } = await getServerSupabaseContext()
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const { data: salesToday } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('owner_user_id', ownerUserId)
      .gte('sale_date', todayStart.toISOString())
      .lte('sale_date', todayEnd.toISOString())

    const salesTodayTotal = salesToday?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

    const { data: salesMonth } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('owner_user_id', ownerUserId)
      .gte('sale_date', monthStart.toISOString())
      .lte('sale_date', monthEnd.toISOString())

    const salesMonthTotal = salesMonth?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0

    const { data: expensesToday } = await supabase
      .from('expenses')
      .select('amount')
      .eq('owner_user_id', ownerUserId)
      .gte('expense_date', todayStart.toISOString())
      .lte('expense_date', todayEnd.toISOString())

    const expensesTodayTotal = expensesToday?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    const { data: expensesMonth } = await supabase
      .from('expenses')
      .select('amount')
      .eq('owner_user_id', ownerUserId)
      .gte('expense_date', monthStart.toISOString())
      .lte('expense_date', monthEnd.toISOString())

    const expensesMonthTotal = expensesMonth?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    const profitToday = salesTodayTotal - expensesTodayTotal
    const profitMonth = salesMonthTotal - expensesMonthTotal
    const profitMarginToday = salesTodayTotal > 0 ? (profitToday / salesTodayTotal) * 100 : 0
    const profitMarginMonth = salesMonthTotal > 0 ? (profitMonth / salesMonthTotal) * 100 : 0

    const { count: ordersCount } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', ownerUserId)

    const avgTicket = (salesToday && salesToday.length > 0)
      ? salesTodayTotal / salesToday.length
      : 0

    return NextResponse.json({
      sales_today: salesTodayTotal,
      sales_month: salesMonthTotal,
      expenses_today: expensesTodayTotal,
      expenses_month: expensesMonthTotal,
      profit_today: profitToday,
      profit_month: profitMonth,
      profit_margin_today: profitMarginToday,
      profit_margin_month: profitMarginMonth,
      total_orders: ordersCount || 0,
      avg_ticket: Math.round(avgTicket * 100) / 100,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
