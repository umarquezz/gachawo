import { redirect } from 'next/navigation'
import { isAdmin } from '@/utils/admin'
import { AdminSidebar } from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/Header'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen bg-[#06060a] text-white selection:bg-purple-500/30">
      {/* Sidebar - Fixo */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="Painel de Controle" />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>

        <footer className="p-8 border-t border-white/5 text-center text-white/10 text-xs">
          © 2026 Digital Store Admin System • Built with Next.js & Supabase
        </footer>
      </div>
    </div>
  )
}
