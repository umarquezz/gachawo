import { Timer, Heart } from 'lucide-react'
import Link from 'next/link'

const gradients = [
  'from-blue-600 to-indigo-900',
  'from-violet-600 to-purple-900',
  'from-emerald-600 to-teal-900',
  'from-cyan-600 to-blue-900',
  'from-fuchsia-600 to-pink-900',
]

interface ProductCardProps {
  product: any
  index: number
}

// Inline Steam SVG Icon
const SteamIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 .007c-.432 0-.856.023-1.272.066L4.85 4.981a11.97 11.97 0 00-2.88 5.753l4.743 1.956a3.78 3.78 0 011.604-1.68 3.787 3.787 0 014.93 1.258l3.963-2.617a5.497 5.497 0 00-.09-4.148 5.485 5.485 0 00-3.69-3.327A5.556 5.556 0 0012 .007zM7.228 12.3c-.027 0-.056.002-.083.004l-4.72-1.947A11.986 11.986 0 000 12c0 6.627 5.373 12 12 12 5.922 0 10.84-4.29 11.854-9.972l-5.69-3.76a3.791 3.791 0 01-5.75 3.018l-3.35 2.222a3.78 3.78 0 01-1.836.8zm.57 2.1a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
  </svg>
)

export function ProductCard({ product, index }: ProductCardProps) {
  const bgGradient = gradients[index % gradients.length]
  
  const originalPrice = product.price_original_brl || Math.round(product.price_brl * 1.3)
  const discountPercent = Math.round((1 - product.price_brl / originalPrice) * 100)

  // Determinar plataformas
  const platforms = product.platforms || ['steam']

  return (
    <div 
      className="bg-[#0c1c38]/70 border border-white/5 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 group shadow-lg flex flex-col cursor-pointer"
    >
      {/* Product Image / Fake Cover */}
      <Link href={`/product/${product.id}`} className="w-full aspect-[4/5] relative overflow-hidden block select-none">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${bgGradient} p-4 flex flex-col justify-center items-center text-center group-hover:scale-105 transition-transform duration-500`}>
            <h3 className="font-black text-base sm:text-lg text-white italic drop-shadow-md leading-tight uppercase tracking-tight">
              {product.name}
            </h3>
          </div>
        )}

        {/* Top platform bar */}
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          {platforms.map((plat: string) => (
            <span 
              key={plat} 
              className="bg-black/60 backdrop-blur-md rounded-md px-2 py-1 text-[9px] text-white font-extrabold border border-white/5 uppercase tracking-wider shadow-sm flex items-center gap-1"
            >
              {plat.toLowerCase() === 'steam' && <SteamIcon />}
              <span>{plat}</span>
            </span>
          ))}
        </div>

        {/* Stock status badge */}
        {product.stock_count === 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-[#E3000B] text-white font-extrabold px-2 py-0.5 rounded text-[8px] sm:text-[10px] uppercase tracking-widest shadow-lg">
              Esgotado
            </span>
          </div>
        )}

        {/* Bottom overlay shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#081121] via-transparent to-transparent opacity-60 pointer-events-none"></div>
      </Link>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 bg-[#0c1c38]/40 border-t border-white/5">
        <Link href={`/product/${product.id}`} className="block">
          <h4 className="text-white font-extrabold text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-[#00f076] transition-colors">
            {product.name}
          </h4>
        </Link>
        
        {/* Delivery Mode */}
        <div className="flex items-center gap-1.5 mb-3">
          <Timer size={11} className="text-[#00f076] animate-pulse" />
          <span className="text-[10px] font-bold text-white/50">Entrega Automática</span>
        </div>

        {/* Price & Actions Row */}
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              {discountPercent > 0 && (
                <span className="text-[10px] text-white/40 line-through">
                  R$ {(originalPrice / 100).toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-base sm:text-lg font-black text-white leading-none">
                R$ {(product.price_brl / 100).toFixed(2).replace('.', ',')}
              </span>
            </div>
            {discountPercent > 0 && (
              <span className="bg-[#E3000B] text-white font-black px-2 py-0.5 rounded-md text-xs tracking-tight">
                -{discountPercent}%
              </span>
            )}
          </div>
          
          {/* Buy and Wishlist buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Link 
              href={`/product/${product.id}`}
              className="flex-1 bg-[#00f076] hover:bg-[#00d769] text-black font-extrabold py-2 px-3 rounded-xl transition-all text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 active:scale-95 select-none"
            >
              Comprar
            </Link>
            <button 
              type="button"
              className="w-9 h-9 flex items-center justify-center border border-white/5 hover:border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-95 select-none"
              aria-label="Adicionar aos favoritos"
            >
              <Heart size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

