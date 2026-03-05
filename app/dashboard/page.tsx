'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Activity, ShoppingCart, Percent } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface Stats {
  sales_today: number
  sales_month: number
  expenses_today: number
  expenses_month: number
  profit_today: number
  profit_month: number
  profit_margin_today: number
  profit_margin_month: number
  total_orders: number
  avg_ticket: number
}

interface ChartData {
  salesAndProfit: Array<{ date: string; sales: number; expenses: number; profit: number }>
  expensesByCategory: Array<{ name: string; value: number }>
  topProducts: Array<{ name: string; quantity: number }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, chartRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/chart-data'),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (chartRes.ok) {
        const chartDataResult = await chartRes.json()
        setChartData(chartDataResult)
      }
    } catch (error) {
      console.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue
  }: {
    title: string
    value: number
    icon: React.ComponentType<any>
    trend?: 'up' | 'down'
    trendValue?: number
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {title.includes('Margen') ? `${value.toFixed(1)}%` : `$${value.toFixed(2)}`}
        </div>
        {trendValue && (
          <p className={`text-xs mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'} {Math.abs(trendValue).toFixed(1)}% vs. período anterior
          </p>
        )}
      </CardContent>
    </Card>
  )

  if (isLoading || !stats) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-6 rounded-xl border border-blue-100">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">¡Hola! Así va tu lavandería hoy 🧺</h1>
          <p className="text-sm md:text-base text-blue-700/80">
            Resumen diario y mensual de tus ventas, gastos y servicios
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <StatCard
            title="Ventas Hoy"
            value={stats.sales_today}
            icon={TrendingUp}
          />
          <StatCard
            title="Ventas del Mes"
            value={stats.sales_month}
            icon={DollarSign}
          />
          <StatCard
            title="Gastos Hoy"
            value={stats.expenses_today}
            icon={TrendingDown}
          />
          <StatCard
            title="Gastos del Mes"
            value={stats.expenses_month}
            icon={Activity}
          />
          <StatCard
            title="Ganancia Hoy"
            value={stats.profit_today}
            icon={DollarSign}
            trend={stats.profit_today >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Ganancia del Mes"
            value={stats.profit_month}
            icon={TrendingUp}
            trend={stats.profit_month >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Margen de Ganancia Hoy"
            value={stats.profit_margin_today}
            icon={Percent}
          />
          <StatCard
            title="Margen de Ganancia Mes"
            value={stats.profit_margin_month}
            icon={Percent}
          />
          <StatCard
            title="Total de Servicios"
            value={stats.total_orders}
            icon={ShoppingCart}
          />
        </div>

        {/* Charts Section */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Gráfico Ventas vs Ganancia - Estilo Terminal / Avanzado */}
            <Card className="bg-[#18181b] border-[#27272a] text-zinc-100 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-100 font-medium tracking-wide">Desglose de Ingresos (S/)</CardTitle>
                <p className="text-xs text-zinc-400">Ventas brutas vs. Ganancia neta</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData.salesAndProfit} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#a1a1aa', fontSize: 11 }}
                      tickFormatter={(value) => `${value}`}
                      dx={-10}
                    />
                    <Tooltip
                      cursor={{ fill: '#27272a', opacity: 0.4 }}
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderRadius: '8px',
                        border: '1px solid #27272a',
                        color: '#f4f4f5',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                      }}
                      formatter={(value: number) => [`S/ ${value.toFixed(2)}`, undefined]}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#a1a1aa' }}
                    />
                    <Bar
                      dataKey="sales"
                      name="Ventas"
                      fill="#f97316" /* Naranja principal */
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Gastos"
                      fill="#ef4444" /* Rojo (Tailwind red-500) */
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="profit"
                      name="Ganancia"
                      fill="#fbbf24" /* Ámbar/Amarillo secundario */
                      radius={[4, 4, 0, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gastos por Categoría */}
            {chartData.expensesByCategory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gastos por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.expensesByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Productos */}
            {chartData.topProducts.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top 5 Productos por Cantidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
