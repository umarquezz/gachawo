import { supabaseAdmin } from '@/lib/supabase'
import { Plus, Image as ImageIcon, Link as LinkIcon, MoveVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getBanners() {
  const supabase = supabaseAdmin()
  const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true })
  return data || []
}

export default async function AdminBannersPage() {
  const banners = await getBanners()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Banners do Carrossel</h2>
          <p className="text-white/40 text-sm">Gerencie os anúncios da página inicial.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
          <Plus className="w-5 h-5" /> Adicionar Banner
        </button>
      </div>

      <div className="grid gap-6">
        {banners.map((b: any) => (
          <div key={b.id} className="bg-[#111118] border border-white/5 rounded-3xl overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col xl:flex-row">
            {/* Preview Area */}
            <div className="xl:w-1/2 aspect-[21/9] bg-white/5 relative">
              <img src={b.desktop_url} alt="" className="w-full h-full object-cover" />
              {!b.active && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                    <EyeOff className="w-4 h-4" /> Inativo
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">DESKTOP</span>
                {b.mobile_url && <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">MOBILE</span>}
              </div>
            </div>

            {/* Content & Actions */}
            <div className="flex-1 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Ordem de Exibição</p>
                      <p className="text-lg font-bold text-white">Posição #{b.sort_order}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 text-white/40 hover:text-white"><MoveVertical className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/40 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <LinkIcon className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{b.target_link || 'Sem link de destino'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex items-center gap-3 border-t border-white/5 mt-8">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all border border-white/5">
                  EDITAR BANNER
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 text-emerald-400 text-xs font-bold transition-all border border-white/5">
                   <Eye className="w-4 h-4" /> ATIVAR
                </button>
                <button className="p-3 flex items-center justify-center bg-white/5 hover:bg-red-400/5 text-white/40 hover:text-red-400 rounded-xl transition-all border border-white/5">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
            <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm">Nenhum banner cadastrado para o carrossel.</p>
          </div>
        )}
      </div>
    </div>
  )
}
