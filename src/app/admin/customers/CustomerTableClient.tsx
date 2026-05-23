'use client'

import { Download, Mail, Package, ChevronDown, Calendar, Users, ShoppingBag } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Customer {
  id: string
  email: string
  name: string
  createdAt: string
  lastSignIn: string
  totalOrders: number
  paidOrders: number
  totalSpent: number
  lastPurchase: string
  products: string[]
}

function exportToCSV(customers: Customer[]) {
  const headers = ['Email', 'Nome', 'Cadastro', 'Último Login', 'Total Pedidos', 'Pedidos Pagos', 'Total Gasto (R$)', 'Última Compra', 'Produtos']
  const rows = customers.map(c => [
    c.email,
    c.name || '-',
    c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-',
    c.lastSignIn ? new Date(c.lastSignIn).toLocaleDateString('pt-BR') : '-',
    c.totalOrders,
    c.paidOrders,
    (c.totalSpent / 100).toFixed(2),
    c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('pt-BR') : '-',
    c.products.join(' | ')
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clientes_gacha_world_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type BuyerFilter = 'all' | 'buyers' | 'non-buyers'

export function CustomerTableClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')
  const [buyerFilter, setBuyerFilter] = useState<BuyerFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !search ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.name || '').toLowerCase().includes(search.toLowerCase())

      const matchBuyer =
        buyerFilter === 'all' ||
        (buyerFilter === 'buyers' && c.paidOrders > 0) ||
        (buyerFilter === 'non-buyers' && c.paidOrders === 0)

      const matchDateFrom = !dateFrom || (c.createdAt && new Date(c.createdAt) >= new Date(dateFrom))
      const matchDateTo = !dateTo || (c.createdAt && new Date(c.createdAt) <= new Date(dateTo + 'T23:59:59'))

      return matchSearch && matchBuyer && matchDateFrom && matchDateTo
    })
  }, [customers, search, buyerFilter, dateFrom, dateTo])

  return (
    <div className="bg-[#111118] border border-white/5 rounded-xl overflow-hidden">
      {/* Filters Bar */}
      <div className="p-5 border-b border-white/5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          {(['all', 'buyers', 'non-buyers'] as BuyerFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setBuyerFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                buyerFilter === f
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-white/10 text-white/40 hover:text-white bg-white/5'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'buyers' ? 'Compradores' : 'Sem compra'}
            </button>
          ))}

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-white/30" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 outline-none focus:border-purple-500/50 transition-all"
            />
            <span className="text-white/30 text-xs">até</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/70 outline-none focus:border-purple-500/50 transition-all"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-white/30 hover:text-white text-xs transition"
              >✕</button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por e-mail ou nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 max-w-sm bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
          />
          <button
            onClick={() => exportToCSV(filtered)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.01]">
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4 text-center">Cadastro</th>
              <th className="px-6 py-4 text-center">Pedidos</th>
              <th className="px-6 py-4 text-center">Pagos</th>
              <th className="px-6 py-4 text-center">Total Gasto</th>
              <th className="px-6 py-4 text-center">Última Compra</th>
              <th className="px-6 py-4 text-center">+</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((c) => (
              <>
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${
                        c.paidOrders > 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-white/30'
                      }`}>
                        {(c.name || c.email)[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {c.name || <span className="text-white/30 italic text-xs">sem nome</span>}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-white/20" />
                          <span className="text-[10px] text-white/30">{c.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] text-white/40">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-bold text-white">{c.totalOrders || '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.paidOrders > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        {c.paidOrders}
                      </span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.totalSpent > 0 ? (
                      <span className="text-sm font-bold text-white font-mono">
                        R$ {(c.totalSpent / 100).toFixed(2).replace('.', ',')}
                      </span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[11px] text-white/40">
                      {c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {c.products.length > 0 && (
                      <button
                        onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded === c.id ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </td>
                </tr>
                {expanded === c.id && (
                  <tr key={`${c.id}-exp`} className="bg-white/[0.01]">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest self-center mr-1">Produtos:</span>
                        {c.products.map((p, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/60">
                            <Package className="w-3 h-3 text-purple-400" />
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-white/20">
            <Users className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-white/5 text-[11px] text-white/20">
        {filtered.length} usuário{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
