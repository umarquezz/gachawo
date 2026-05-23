'use client'
import { User, Bell, Search } from 'lucide-react'

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white/90">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:border-purple-500/50 transition-all">
          <Search className="w-4 h-4 text-white/20" />
          <input 
            type="text" 
            placeholder="Buscar no painel..." 
            className="bg-transparent border-none outline-none text-sm text-white/70 placeholder:text-white/20 w-48"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0a0a0f]"></span>
          </button>
          
          <div className="h-8 w-px bg-white/5"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white/90">Administrador</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Acesso Total</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-purple-400">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
