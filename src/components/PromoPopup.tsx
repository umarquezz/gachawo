'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Tag, Sparkles } from 'lucide-react'

interface PromoData {
  active: boolean
  title: string
  description: string
  couponCode: string
  buttonText: string
  imageUrl?: string
}

export function PromoPopup({ settings }: { settings: PromoData | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!settings?.active) return

    // Verifica se já foi fechado nas últimas 24 horas
    const lastDismissed = localStorage.getItem('promo_popup_dismissed')
    const now = new Date().getTime()
    
    if (lastDismissed && now - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
      return
    }

    // Delay de 3 segundos para aparecer
    const timer = setTimeout(() => {
      setIsOpen(true)
      setShow(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [settings])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('promo_popup_dismissed', new Date().getTime().toString())
    setTimeout(() => setShow(false), 500)
  }

  const handleCopy = () => {
    if (!settings?.couponCode) return
    navigator.clipboard.writeText(settings.couponCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!show || !settings?.active) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
          {/* Fundo clicável para fechar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#0B132B] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(29,78,216,0.2)] relative flex flex-col sm:flex-row group"
          >
            {/* Botão Fechar */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all active:scale-90"
            >
              <X size={18} />
            </button>

            {/* Imagem ou Lado Decorativo */}
            <div className="w-full sm:w-2/5 h-32 sm:h-auto relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-accent/20 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-white/5">
              {settings.imageUrl ? (
                <img src={settings.imageUrl} alt="Promo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <Sparkles className="w-16 h-16 text-blue-500/30 animate-pulse" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent sm:hidden" />
            </div>

            {/* Conteúdo */}
            <div className="p-8 sm:p-10 flex-1 flex flex-col justify-center text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4 mx-auto sm:mx-0">
                <Tag size={12} /> Sugestão do Dia
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
                {settings.title}
              </h2>
              
              <p className="text-white/50 text-sm sm:text-base mb-8 leading-relaxed">
                {settings.description}
              </p>

              {/* Cupom Section */}
              <div className="relative mb-6 group/coupon">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-accent rounded-2xl opacity-20 group-hover/coupon:opacity-40 transition duration-500 blur-sm" />
                <div className="relative bg-[#040A18] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/30 uppercase font-black tracking-tighter mb-1 block">Código do Cupom</span>
                    <span className="text-xl font-mono font-black text-white tracking-widest group-hover/coupon:text-blue-400 transition-colors uppercase">
                      {settings.couponCode}
                    </span>
                  </div>
                  
                  <button 
                    onClick={handleCopy}
                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-xs transition-all active:scale-95 ${
                      copied ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-blue-100'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} strokeWidth={3} /> <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="text-white/30 hover:text-white text-xs font-medium uppercase tracking-widest transition-colors hover:underline underline-offset-4"
              >
                {settings.buttonText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
