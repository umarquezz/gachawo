import { supabaseAdmin } from '@/lib/supabase'
import { Plus, Library, Edit2, Trash2, Settings, Copy, Eye, EyeOff, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CollectionActions } from './CollectionActions'
import { CollectionPageHeader } from './CollectionPageHeader'

export const dynamic = 'force-dynamic'

async function getCollections() {
  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('categories')
    .select(`
      *,
      product_count: product_categories(count)
    `)
    .order('sort_order', { ascending: true })
  return data || []
}

export default async function AdminCollectionsPage() {
  const collections = await getCollections()

  return (
    <div className="space-y-8">
      <CollectionPageHeader />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col: any) => (
          <div key={col.id} className="bg-[#111118] border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all overflow-hidden flex flex-col">
            {/* Header/Image */}
            <div className="aspect-[21/9] bg-white/[0.02] relative group-hover:bg-white/[0.05] transition-all">
              {col.image_url ? (
                <img src={col.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/5">
                  <Library className="w-10 h-10" />
                </div>
              )}
              
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md flex items-center gap-2",
                  col.active 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {col.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {col.active ? 'ATIVA' : 'INATIVA'}
                </span>
                <span className="bg-black/60 backdrop-blur-md text-white/60 text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                  <ArrowUpDown className="w-3 h-3" /> ORD: {col.sort_order}
                </span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-[#111118] to-transparent"></div>
              
              <div className="absolute bottom-4 left-6">
                <h3 className="text-xl font-bold text-white drop-shadow-lg">{col.name}</h3>
                <p className="text-[10px] text-white/40 font-mono tracking-widest mt-1 uppercase">/{col.slug}</p>
              </div>
            </div>

            {/* Stats & Actions */}
            <div className="p-6 pt-2 space-y-6 flex-1 flex flex-col justify-between">
              <p className="text-white/40 text-xs line-clamp-2 leading-relaxed italic">
                {col.description || 'Sem descrição definida para esta coleção.'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400 text-xs font-bold">
                     {col.product_count?.[0]?.count || 0}
                   </div>
                   <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Produtos</span>
                </div>
                
                <CollectionActions id={col.id} collection={col} />
              </div>

              <Link 
                href={`/admin/collections/${col.id}/products`}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 transition-all font-bold text-xs uppercase tracking-widest"
              >
                <Settings className="w-4 h-4" /> Gerenciar Itens
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
