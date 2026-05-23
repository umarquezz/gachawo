import { supabaseAdmin } from '@/lib/supabase'
import { Users, ShoppingBag, DollarSign, TrendingUp, UserCheck } from 'lucide-react'
import { CustomerTableClient } from './CustomerTableClient'

export const dynamic = 'force-dynamic'

async function getCustomerData() {
  const supabase = supabaseAdmin()

  // 1. Busca usuários cadastrados (auth)
  const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = authData?.users || []

  // 2. Busca todos os pedidos
  const { data: orders } = await supabase
    .from('orders')
    .select('id, buyer_email, status, paid_at, created_at, products (name, price_brl)')
    .order('created_at', { ascending: false })

  const allOrders = orders || []

  // 3. Agrupa pedidos por email
  const ordersByEmail = new Map<string, { totalOrders: number; paidOrders: number; totalSpent: number; lastPurchase: string; products: string[] }>()

  for (const order of allOrders) {
    const email = (order.buyer_email || '').toLowerCase().trim()
    if (!email) continue

    const product = Array.isArray(order.products) ? order.products[0] : order.products
    const price = product?.price_brl || 0
    const isPaid = order.status === 'paid'
    const productName = product?.name || ''

    const existing = ordersByEmail.get(email)
    if (existing) {
      existing.totalOrders++
      if (isPaid) { 
        existing.paidOrders++
        existing.totalSpent += price 
      }
      const orderDate = order.paid_at || order.created_at
      if (orderDate && orderDate > existing.lastPurchase) existing.lastPurchase = orderDate
      if (productName && !existing.products.includes(productName)) existing.products.push(productName)
    } else {
      ordersByEmail.set(email, {
        totalOrders: 1,
        paidOrders: isPaid ? 1 : 0,
        totalSpent: isPaid ? price : 0,
        lastPurchase: order.paid_at || order.created_at || '',
        products: productName ? [productName] : []
      })
    }
  }

  // 4. Cria mapa de usuários auth para busca rápida
  const authMap = new Map(authUsers.map(u => [(u.email || '').toLowerCase().trim(), u]))

  // 5. Combina todas as fontes de emails (Auth + Pedidos)
  const allEmails = new Set([
    ...authUsers.map(u => (u.email || '').toLowerCase().trim()),
    ...Array.from(ordersByEmail.keys())
  ])

  const customers = Array.from(allEmails).map(email => {
    const u = authMap.get(email)
    const orderData = ordersByEmail.get(email)
    
    return {
      id: u?.id || `guest-${email}`,
      email: email,
      name: (u?.user_metadata?.full_name || u?.user_metadata?.name || '') as string,
      createdAt: u?.created_at || orderData?.lastPurchase || '',
      lastSignIn: u?.last_sign_in_at || '',
      totalOrders: orderData?.totalOrders || 0,
      paidOrders: orderData?.paidOrders || 0,
      totalSpent: orderData?.totalSpent || 0,
      lastPurchase: orderData?.lastPurchase || '',
      products: orderData?.products || []
    }
  }).sort((a, b) => b.totalSpent - a.totalSpent)

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const buyingCustomers = customers.filter(c => c.paidOrders > 0)
  const avgTicket = buyingCustomers.length
    ? Math.round(totalRevenue / buyingCustomers.reduce((acc, c) => acc + c.paidOrders, 0))
    : 0

  return { customers, summary: { total: customers.length, totalRevenue, avgTicket, buyers: buyingCustomers.length } }
}

export default async function AdminCustomersPage() {
  const { customers, summary } = await getCustomerData()

  const stats = [
    { label: 'Usuários Cadastrados', value: summary.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', format: 'number' },
    { label: 'Já Compraram', value: summary.buyers, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', format: 'number' },
    { label: 'Receita Total', value: summary.totalRevenue, icon: DollarSign, color: 'text-purple-400', bg: 'bg-purple-400/10', format: 'currency' },
    { label: 'Ticket Médio', value: summary.avgTicket, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10', format: 'currency' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Clientes</h2>
        <p className="text-white/40 text-sm">Todos os usuários cadastrados e seu histórico de compras.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#111118] border border-white/5 rounded-xl p-5">
            <div className={`${s.bg} ${s.color} p-2 rounded-lg w-fit mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-white">
              {s.format === 'currency'
                ? `R$ ${(s.value / 100).toFixed(2).replace('.', ',')}`
                : s.value}
            </p>
          </div>
        ))}
      </div>

      <CustomerTableClient customers={customers} />
    </div>
  )
}
