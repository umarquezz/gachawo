'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  Calendar,
  Loader2,
  RefreshCcw,
  Package,
  Key,
  Clock,
  TicketPercent
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Metrics {
  revenue: number
  salesCount: number
  avgTicket: number
  uniqueCustomers: number
}

interface ChartData {
  date: string
  revenue: number
  sales: number
}

type Range = 'today' | 'yesterday' | '7d' | '30d' | 'all' | 'custom'

export function DashboardClient({ initialData }: { initialData: any }) {
  const [range, setRange] = useState<Range>('today')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(initialData)
  const [realtimeOrders, setRealtimeOrders] = useState<any[]>([])

  const fetchStats = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/stats?range=${range}`
      if (range === 'custom') {
        url += `&from=${dateFrom}&to=${dateTo}`
      }
      const res = await fetch(url)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (range !== 'custom') {
      fetchStats()
    }
  }, [range])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          // New order!
          console.log('New order received!', payload)
          // Refresh data to keep it real-time
          fetchStats()
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          // Order updated (paid, etc)
          if (payload.new.status === 'paid') {
            console.log('Order marked as paid!', payload)
            fetchStats()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [range, dateFrom, dateTo])

  const stats = [
    {
      name: 'Vendas no Período',
      value: data.metrics.salesCount,
      icon: ShoppingBag,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      format: 'number'
    },
    {
      name: 'Faturamento',
      value: data.metrics.revenue,
      icon: DollarSign,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      format: 'currency'
    },
    {
      name: 'Ticket Médio',
      value: data.metrics.avgTicket,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      format: 'currency'
    },
    {
      name: 'Clientes Únicos',
      value: data.metrics.uniqueCustomers,
      icon: Users,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
      format: 'number'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white font-outfit tracking-tight">Dashboard</h2>
            {loading && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
          </div>
          <p className="text-white/40 text-sm">Resumo detalhado e analítico em tempo real.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-[#111118] border border-white/5 p-1.5 rounded-xl">
          {(['today', 'yesterday', '7d', '30d', 'all', 'custom'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                range === r 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {r === 'today' ? 'Hoje' : r === 'yesterday' ? 'Ontem' : r === '7d' ? '7 Dias' : r === '30d' ? '30 Dias' : r === 'all' ? 'Tudo' : 'Personalizado'}
            </button>
          ))}
          
          {range === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-2 border-l border-white/10 ml-1"
            >
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-[10px] text-white/70 outline-none border-b border-transparent focus:border-purple-500 transition-all"
              />
              <span className="text-white/20 text-[10px]">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-[10px] text-white/70 outline-none border-b border-transparent focus:border-purple-500 transition-all"
              />
              <button 
                onClick={fetchStats}
                className="p-1 text-purple-400 hover:text-purple-300 transition"
              >
                <RefreshCcw className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.name}
            className="bg-[#111118] border border-white/5 rounded-2xl p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{stat.name}</p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tighter">
                  {stat.format === 'currency'
                    ? `R$ ${(stat.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : stat.value.toLocaleString('pt-BR')}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Lists */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Revenue Chart */}
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Tendência de Faturamento
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Receita
                </div>
              </div>
            </div>

            <div className="h-[240px] w-full flex items-end justify-between gap-1">
              {data.chartData.length > 0 ? (
                data.chartData.map((d: ChartData, idx: number) => {
                  const maxRevenue = Math.max(...data.chartData.map((cd: ChartData) => cd.revenue))
                  const height = maxRevenue ? (d.revenue / maxRevenue) * 100 : 0
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <div className="w-full relative flex items-end justify-center h-[180px]">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          className="w-full max-w-[20px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                            R$ {(d.revenue / 100).toFixed(2)}
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter truncate w-full text-center">
                        {d.date}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/10 gap-3 border border-dashed border-white/5 rounded-xl">
                  <TrendingUp className="w-8 h-8 opacity-20" />
                  <p className="text-xs">Dados insuficientes no período selecionado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                Vendas Recentes
              </h3>
              <Link href="/admin/orders" className="text-[10px] font-bold text-purple-400 hover:text-purple-300 uppercase tracking-widest transition">
                Ver todas →
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {data.recentOrders.map((order: any, idx: number) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={order.id} 
                    className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold shadow-inner">
                        {(order.buyer_email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{order.buyer_email}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-tight">{order.products?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400 font-mono">
                        R$ {(((Array.isArray(order.products) ? order.products[0] : order.products)?.price_brl || 0) / 100).toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[10px] text-white/20">
                        {order.paid_at ? new Date(order.paid_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {data.recentOrders.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-white/20 italic">
                  <p className="text-xs">Nenhuma venda encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Actions & Secondary Stats */}
        <div className="space-y-6">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest text-white/50">Ações de Gestão</h3>
            <div className="grid grid-cols-1 gap-2">
              <Link href="/admin/products/new" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-medium border border-white/5 group">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <span>Novo Produto</span>
              </Link>
              <Link href="/admin/keys" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-medium border border-white/5 group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Key className="w-4 h-4" />
                </div>
                <span>Repor Estoque</span>
              </Link>
              <Link href="/admin/promotions" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm font-medium border border-white/5 group">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TicketPercent className="w-4 h-4" />
                </div>
                <span>Promoções</span>
              </Link>
            </div>
          </div>

          {/* Quick Analytics Summary */}
          <div className="bg-gradient-to-br from-purple-600/10 to-transparent border border-purple-500/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">Meta Diária</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/40">Progresso de Vendas</span>
                <span className="text-white font-bold">{Math.min(100, Math.round((data.metrics.salesCount / 10) * 100))}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (data.metrics.salesCount / 10) * 100)}%` }}
                  className="h-full bg-purple-500" 
                />
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed italic">
                Sua meta é de 10 vendas diárias. Continue assim para manter o crescimento!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
