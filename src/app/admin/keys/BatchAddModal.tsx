'use client'
import { useState } from 'react'
import { Plus, X, Loader2, Key } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addKeysBatch } from './actions'
import { cn } from '@/lib/utils'

export function BatchAddModal({ products }: { products: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '')
  const [keysText, setKeysText] = useState('')
  const router = useRouter()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !keysText.trim()) return

    setLoading(true)
    const keys = keysText.split('\n').map(k => k.trim()).filter(k => k !== '')
    
    try {
      await addKeysBatch(selectedProduct, keys)
      setIsOpen(false)
      setKeysText('')
      router.refresh()
    } catch (err: any) {
      alert('Erro ao adicionar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95 text-sm"
      >
        <Plus className="w-5 h-5" /> Adicionar em Lote
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#06060a]/90 backdrop-blur-sm transition-opacity"
            onClick={() => !loading && setIsOpen(false)}
          ></div>
          
          <div className="bg-[#111118] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-lg font-bold">Adicionar Keys em Lote</h3>
              <button onClick={() => !loading && setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Produto Destino</label>
                <select 
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#111118] text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Inserir Keys (Uma por linha)</label>
                <textarea 
                  value={keysText}
                  onChange={e => setKeysText(e.target.value)}
                  placeholder="ABCD-1234-EFGH&#10;IJKL-5678-MNOP..."
                  rows={8}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono text-sm outline-none focus:border-purple-500 transition-all custom-scrollbar"
                />
                <p className="text-[10px] text-white/20 mt-2 italic">Dica: Cada linha será tratada como uma credencial individual do tipo "key".</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 px-6 py-4 rounded-xl font-bold bg-white/5 text-white/40 hover:text-white transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading || !keysText.trim()}
                  className="flex-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                  Confirmar Inserção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
