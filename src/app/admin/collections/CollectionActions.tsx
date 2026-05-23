'use client'
import { Copy, Trash2, Edit2, Loader2 } from 'lucide-react'
import { duplicateCollection, deleteCollection } from './actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CollectionModal } from './CollectionModal'

export function CollectionActions({ id, collection }: { id: string, collection: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleDuplicate = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await duplicateCollection(id)
      if (res.success) {
        alert('Coleção duplicada com sucesso!')
        router.refresh()
      }
    } catch (err: any) {
      alert('Erro ao duplicar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta coleção? Todos os vínculos com produtos serão removidos.')) return
    setLoading(true)
    try {
      await deleteCollection(id)
      alert('Coleção removida!')
      router.refresh()
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <button 
          onClick={handleDuplicate}
          disabled={loading}
          className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50" 
          title="Duplicar"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all" 
          title="Editar Info"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleDelete}
          disabled={loading}
          className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all disabled:opacity-50" 
          title="Excluir"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      <CollectionModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        collection={collection}
      />
    </>
  )
}
