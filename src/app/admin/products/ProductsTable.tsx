'use client'
import { useState, useEffect } from 'react'
import { deleteProduct } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Edit2, 
  Trash2, 
  Package, 
  Monitor, 
  Smartphone, 
  Gamepad2,
  TrendingDown,
  Apple,
  Smartphone as Android,
  Check,
  Save as SaveIcon
} from 'lucide-react'
import { updateProductStatus } from './actions'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  price_brl: number
  price_original_brl: number | null
  status: 'active' | 'inactive'
  image_url: string | null
  platforms: string[]
  categories: string[]
}

const PLATFORM_ICONS: any = {
  pc: { icon: Monitor, color: 'text-slate-400' },
  mobile: { icon: Smartphone, color: 'text-orange-400' },
  ps3: { icon: Gamepad2, color: 'text-blue-500' },
  ps4: { icon: Gamepad2, color: 'text-blue-400' },
  ps5: { icon: Gamepad2, color: 'text-blue-300' },
  'xbox-one': { icon: Gamepad2, color: 'text-green-500' },
  'xbox-series': { icon: Gamepad2, color: 'text-green-400' },
  'ios': { icon: Apple, color: 'text-white' },
  'android': { icon: Android, color: 'text-emerald-500' },
}

export function ProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState(initialProducts)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="p-12 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent animate-spin rounded-full"></div>
      </div>
    )
  }

  const toggleStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setLoadingId(id)
    try {
      const res = await updateProductStatus(id, nextStatus)
      if (res.success) {
        setProducts(products.map(p => p.id === id ? { ...p, status: nextStatus } : p))
      }
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    setLoadingId(id)
    try {
      const res = await deleteProduct(id)
      if (res.error) {
        alert(res.error)
      } else {
        setProducts(products.filter(p => p.id !== id))
      }
    } catch (err: any) {
      alert('Ocorreu um erro inesperado ao tentar excluir.')
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.01]">
            <th className="px-6 py-4 font-bold">Produto</th>
            <th className="px-6 py-4 font-bold text-center">Coleção / Tags</th>
            <th className="px-6 py-4 font-bold text-center">Preço</th>
            <th className="px-6 py-4 font-bold text-center">Status</th>
            <th className="px-6 py-4 font-bold text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {products.map((product) => {
            const hasDiscount = product.price_original_brl && product.price_original_brl > product.price_brl
            const discountPercent = hasDiscount 
              ? Math.round(((product.price_original_brl! - product.price_brl) / product.price_original_brl!) * 100)
              : 0

            return (
              <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 relative overflow-hidden group-hover:border-purple-500/30 transition-colors">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-white/10"><Package className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {product.platforms && product.platforms.map(p => {
                          const Config = PLATFORM_ICONS[p]
                          if (!Config) return null
                          return <Config.icon key={p} className={cn("w-3 h-3", Config.color)} title={p.toUpperCase()} />
                        })}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                    {product.categories && product.categories.map(cat => (
                      <span key={cat} className="px-2 py-0.5 rounded text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-tighter">
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    {hasDiscount && (
                      <span className="text-[10px] text-white/20 line-through font-mono">
                        R${(product.price_original_brl! / 100).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        R${(product.price_brl / 100).toFixed(2).replace('.', ',')}
                      </span>
                      {hasDiscount && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-0.5 animate-pulse">
                          <TrendingDown className="w-2 h-2" /> {discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-center items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(product.id, product.status)} 
                      disabled={loadingId === product.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border transition-all active:scale-95 disabled:opacity-50",
                        product.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}
                    >
                      {loadingId === product.id ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full"></div>
                      ) : (
                        product.status === 'active' ? 'ATIVO' : 'INATIVO'
                      )}
                    </button>
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/products/${product.id}`} className="p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></Link>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      disabled={loadingId === product.id}
                      className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {loadingId === product.id ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent animate-spin rounded-full"></div> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
