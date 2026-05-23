import { supabaseAdmin } from '@/lib/supabase'
import { Plus, TicketPercent, ToggleLeft, ToggleRight, Trash2, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getCoupons() {
  const supabase = supabaseAdmin()
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  return data || []
}

export default async function AdminPromotionsPage() {
  const coupons = await getCoupons()

  const getStatus = (c: any) => {
    const now = new Date()
    const start = c.start_at ? new Date(c.start_at) : null
    const end = c.end_at ? new Date(c.end_at) : null

    if (!c.active) return { label: 'INATIVO', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
    if (end && now > end) return { label: 'ENCERRADA', color: 'bg-white/5 text-white/30 border-white/10' }
    if (start && now < start) return { label: 'AGENDADA', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    return { label: 'ATIVA', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Promoções & Cupons</h2>
          <p className="text-white/40 text-sm">Crie descontos e agende ofertas especiais.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-600/20 active:scale-95">
          <Plus className="w-5 h-5" /> Novo Cupom
        </button>
      </div>

      <div className="grid gap-6">
        {coupons.map((c: any) => {
          const status = getStatus(c)
          return (
            <div key={c.id} className="bg-[#111118] border border-white/5 rounded-2xl p-6 group hover:border-pink-500/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 flex-shrink-0">
                  <TicketPercent className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    {c.name}
                    <span className="bg-white/5 text-white/40 rounded-md px-2 py-0.5 text-[10px] uppercase font-mono border border-white/10">
                      {c.code}
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1">
                    <span className="text-sm font-bold text-pink-400">
                      {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `R$ ${c.discount_value / 100} OFF`}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase font-bold tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {c.start_at ? new Date(c.start_at).toLocaleDateString() : 'Imediato'} 
                      {c.end_at && ` → ${new Date(c.end_at).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", status.color)}>
                  {status.label}
                </div>

                <div className="flex items-center gap-3">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white border border-white/5" title="Ativar/Desativar">
                    {c.active ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button className="p-3 bg-white/5 hover:bg-red-400/5 rounded-xl transition-all text-white/40 hover:text-red-400 border border-white/5" title="Excluir">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {coupons.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
            <TicketPercent className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm">Nenhuma promoção ativa no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
