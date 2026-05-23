'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Carregamento dinâmico com SSR desativado para o formulário.
// Isso impede o Next.js de tentar renderizar o formulário no servidor, 
// o que resolve conflitos com extensões de navegador como Bitwarden/Dashlane.
const ProductForm = dynamic(
  () => import('./ProductForm').then((mod) => mod.ProductForm),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-24 bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse min-h-[600px]">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4 opacity-20" />
        <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Preparando Ambiente Seguro...</p>
      </div>
    )
  }
)

interface SafeProductFormProps {
  initialData?: any
  categories: any[]
}

export function SafeProductForm(props: SafeProductFormProps) {
  return <ProductForm {...props} />
}
