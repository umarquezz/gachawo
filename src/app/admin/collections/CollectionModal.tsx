'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { createCollection, updateCollection } from './actions'
import { useRouter } from 'next/navigation'

interface CollectionModalProps {
  isOpen: boolean
  onClose: () => void
  collection?: any // If provided, we are in edit mode
}

export function CollectionModal({ isOpen, onClose, collection }: CollectionModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    active: true
  })

  useEffect(() => {
    if (collection) {
      setFormData({
        name: collection.name || '',
        slug: collection.slug || '',
        description: collection.description || '',
        active: collection.active ?? true
      })
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        active: true
      })
    }
  }, [collection, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (collection) {
        await updateCollection(collection.id, formData)
      } else {
        await createCollection(formData)
      }
      router.refresh()
      onClose()
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111118] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {collection ? 'Editar Coleção' : 'Nova Coleção'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Nome da Coleção</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value, slug: collection ? formData.slug : e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="Ex: Novos Personagens"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Slug (URL)</label>
            <input 
              required
              type="text" 
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              placeholder="ex: novos-personagens"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest px-1">Descrição</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Opcional: Uma breve descrição para a vitrine."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-all min-h-[100px] resize-none"
            />
          </div>

          <div className="flex items-center gap-3 px-1">
            <input 
              type="checkbox" 
              id="active"
              checked={formData.active}
              onChange={e => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm text-white/60 font-medium cursor-pointer">Coleção Ativa (Visível na loja)</label>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {collection ? 'Salvar Alterações' : 'Criar Coleção'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
