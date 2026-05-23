import { supabaseAdmin } from '@/lib/supabase'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

async function getInitialMetrics() {
  const supabase = supabaseAdmin()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Initial fetch for "Today"
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, products (name, price_brl)')
    .eq('status', 'paid')
    .gte('paid_at', today.toISOString())
    .order('paid_at', { ascending: true })

  const revenue = (orders || []).reduce((s, o: any) => {
    const p = Array.isArray(o.products) ? o.products[0] : o.products
    return s + (p?.price_brl || 0)
  }, 0)

  const salesCount = orders?.length || 0
  const avgTicket = salesCount ? Math.round(revenue / salesCount) : 0
  const uniqueCustomers = new Set((orders || []).map((o: any) => o.buyer_email)).size

  const chartData = (orders || []).reduce((acc: any, o: any) => {
    const date = new Date(o.paid_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const p = Array.isArray(o.products) ? o.products[0] : o.products
    const price = p?.price_brl || 0
    
    const existing = acc.find((d: any) => d.date === date)
    if (existing) {
      existing.revenue += price
      existing.sales += 1
    } else {
      acc.push({ date, revenue: price, sales: 1 })
    }
    return acc
  }, [])

  return {
    metrics: {
      revenue,
      salesCount,
      avgTicket,
      uniqueCustomers
    },
    chartData,
    recentOrders: (orders || []).reverse().slice(0, 5)
  }
}

export default async function AdminDashboard() {
  const initialData = await getInitialMetrics()

  return <DashboardClient initialData={initialData} />
}
