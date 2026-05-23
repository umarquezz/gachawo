import { supabaseAdmin } from '@/lib/supabase'
import { ShoppingBag, CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { OrdersTableClient } from './OrdersTableClient'

export const dynamic = 'force-dynamic'

async function getOrdersData() {
  const supabase = supabaseAdmin()
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      products (name, price_brl),
      credentials (key_value, email, password)
    `)
    .order('created_at', { ascending: false })

  const all = orders || []
  const paid = all.filter(o => o.status === 'paid')
  const pending = all.filter(o => o.status === 'pending')
  const failed = all.filter(o => o.status !== 'paid' && o.status !== 'pending')

  const totalRevenue = paid.reduce((s, o: any) => {
    const p = Array.isArray(o.products) ? o.products[0] : o.products
    return s + (p?.price_brl || 0)
  }, 0)
  const avgTicket = paid.length ? Math.round(totalRevenue / paid.length) : 0

  return { orders: all, stats: { paid: paid.length, pending: pending.length, failed: failed.length, totalRevenue, avgTicket } }
}

export default async function AdminOrdersPage() {
  const { orders, stats } = await getOrdersData()

  const cards = [
    { label: 'Pedidos Pagos', value: stats.paid, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', format: 'number' },
    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', format: 'number' },
    { label: 'Faturamento Total', value: stats.totalRevenue, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10', format: 'currency' },
    { label: 'Ticket Médio', value: stats.avgTicket, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10', format: 'currency' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Pedidos & Vendas</h2>
        <p className="text-white/40 text-sm">Acompanhe as transações e entregas da sua loja.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#111118] border border-white/5 rounded-xl p-5">
            <div className={`${c.bg} ${c.color} p-2 rounded-lg w-fit mb-3`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">
              {c.format === 'currency'
                ? `R$ ${(c.value / 100).toFixed(2).replace('.', ',')}`
                : c.value}
            </p>
          </div>
        ))}
      </div>

      <OrdersTableClient orders={orders} />
    </div>
  )
}
