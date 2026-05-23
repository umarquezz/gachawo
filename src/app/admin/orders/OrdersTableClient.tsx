'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search, Download, Mail, Package, User, ShoppingBag,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Calendar, RefreshCcw, DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface ProductData {
  name: string
  price_brl: number
}

interface Order {
  id: string
  buyer_email: string
  status: string
  created_at: string
  paid_at?: string
  products?: ProductData[] | ProductData | null
  credentials?: { key_value?: string; email?: string; password?: string } | null
}

type StatusFilter = 'all' | 'paid' | 'pending' | 'failed'

function getProduct(order: Order): ProductData | null {
  if (!order.products) return null
  return Array.isArray(order.products) ? order.products[0] ?? null : order.products
}

function exportOrdersCSV(orders: Order[]) {
  const headers = ['ID Pedido', 'Email', 'Produto', 'Valor (R$)', 'Status', 'Data Criação', 'Data Pagamento']
  const rows = orders.map(o => {
    const p = getProduct(o)
    return [
      o.id,
      o.buyer_email || '',
      p?.name || '',
      p?.price_brl ? (p.price_brl / 100).toFixed(2) : '0,00',
      o.status,
      new Date(o.created_at).toLocaleString('pt-BR'),
      o.paid_at ? new Date(o.paid_at).toLocaleString('pt-BR') : '-'
    ]
  })
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pedidos_gacha_world_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function OrdersTableClient({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('Realtime change in orders:', payload)
          
          if (payload.eventType === 'INSERT') {
            // Fetch the full order with relations
            const { data: newOrder } = await supabase
              .from('orders')
              .select('*, products (name, price_brl)')
              .eq('id', payload.new.id)
              .single()
            
            if (newOrder) setOrders(prev => [newOrder, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !search ||
        (o.buyer_email || '').toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase())

      const matchStatus = statusFilter === 'all' || o.status === statusFilter

      const orderDate = o.status === 'paid' && o.paid_at ? o.paid_at : o.created_at
      const matchFrom = !dateFrom || new Date(orderDate) >= new Date(dateFrom)
      const matchTo = !dateTo || new Date(orderDate) <= new Date(dateTo + 'T23:59:59')

      return matchSearch && matchStatus && matchFrom && matchTo
    })
  }, [orders, search, statusFilter, dateFrom, dateTo])

  const stats = useMemo(() => {
    const paid = orders.filter(o => o.status === 'paid')
    const totalRevenue = paid.reduce((s, o) => s + (getProduct(o)?.price_brl || 0), 0)
    return {
      paidCount: paid.length,
      totalRevenue
    }
  }, [orders])

  const filteredRevenue = useMemo(() => {
    return filtered
      .filter(o => o.status === 'paid')
      .reduce((s, o) => s + (getProduct(o)?.price_brl || 0), 0)
  }, [filtered])

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'paid', label: 'Pagos' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'failed', label: 'Falhos' }
  ]

  return (
    <div className="space-y-6">
      {/* Real-time Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111118] border border-emerald-500/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Faturamento Real (Total)</p>
            <h3 className="text-2xl font-bold text-emerald-400 font-mono">
              R$ {(stats.totalRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-xl">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="bg-[#111118] border border-blue-500/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Total Pedidos Pagos</p>
            <h3 className="text-2xl font-bold text-blue-400 font-mono">
              {stats.paidCount}
            </h3>
          </div>
          <div className="bg-blue-500/10 p-3 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-white/5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {statusTabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border',
                    statusFilter === t.key
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-white/5 text-white/40 hover:text-white bg-white/[0.02]'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-white/20 ml-2" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-[10px] text-white/70 outline-none p-1.5"
              />
              <span className="text-white/20 text-[10px]">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="bg-transparent text-[10px] text-white/70 outline-none p-1.5"
              />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo('') }} className="px-2 text-white/30 hover:text-white transition">✕</button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                placeholder="Buscar por e-mail ou ID do pedido..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-white/10"
              />
            </div>
            <button
              onClick={() => exportOrdersCSV(filtered)}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/20 font-bold bg-white/[0.01]">
                <th className="px-6 py-5">Cliente & ID</th>
                <th className="px-6 py-5">Produto Adquirido</th>
                <th className="px-6 py-5 text-center">Valor Bruto</th>
                <th className="px-6 py-5 text-center">Status</th>
                <th className="px-6 py-5 text-center">Data / Hora</th>
                <th className="px-6 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((order) => {
                const product = getProduct(order)
                return (
                  <tr key={order.id} className="hover:bg-white/[0.01] group transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:scale-110 group-hover:border-purple-500/30 transition-all shrink-0 shadow-inner">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{order.buyer_email}</p>
                          <p className="text-[10px] font-mono text-white/10 mt-1 uppercase">
                            ID: {order.id.split('-')[0]}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Package className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <span className="text-sm font-medium text-white/70">{product?.name || '—'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <span className="text-sm font-black font-mono text-white tracking-tighter">
                        {product?.price_brl
                          ? `R$ ${(product.price_brl / 100).toFixed(2).replace('.', ',')}`
                          : '—'}
                      </span>
                    </td>

                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                        <span className={cn(
                          'px-3 py-1.5 rounded-xl text-[10px] font-black border flex items-center gap-2 shadow-sm',
                          order.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10 shadow-emerald-900/5'
                            : order.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/10 shadow-amber-900/5'
                            : 'bg-red-500/10 text-red-400 border-red-500/10 shadow-red-900/5'
                        )}>
                          {order.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> :
                           order.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           <AlertCircle className="w-3 h-3" />}
                          {order.status === 'paid' ? 'CONCLUÍDO' : order.status === 'pending' ? 'AGUARDANDO' : 'FALHOU'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <span className="text-[11px] font-bold text-white/30 uppercase tracking-tight">
                        {(order.paid_at || order.created_at)
                          ? new Date(order.paid_at || order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </span>
                    </td>

                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {order.status === 'paid' && (
                          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest">
                            <RefreshCcw className="w-3 h-3" /> Reenviar
                          </button>
                        )}
                        <button className="p-2 text-white/10 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-white/10 gap-4">
              <ShoppingBag className="w-12 h-12 opacity-10" />
              <p className="text-sm font-medium">Nenhum registro de venda encontrado.</p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.2em]">
            Exibindo {filtered.length} de {orders.length} pedidos
          </span>
          {filteredRevenue > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Receita Filtrada:</span>
              <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter">
                R$ {(filteredRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
