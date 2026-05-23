import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'

import { Gamepad2, Key, User, Calendar, LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?error=login')
  }

  const admin = supabaseAdmin()
  const { data: orders, error } = await admin
    .from('orders')
    .select(`
      id, 
      created_at, 
      status, 
      product_id,
      credential_id,
      products (name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Dashboard error:', error)
  }

  let ordersWithCredentials: any[] = []
  if (orders && orders.length > 0) {
    const credentialIds = orders.map(o => o.credential_id).filter(Boolean)
    const credentialsMap = new Map()

    if (credentialIds.length > 0) {
      const { data: creds, error: credsError } = await admin
        .from('credentials')
        .select('id, type, email, password, key_value')
        .in('id', credentialIds)

      if (credsError) {
        console.error('Credentials fetch error:', credsError)
      } else if (creds) {
        creds.forEach(c => credentialsMap.set(c.id, c))
      }
    }

    ordersWithCredentials = orders.map(order => ({
      ...order,
      credentials: order.credential_id ? credentialsMap.get(order.credential_id) : null
    }))
  }

  return (
    <div className="flex flex-col font-sans">

      <main className="flex-1 max-w-7xl mx-auto px-4 w-full py-12 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar User Profile */}
        <div className="w-full md:w-64 shrink-0">
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary blur-[80px] opacity-20"></div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 text-white shadow-lg mx-auto md:mx-0">
              <User size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-white text-center md:text-left mb-1 truncate">Minha Conta</h2>
            <p className="text-xs text-white/50 text-center md:text-left mb-6 truncate" title={user.email}>{user.email}</p>
            
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium transition hover:bg-white/20">
                <Gamepad2 size={16} className="text-accent" /> Meus Produtos
              </button>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition">
                  <LogOut size={16} /> Sair da conta
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white italic tracking-wide mb-2 uppercase drop-shadow-md">
              Meus <span className="text-accent">Produtos</span>
            </h1>
            <p className="text-white/50 text-sm">Contas e keys compradas via PIX, disponíveis para resgate imediato.</p>
          </div>

          {ordersWithCredentials.length === 0 ? (
            <div className="glass border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <Key size={32} className="text-white/30" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Seu cofre está vazio</h3>
              <p className="text-white/50 text-sm mb-6 max-w-sm">Você ainda não adquiriu nenhum produto em nossa loja. Suas compras aparecerão aqui.</p>
              <a href="/" className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-bold transition shadow-lg shadow-primary/20">
                Ir para o Catálogo
              </a>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {ordersWithCredentials.map((order: any) => {
                const cred = order.credentials
                
                return (
                  <div key={order.id} className="bg-card border border-card-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/40 transition">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent opacity-50" />
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <h2 className="font-bold text-lg text-white">{order.products?.name || 'Produto Adquirido'}</h2>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-2.5 py-1 rounded border border-green-500/20 font-bold tracking-widest uppercase">Ativo</span>
                    </div>

                    <div className="pl-2 pt-2 border-t border-white/5 mt-4">
                      {cred ? (
                        <>
                          {cred.type === 'account' ? (
                            <div className="space-y-3 mt-3">
                              <div>
                                <label className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">E-mail</label>
                                <p className="bg-background px-3 py-2 rounded-lg font-mono text-sm text-white select-all border border-white/5">{cred.email}</p>
                              </div>
                              <div>
                                <label className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Senha</label>
                                <p className="bg-background px-3 py-2 rounded-lg font-mono text-sm text-white select-all border border-white/5">{cred.password}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <label className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Status da Key / Chave</label>
                              <p className="bg-background px-3 py-3 rounded-lg font-mono text-sm text-accent select-all border border-white/5 break-all">{cred.key_value}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
                          <p className="text-[10px] text-yellow-500/80 uppercase font-bold text-center">Aguardando liberação dos dados</p>
                          <p className="text-[9px] text-white/30 text-center mt-1">Se o problema persistir, contate o suporte.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

    </div>
  )
}
