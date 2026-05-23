'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { Search, User, LogOut, ChevronDown, ShoppingBag, Menu, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function HeaderContent() {
  const [user, setUser] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [selectedCategoryName, setSelectedCategoryName] = useState('Tudo')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  
  const menuRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Sync search val from URL
    const query = searchParams.get('search')
    if (query) {
      setSearchVal(query)
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    // Fetch active categories for dropdown
    supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setCategories(data)
      })

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchParams])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
    router.refresh()
    router.push('/')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      router.push(`/?search=${encodeURIComponent(searchVal.trim())}`)
    } else {
      router.push('/')
    }
    setShowMobileSearch(false)
  }

  const handleCategorySelect = (categorySlug: string | null, categoryName: string) => {
    setSelectedCategoryName(categoryName)
    setIsCategoryDropdownOpen(false)
    if (categorySlug) {
      router.push(`/?category=${categorySlug}`)
    } else {
      router.push('/')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full glass shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left Side: Hamburger & Logo */}
        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
          <button className="text-white hover:text-primary transition-colors p-1" aria-label="Menu">
            <Menu size={22} />
          </button>
          
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition shrink-0 select-none">
            {/* Cloud SVG Logo */}
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-7 h-7 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]"
            >
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
            </svg>
            <span className="text-white font-black text-xl tracking-tight leading-none lowercase">
              nuuvem
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (Hidden on mobile unless toggled) */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center bg-[#15233c] hover:bg-[#1b2b48] border border-white/5 focus-within:border-white/20 transition-all rounded-full h-11 overflow-visible">
            {/* Category Dropdown */}
            <div className="relative h-full" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="h-full px-4 flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white border-r border-white/5 transition-colors select-none"
              >
                <span>{selectedCategoryName}</span>
                <ChevronDown size={14} className={`text-white/40 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCategoryDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-[#0b162c] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect(null, 'Tudo')}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Tudo
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.slug, cat.name)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Text */}
            <input 
              type="text" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Buscar jogo ou palavra-chave" 
              className="flex-1 bg-transparent px-4 py-2.5 text-white text-xs placeholder-white/30 focus:outline-none h-full"
            />
            
            {/* Search Icon Submit Button */}
            <button type="submit" className="h-full px-4 text-white/40 hover:text-white transition-colors" aria-label="Buscar">
              <Search size={16} />
            </button>
          </form>
        </div>
        
        {/* Right Side: Search Icon (Mobile Only) & User Menu / Entrar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile Search Toggle */}
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden text-white/70 hover:text-white p-2 transition-colors"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>

          {/* User Menu / Entrar */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1b2b48] hover:bg-[#203354] transition text-white border border-white/5 group"
                >
                  <User size={16} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:block text-xs font-semibold max-w-[100px] truncate">{user.email.split('@')[0]}</span>
                  <ChevronDown size={12} className={`text-white/40 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0b162c] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Minha Conta</p>
                      <p className="text-xs font-medium text-white truncate">{user.email}</p>
                    </div>
                    <Link 
                      href="/dashboard" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
                    >
                      <ShoppingBag size={16} className="text-primary" />
                      Minhas Compras
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition"
                    >
                      <LogOut size={16} />
                      Sair do Site
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center justify-center px-5 py-2.5 rounded-full bg-[#203354] hover:bg-[#2d4263] border border-white/5 transition text-white font-bold text-xs sm:text-sm select-none">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay Form */}
      {showMobileSearch && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0b162c] border-b border-white/10 px-4 py-3 z-40 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-[#15233c] border border-white/10 rounded-full h-10 overflow-hidden">
            <input 
              type="text" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Buscar jogo ou palavra-chave..." 
              className="flex-1 bg-transparent px-4 text-white text-xs placeholder-white/40 focus:outline-none h-full"
              autoFocus
            />
            <button type="submit" className="h-full px-4 text-white/60" aria-label="Confirmar busca">
              <Search size={16} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowMobileSearch(false)}
              className="h-full pr-4 text-white/40 hover:text-white"
              aria-label="Fechar busca"
            >
              <X size={16} />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}

export function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full glass shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white/5 animate-pulse" />
            <div className="w-20 h-5 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  )
}
