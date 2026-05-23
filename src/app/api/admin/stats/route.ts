import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') || 'today'
  const customFrom = searchParams.get('from')
  const customTo = searchParams.get('to')

  const supabase = supabaseAdmin()
  const now = new Date()
  let startDate = new Date()

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'yesterday':
      startDate.setDate(now.getDate() - 1)
      startDate.setHours(0, 0, 0, 0)
      const yesterdayEnd = new Date(startDate)
      yesterdayEnd.setHours(23, 59, 59, 999)
      break
    case '7d':
      startDate.setDate(now.getDate() - 7)
      break
    case '30d':
      startDate.setDate(now.getDate() - 30)
      break
    case 'all':
      startDate = new Date(0)
      break
    case 'custom':
      if (customFrom) startDate = new Date(customFrom)
      break
  }

  const query = supabase
    .from('orders')
    .select('*, products (name, price_brl)')
    .eq('status', 'paid')
  
  if (range === 'yesterday') {
    const yesterdayStart = new Date()
    yesterdayStart.setDate(now.getDate() - 1)
    yesterdayStart.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date()
    yesterdayEnd.setDate(now.getDate() - 1)
    yesterdayEnd.setHours(23, 59, 59, 999)
    query.gte('paid_at', yesterdayStart.toISOString())
    query.lte('paid_at', yesterdayEnd.toISOString())
  } else if (range === 'custom' && customTo) {
    query.gte('paid_at', startDate.toISOString())
    query.lte('paid_at', new Date(customTo + 'T23:59:59').toISOString())
  } else {
    query.gte('paid_at', startDate.toISOString())
  }

  const { data: orders, error } = await query.order('paid_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Calculate metrics
  const revenue = (orders || []).reduce((s, o: any) => {
    const p = Array.isArray(o.products) ? o.products[0] : o.products
    return s + (p?.price_brl || 0)
  }, 0)

  const salesCount = orders?.length || 0
  const avgTicket = salesCount ? Math.round(revenue / salesCount) : 0
  const uniqueCustomers = new Set((orders || []).map((o: any) => o.buyer_email)).size

  // Group by date for chart
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

  return NextResponse.json({
    metrics: {
      revenue,
      salesCount,
      avgTicket,
      uniqueCustomers
    },
    chartData,
    recentOrders: (orders || []).reverse().slice(0, 5)
  })
}
