'use client'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'

import { HeroBanner } from '@/components/HeroBanner'
import { ProductCard } from '@/components/ProductCard'
import { TestimonialsSection } from '@/components/Testimonials'

interface Product {
  id: string
  name: string
  description: string
  price_brl: number
  active: boolean
  image_url?: string | null
}

// Conteúdo separado para usar useSearchParams com Suspense
function HomeContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [promoProducts, setPromoProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [heroData, setHeroData] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const searchQuery = searchParams.get('search') || ''
  const categoryQuery = searchParams.get('category')

  const fetchProducts = async (categorySlug?: string | null) => {
    setIsLoading(true)
    try {
      const url = categorySlug 
        ? `/api/products?category=${categorySlug}` 
        : '/api/products'
      const res = await fetch(url)
      const data = await res.json()
      
      if (Array.isArray(data)) {
        setProducts(data)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    
    supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const filtered = (data || []).filter(c => c.slug !== 'promocoes-da-semana')
        setCategories(filtered)
      })

    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_banner')
      .single()
      .then(({ data }) => setHeroData(data?.value))

    fetch('/api/products?category=promocoes-da-semana')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPromoProducts(data)
        else setPromoProducts([])
      })
      .catch(err => console.error('Error fetching promo products:', err))
  }, [])

  useEffect(() => {
    setSelectedCategory(categoryQuery)
    fetchProducts(categoryQuery)
  }, [categoryQuery])

  const handleCategoryClick = (slug: string | null) => {
    if (slug) {
      router.push(`/?category=${slug}`)
    } else {
      router.push('/')
    }
  }

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    )
  })

  const filteredPromoProducts = promoProducts.filter(p => {
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    )
  })

  return (
    <div className="flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto px-4 w-full py-6 sm:py-8">
        
        {!searchQuery && <HeroBanner data={heroData} />}
        
        {/* Section: Lançamentos */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#00f076] rounded-full inline-block"></span>
              {searchQuery ? 'Resultados da Busca' : 'Lançamentos e Destaques'}
            </h2>
            {searchQuery && (
              <p className="text-xs text-white/50">
                Mostrando resultados para <span className="text-[#00f076] font-bold">"{searchQuery}"</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleCategoryClick(null)}
              className={cn(
                "px-4 py-1.5 rounded-full transition text-xs font-semibold border select-none",
                selectedCategory === null 
                  ? "bg-[#00f076]/15 text-[#00f076] border-[#00f076]/30" 
                  : "text-white/50 hover:bg-white/5 hover:text-white border-transparent"
              )}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={cn(
                  "px-4 py-1.5 rounded-full transition text-xs font-semibold border select-none",
                  selectedCategory === cat.slug 
                    ? "bg-[#00f076]/15 text-[#00f076] border-[#00f076]/30" 
                    : "text-white/50 hover:bg-white/5 hover:text-white border-transparent"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 mb-16">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-[#0c1c38]/20 border border-white/5 rounded-3xl mb-16 px-4">
            <p className="text-white/40 text-sm font-semibold mb-2">Nenhum produto encontrado</p>
            <p className="text-white/60 text-xs max-w-sm">Tente redefinir sua busca ou escolha outra categoria acima para explorar os produtos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 mb-16">
            {filteredProducts.map((p, idx) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                index={idx}
              />
            ))}
          </div>
        )}

        {/* Section: Promoções da Semana */}
        {filteredPromoProducts.length > 0 && (
          <div id="promocoes" className="space-y-6 animate-in fade-in duration-700 delay-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#00f076] rounded-full inline-block"></span>
                Promoções da Semana
              </h2>
              <span className="text-[9px] font-black text-[#00f076] bg-[#00f076]/10 border border-[#00f076]/20 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse select-none">
                Ofertas Ativas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {filteredPromoProducts.map((p, idx) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}

        {/* Section: Depoimentos */}
        <div className="mt-16">
          <TestimonialsSection />
        </div>
      </main>
    </div>
  )
}

// Suspense boundary obrigatório para useSearchParams no Next.js App Router
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex-1 max-w-7xl mx-auto px-4 w-full py-6 sm:py-8">
        <div className="w-full min-h-[460px] bg-[#0c1c38]/30 animate-pulse rounded-3xl mb-10 border border-white/5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="aspect-[4/5] bg-white/5 animate-pulse rounded-2xl border border-white/5" />
          ))}
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}


