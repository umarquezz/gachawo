import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { SafeProductsTable } from './SafeProductsTable'

export const dynamic = 'force-dynamic'

async function getProducts() {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        categories (name)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data.map(p => ({
    ...p,
    status: p.active ? 'active' : 'inactive',
    categories: p.product_categories?.map((pc: any) => pc.categories.name) || []
  }))
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Produtos</h2>
          <p className="text-white/40 text-sm">Gerencie seu catálogo de itens e estoque.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Produto
        </Link>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou descrição..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" /> Status
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
              <Filter className="w-4 h-4" /> Categoria
            </button>
          </div>
        </div>

        <SafeProductsTable initialProducts={products} />
      </div>
    </div>
  )
}
