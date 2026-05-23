'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { 
  ArrowLeft, 
  Zap, 
  Package,
  CheckCircle2,
  AlertTriangle,
  History,
  ShieldCheck,
  Clock,
  ChevronRight,
  ShieldAlert,
  CreditCard,
  MessageCircle,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { PurchaseSection } from '@/components/PurchaseSection'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Product {
  id: string
  name: string
  description: string
  price_brl: number
  price_original_brl?: number
  image_url?: string | null
  platforms?: string[]
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | null>(null)
  const [stockCount, setStockCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [salesCount, setSalesCount] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))

    const fetchData = async () => {
      try {
        const { data: prod, error: pErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
        
        if (pErr) throw pErr
        setProduct(prod)

        const { data: count, error: cErr } = await supabase
          .rpc('get_stock_count', { p_product_id: id })
        
        if (!cErr) setStockCount(count ?? 0)

        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        setSalesCount((hash % 30) + 12)

      } catch (err) {
        console.error('Error fetching product:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert size={40} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Produto Indisponível</h1>
        <Link href="/" className="mt-8 bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-white/10 transition">
          Voltar para a Vitrine
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <div className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <nav className="hidden md:flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            <Link href="/" className="hover:text-white transition">Início</Link>
            <ChevronRight size={10} className="opacity-50" />
            <span className="text-white/60 truncate max-w-[200px]">{product.name}</span>
          </nav>
          
          <Link href="/" className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2 transition group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Voltar para Vitrine
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-16">
        {/* --- MOBILE HEADER: Title & Status (Visible only on small screens) --- */}
        <div className="lg:hidden mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Verificado</span>
            </div>
            <div className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
              <Zap size={10} className="text-blue-500" />
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Entrega Instantânea</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight uppercase tracking-tight">
            {product.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-16">
          
          {/* --- LEFT: Image & Media --- */}
          <div className="lg:col-span-7 space-y-8 mb-0">
            <div className="bg-[#0c0c12] border border-white/10 rounded-xl overflow-hidden shadow-xl">
              <div className="aspect-video relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0f]">
                    <Package size={48} className="text-white/5 mb-4" />
                    <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Imagem não disponível</span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">Em Estoque</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description - Desktop Position */}
            <div className="hidden lg:block space-y-6">
              <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3">
                Descrição do Produto
                <div className="h-px flex-1 bg-white/5" />
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/50 text-base leading-relaxed font-medium whitespace-pre-wrap">
                  {product.description || "Este item digital conta com entrega imediata e garantia total de funcionamento. Após a confirmação do pagamento, você receberá os dados automaticamente no seu e-mail cadastrado."}
                </p>
              </div>
            </div>
          </div>

          {/* --- RIGHT: Purchase & Details --- */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* DESKTOP HEADER: Title & Badges */}
            <div className="hidden lg:block space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Produto Verificado</span>
                </div>
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  Ref: {id.slice(0, 8)}
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-white leading-none uppercase tracking-tighter">
                {product.name}
              </h1>
            </div>

            {/* Purchase Block */}
            <div className="bg-[#0c0c14] border border-white/10 rounded-xl p-6 lg:p-8 space-y-8 shadow-2xl">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Preço Promocional</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    R$ {(product.price_brl / 100).toFixed(2).replace('.', ',')}
                  </span>
                  {product.price_original_brl && (
                    <span className="text-lg font-medium text-white/20 line-through">
                      R$ {(product.price_original_brl / 100).toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                  <Zap size={12} fill="currentColor" />
                  Aprovação instantânea via Pix
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <PurchaseSection 
                  product={product} 
                  user={user} 
                  supabase={supabase}
                  variant="compact"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="flex flex-col items-center gap-1 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <ShieldCheck size={16} className="text-emerald-500/50" />
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Compra Segura</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <Clock size={16} className="text-blue-500/50" />
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Envio Digital</span>
                </div>
              </div>
            </div>

            {/* MOBILE ONLY: Description */}
            <div className="lg:hidden space-y-4">
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Sobre o produto</h2>
              <p className="text-sm text-white/50 leading-relaxed font-medium">
                {product.description || "Entrega imediata e garantia total."}
              </p>
            </div>

            {/* Social & Support */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="border-2 border-[#050508] w-8 h-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${id}${i}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">+{salesCount * 3} adquiriram hoje</p>
              </div>

              <button className="w-full bg-white/5 border border-white/10 text-white/60 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition flex items-center justify-center gap-2">
                <MessageCircle size={14} />
                Falar com Suporte
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
