'use client'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Slide {
  id: number
  title: string
  tagline: string
  bgImage: string
  buttonText: string
  buttonLink: string
  logoHtml: React.ReactNode
  promoCard: {
    title: string
    platform: string
    discount: number
    price: number
    link: string
    bgImage: string
  }
}

export function HeroBanner({ data }: { data?: any }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides: Slide[] = [
    {
      id: 0,
      title: 'LEGO Batman',
      tagline: 'FÃS DE NOLAN E DE LEGO, SE UNAM PARA ESTE LANÇAMENTO!',
      bgImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop',
      buttonText: 'Confira',
      buttonLink: '/?search=batman',
      logoHtml: (
        <div className="flex items-center gap-3 select-none scale-90 sm:scale-100 origin-left">
          <div className="bg-[#E3000B] text-white font-extrabold px-3 py-1.5 rounded-sm border border-white text-lg tracking-tighter uppercase font-sans">
            LEGO
          </div>
          <div className="flex flex-col">
            <span className="text-white font-black text-2xl tracking-widest leading-none">BATMAN</span>
            <span className="text-white/60 text-[9px] font-bold tracking-widest leading-none mt-1">LEGACY OF THE DARK KNIGHT</span>
          </div>
        </div>
      ),
      promoCard: {
        title: 'Você agradece ao ChatGPT? 🤖',
        platform: 'Steam',
        discount: 80,
        price: 39.99,
        link: '/?search=detroit',
        bgImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 1,
      title: 'Lies of P',
      tagline: 'SE FALAR QUE TÁ CARO, O NARIZ CRESCE!',
      bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
      buttonText: 'Confira',
      buttonLink: '/?search=lies',
      logoHtml: (
        <div className="select-none scale-90 sm:scale-100 origin-left">
          <span className="text-white font-serif italic font-extrabold text-3xl tracking-wide">Lies of P</span>
        </div>
      ),
      promoCard: {
        title: 'Contemple a verdade...',
        platform: 'Steam',
        discount: 59,
        price: 99.99,
        link: '/?search=lies',
        bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'
      }
    },
    {
      id: 2,
      title: 'Detroit Become Human',
      tagline: 'VOCÊ AGRADECE AO CHATGPT? O FUTURO ESTÁ EM SUAS MÃOS.',
      bgImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop',
      buttonText: 'Confira',
      buttonLink: '/?search=detroit',
      logoHtml: (
        <div className="select-none scale-90 sm:scale-100 origin-left flex flex-col font-sans">
          <span className="text-white font-extrabold text-2xl tracking-widest leading-none">DETROIT</span>
          <span className="text-white/70 text-[10px] font-bold tracking-widest leading-none mt-1">BECOME HUMAN</span>
        </div>
      ),
      promoCard: {
        title: 'Fãs de Nolan e LEGO, uni-vos!',
        platform: 'Steam',
        discount: 30,
        price: 49.99,
        link: '/?search=batman',
        bgImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop'
      }
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [slides.length])

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const activeSlide = slides[currentSlide]

  return (
    <div className="w-full relative group/hero mb-10 select-none overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
      {/* Slide Container */}
      <div 
        className="w-full min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] bg-[#070e19] relative flex flex-col justify-between p-6 sm:p-12 transition-all duration-700 ease-in-out"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(8, 17, 33, 0.95) 20%, rgba(8, 17, 33, 0.6) 50%, rgba(8, 17, 33, 0.8) 100%), url(${activeSlide.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Top Vignette Layer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#081121]/80 via-transparent to-[#081121] pointer-events-none"></div>

        {/* Content - Left side */}
        <div className="relative z-10 flex flex-col items-start justify-center flex-1 max-w-xl mt-6 sm:mt-12">
          {/* Logo container */}
          <div className="mb-6">
            {activeSlide.logoHtml}
          </div>

          {/* Tagline */}
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-wide mb-8 uppercase drop-shadow-md select-text">
            {activeSlide.tagline}
          </h1>

          {/* Action Button */}
          <Link 
            href={activeSlide.buttonLink}
            className="px-8 py-3 bg-white hover:bg-white/95 text-black font-extrabold rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg text-sm uppercase tracking-wider"
          >
            {activeSlide.buttonText}
          </Link>
        </div>

        {/* Bottom Panel: Slider controls + Mini-Promo Card */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full gap-6 mt-8">
          
          {/* Navigation Dots and Arrows */}
          <div className="flex items-center gap-3">
            {/* Prev Arrow */}
            <button 
              onClick={handlePrev}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all active:scale-95"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-6 bg-[#00f076]' : 'w-2.5 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Next Arrow */}
            <button 
              onClick={handleNext}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all active:scale-95"
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Overlaid Mini Promo Card (Nuuvem style) */}
          <Link 
            href={activeSlide.promoCard.link}
            className="w-full sm:w-[280px] bg-[#0c1c38]/90 border border-white/5 hover:border-white/20 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col hover:scale-[1.02] transition-all duration-300"
          >
            {/* Header info bar */}
            <div className="px-3.5 py-1 bg-black/40 flex items-center gap-1.5 border-b border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f076] animate-pulse"></span>
              <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">{activeSlide.promoCard.platform}</span>
            </div>

            {/* Content row */}
            <div className="p-3.5 flex gap-3 items-center">
              <div 
                className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0 border border-white/5"
                style={{ backgroundImage: `url(${activeSlide.promoCard.bgImage})` }}
              />
              <div className="flex-1 flex flex-col min-w-0 justify-center">
                <h4 className="text-white text-xs font-bold truncate leading-snug mb-1">{activeSlide.promoCard.title}</h4>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E3000B] text-white font-extrabold text-[9px] px-1 py-0.5 rounded-md">
                    -{activeSlide.promoCard.discount}%
                  </span>
                  <span className="text-white text-sm font-black tracking-tight">
                    R$ {activeSlide.promoCard.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  )
}

