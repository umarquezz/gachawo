'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Key, 
  TicketPercent, 
  Image as ImageIcon, 
  Library, 
  Images, 
  ShoppingBag,
  Users,
  LogOut,
  ChevronRight,
  Settings,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Produtos', href: '/admin/products', icon: Package },
  { name: 'Keys / Licenças', href: '/admin/keys', icon: Key },
  { name: 'Promoções', href: '/admin/promotions', icon: TicketPercent },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { name: 'Coleções', href: '/admin/collections', icon: Library },
  { name: 'Galeria', href: '/admin/media', icon: Images },
  { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Clientes', href: '/admin/customers', icon: Users },
  { name: 'Configurações', href: '/admin/settings', icon: Settings },
  { name: 'Webhook Efí', href: '/admin/webhook', icon: Zap },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-purple-500 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/20">
            A
          </div>
          <span className="font-bold text-lg tracking-tight text-white/90">Central Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-gradient-to-r from-purple-600/20 to-transparent border-l-2 border-purple-500 text-white" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-5 h-5", isActive ? "text-purple-400" : "group-hover:text-purple-400/70")} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-purple-500" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Link 
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sair do Painel
        </Link>
      </div>
    </aside>
  )
}
