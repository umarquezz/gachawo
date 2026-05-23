'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Carregamento dinâmico com SSR desativado para a Tabela de Produtos.
// Resolve conflitos estruturais com extensões que injetam atributos (bis_skin_checked, etc).
const ProductsTable = dynamic(
  () => import('./ProductsTable').then((mod) => mod.ProductsTable),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-24 bg-white/[0.02] animate-pulse min-h-[400px]">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4 opacity-20" />
        <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Limpando interface de interferências...</p>
      </div>
    )
  }
)

export function SafeProductsTable({ initialProducts }: { initialProducts: any[] }) {
  return <ProductsTable initialProducts={initialProducts} />
}
