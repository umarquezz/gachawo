import { supabaseAdmin } from '@/lib/supabase'
import { Plus, Download, Key as KeyIcon, Search, Filter } from 'lucide-react'
import { KeysTable } from './KeysTable'
import { BatchAddModal } from './BatchAddModal'

export const dynamic = 'force-dynamic'

async function getKeys() {
  const supabase = supabaseAdmin()
  const { data } = await supabase
    .from('credentials')
    .select(`
      *,
      products (name)
    `)
    .order('created_at', { ascending: false })
  
  return data || []
}

async function getProducts() {
  const supabase = supabaseAdmin()
  const { data } = await supabase.from('products').select('id, name').order('name')
  return data || []
}

export default async function AdminKeysPage() {
  const [keys, products] = await Promise.all([
    getKeys(),
    getProducts()
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Keys & Licenças</h2>
          <p className="text-white/40 text-sm">Gerencie as credenciais que são entregues aos clientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-bold transition-all border border-white/10">
            <Download className="w-5 h-5" /> Exportar CSV
          </button>
          <BatchAddModal products={products} />
        </div>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Buscar por key ou produto..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Filtros:</span>
            <button className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">DISPONÍVEL</button>
            <button className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold">VENDIDO</button>
          </div>
        </div>

        <KeysTable initialKeys={keys} />
      </div>
    </div>
  )
}
