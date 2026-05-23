'use client'
import { useState, useMemo } from 'react'
import { Search, Save, ArrowLeft, Loader2, Package, Check, X, ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateCollectionProducts } from './actions'
import { cn } from '@/lib/utils'

export function CollectionProductManager({ 
  collection, 
  allProducts, 
  currentIds 
}: { 
  collection: any, 
  allProducts: any[], 
  currentIds: string[] 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds)
  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [allProducts, search])

  // Ordenar selecionados primeiro ou por ordem original? 
  // O usuário quer "Listagem dos produtos já associados com opção de remover"
  const selectedProducts = useMemo(() => {
    return allProducts.filter(p => selectedIds.includes(p.id))
  }, [allProducts, selectedIds])

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateCollectionProducts(collection.id, selectedIds)
      router.refresh()
      alert('Sincronizado com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/collections')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{collection.name}</h2>
            <p className="text-white/40 text-sm italic">/{collection.slug} • Gerenciando {selectedIds.length} produtos</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo: Busca e Seleção */}
        <div className="bg-[#111118] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Adicionar Produtos</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="text" 
                placeholder="Pesquisar por nome do produto..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
            {filteredProducts.map(p => {
              const active = selectedIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                    active 
                      ? "bg-blue-600/10 border-blue-500/30 text-white" 
                      : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                      active ? "bg-blue-600/20 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/5"
                    )}>
                      {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover rounded-lg" alt="" /> : <Package className="w-5 h-5 opacity-40" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none mb-1">{p.name}</p>
                      <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Preço: R${(p.price_brl/100).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                    active ? "bg-blue-600 border-blue-500 text-white scale-110" : "bg-white/5 border-white/10 text-transparent"
                  )}>
                    <Check className="w-4 h-4" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Lado Direito: Listagem dos Adicionados e Reordenação */}
        <div className="bg-[#111118] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[700px]">
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Organizar Coleção</h3>
            <p className="text-xs text-white/20 italic">Os produtos aparecerão nesta ordem na loja.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {selectedProducts.length > 0 ? selectedProducts.map((p, index) => (
              <div key={p.id} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl group active:scale-[0.98] transition-all">
                <div className="text-[10px] font-bold text-white/10 w-4">#{index + 1}</div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover" alt="" /> : <Package className="w-4 h-4 text-white/10" />}
                  </div>
                  <span className="text-sm font-bold text-white/80">{p.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-white/20 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"><ArrowUpDown className="w-4 h-4" /></button>
                  <button 
                    onClick={() => toggleProduct(p.id)}
                    className="p-2 text-white/20 hover:text-red-400 transition-all ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-white/10 gap-3">
                <Package className="w-12 h-12 opacity-10" />
                <p className="text-sm font-medium">Nenhum produto selecionado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
