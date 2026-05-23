import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-[#030712] py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Side */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 text-white mb-4">
            <img src="/logo.png" alt="Gacha World" className="w-10 h-10 object-contain" />
            <span className="font-bold text-lg tracking-tight">
              Gacha<span className="text-accent"> World</span> Store
            </span>
          </div>
          <p className="text-sm text-white/50 max-w-xs">
            A melhor escolha que você pode fazer. Jogos, Contas, Premium Keys e muito mais. Segurança e agilidade no seu PIX.
          </p>
          <div className="mt-4 flex flex-col gap-1">
            <p className="text-xs text-white/30">Email para contato: <strong className="text-white/60">suporte@gachaworld.com</strong></p>
            <p className="text-xs text-white/30 tracking-wider">CNPJ: <strong className="text-white/60">65.233.658/0001-99</strong></p>
          </div>
        </div>

        {/* Right Side / Socials */}
        <div className="flex items-center gap-4">
          <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent hover:border-accent hover:bg-accent/10 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent hover:border-accent hover:bg-accent/10 transition">
            <MessageCircle size={20} />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between text-[11px] text-white/30">
        <p>Copyright © 2026 - Gacha World Store. Todos os direitos reservados.</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 lg:mt-0">
          <Link href="/politicas/termos-de-uso" className="hover:text-white transition">Termos de Uso</Link>
          <Link href="/politicas/reembolso" className="hover:text-white transition">Política de Reembolso</Link>
          <Link href="/politicas/uso-das-contas" className="hover:text-white transition">Uso das Contas</Link>
          <span className="hidden sm:inline opacity-20">|</span>
          <span className="text-[10px] uppercase tracking-widest font-medium opacity-60">Gacha World Digital LTDA</span>
        </div>
      </div>
    </footer>
  )
}

