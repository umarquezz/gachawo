'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CollectionModal } from './CollectionModal'

export function CollectionPageHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Coleções</h2>
          <p className="text-white/40 text-sm">Gerencie categorias, status e ordenação das vitrines.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nova Coleção
        </button>
      </div>

      <CollectionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
