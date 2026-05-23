'use client'
import { useState, useEffect } from 'react'
import { Copy, CheckCircle2, Loader2, X, ShoppingCart, Plus, RefreshCw, ArrowRight, ShieldCheck, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Credential {
  type: 'account' | 'key'
  email?: string
  password?: string
  key_value?: string
}

interface PurchaseSectionProps {
  product: any
  user: any
  supabase: any
  className?: string
  variant?: 'default' | 'compact'
}

export function PurchaseSection({ product, user, supabase, className, variant = 'default' }: PurchaseSectionProps) {
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const [pixData, setPixData] = useState<{ qrCode: string, payload: string } | null>(null)
  const [credential, setCredential] = useState<Credential | null>(null)
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [checkingOrder, setCheckingOrder] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function checkExisting() {
      if (!user) { setCheckingOrder(false); return }
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, status, credential_id')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (data?.credential_id) {
          const { data: cred } = await supabase
            .from('credentials')
            .select('type, email, password, key_value')
            .eq('id', data.credential_id)
            .single()
          if (cred) setCredential(cred)
        }
      } catch { } finally { setCheckingOrder(false) }
    }
    checkExisting()
  }, [product.id, user, supabase])

  // Polling ativo consultando o Banco Central / Efí Bank
  useEffect(() => {
    if (!orderId || !polling) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/force-check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })
        const data = await res.json()
        if (data.status === 'paid') {
          setPolling(false)
          setPixData(null)
          setSuccess('Pagamento aprovado! Redirecionando para o seu histórico...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1500)
        }
      } catch { }
    }, 4000)
    return () => clearInterval(interval)
  }, [orderId, polling])

  const handleBuy = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar pedido')
      } else {
        setOrderId(data.order_id)
        setPixData({ qrCode: data.qr_code_image, payload: data.pix_payload })
        setPolling(true)
      }
    } catch { setError('Erro de conexão ao gerar Pix.') } finally { setLoading(false) }
  }

  const handleManualCheck = async () => {
    if (!orderId) return
    setCheckLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/force-check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.status === 'paid') {
        setPolling(false)
        setPixData(null)
        setSuccess('Pagamento confirmado com sucesso! Redirecionando para o seu histórico...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        setError('O pagamento ainda não foi processado pelo banco. Aguarde mais alguns segundos.')
      }
    } catch {
      setError('Erro ao consultar o banco.')
    } finally {
      setCheckLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) setError(error.message)
    else setError('Link mágico enviado! Verifique sua caixa de e-mail.')
    setLoading(false)
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  if (credential) {
    return (
      <div className={cn("bg-[#0b0f19] border-2 border-emerald-500 rounded-2xl p-8 text-center shadow-2xl shadow-emerald-500/20 animate-in zoom-in-95 font-sans", className)}>
        <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Pagamento Aprovado!</h2>
        <p className="text-white/60 text-sm sm:text-base mb-8">Sua conta ou chave foi ativada com sucesso e está pronta para uso imediato.</p>
        
        <div className="bg-[#050810] rounded-2xl p-6 border border-white/10 text-left mb-8 shadow-inner">
          {credential.type === 'account' ? (
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">E-mail de Acesso</label>
                <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <span className="px-4 py-3.5 text-white font-mono text-sm sm:text-base flex-1 truncate select-all">{credential.email}</span>
                  <button onClick={() => copy(credential.email!, 'e')} className="px-5 bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-xs sm:text-sm border-l border-white/10 transition flex items-center justify-center gap-1.5">
                    {copied === 'e' ? '✓ Copiado' : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Senha</label>
                <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <span className="px-4 py-3.5 text-white font-mono text-sm sm:text-base flex-1 truncate select-all">{credential.password}</span>
                  <button onClick={() => copy(credential.password!, 'pw')} className="px-5 bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-xs sm:text-sm border-l border-white/10 transition flex items-center justify-center gap-1.5">
                    {copied === 'pw' ? '✓ Copiado' : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Chave / Link de Download</label>
              <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <span className="px-4 py-3.5 text-white font-mono text-sm sm:text-base flex-1 truncate select-all">{credential.key_value}</span>
                <button onClick={() => copy(credential.key_value!, 'k')} className="px-5 bg-white/5 hover:bg-white/10 text-emerald-400 font-bold text-xs sm:text-sm border-l border-white/10 transition flex items-center justify-center gap-1.5">
                  {copied === 'k' ? '✓ Copiado' : <><Copy size={14} /> Copiar</>}
                </button>
              </div>
            </div>
          )}
        </div>
        <a href="/dashboard" className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-emerald-500/25 text-base sm:text-lg">
          Acessar Meu Painel de Compras
        </a>
      </div>
    )
  }

  if (checkingOrder) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
  }

  return (
    <div className={cn("flex flex-col gap-4 font-sans", className)}>
      {variant === 'default' && (
        <div className="bg-[#050810] border border-white/10 rounded-2xl p-5 flex justify-between items-center shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Investimento Total</span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">R$ {(product.price_brl / 100).toFixed(2).replace('.', ',')}</span>
          </div>
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-lg uppercase tracking-wide">Entrega Imediata</span>
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm text-center font-semibold animate-in shake">{error}</div>}

      {user ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white font-extrabold py-4 rounded-xl transition duration-200 disabled:opacity-50 text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 border border-emerald-400/30"
          >
            {loading ? <Loader2 className="animate-spin" size={22} /> : (
              <><span>COMPRAR AGORA COM PIX</span> <ArrowRight size={20} /></>
            )}
          </button>
          <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 uppercase tracking-wide">
            <Plus size={18} /> Adicionar ao carrinho
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="space-y-4 bg-[#050810] p-6 rounded-2xl border border-white/10 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Seu E-mail de Acesso</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@melhor-email.com"
              className="w-full bg-[#111622] border border-white/15 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:border-emerald-400/50 transition font-medium"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-white hover:bg-gray-100 text-black font-extrabold py-4 rounded-xl transition duration-200 disabled:opacity-50 text-base sm:text-lg shadow-lg flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={22} /> : <><span>Continuar para Pagamento</span> <ArrowRight size={20} /></>}
          </button>
        </form>
      )}

      {/* ── PIX Modal Premium de Elite ── */}
      {pixData && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 font-sans py-8">
          <div className="bg-[#0b0f19] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
            {/* ─ Cabeçalho ─ */}
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <QrCode size={22} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">Pagamento via Pix</h3>
                  <p className="text-white/50 text-xs mt-1 font-medium">Aprovação instantânea 24 horas por dia</p>
                </div>
              </div>
              <button
                onClick={() => { setPixData(null); setPolling(false) }}
                className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* ─ Corpo ─ */}
            <div className="p-8 flex flex-col gap-6">
              {/* QR Code com Pedestal Nobre */}
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-3xl shadow-2xl border border-white/20 mb-4 w-60 h-60 flex items-center justify-center transition-all hover:scale-[1.02]">
                  <img
                    src={pixData.qrCode}
                    alt="QR Code PIX"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="flex items-center justify-center gap-2.5 text-xs text-emerald-400 font-bold uppercase bg-emerald-500/10 py-2.5 px-5 rounded-xl border border-emerald-500/20 tracking-wider">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  Aguardando Pagamento
                </div>
              </div>

              {/* Valor + produto em destaque */}
              <div className="flex items-center justify-between bg-[#050810] border border-white/10 rounded-2xl p-5 shadow-inner">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Total a Pagar</p>
                  <p className="text-white text-2xl sm:text-3xl font-black tabular-nums tracking-tight">
                    R$ {(product.price_brl / 100).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Produto</p>
                  <p className="text-white/90 text-sm sm:text-base font-bold max-w-[180px] truncate">{product.name}</p>
                </div>
              </div>

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs sm:text-sm text-center font-semibold animate-in fade-in duration-300">
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm text-center font-semibold animate-in shake">
                  {error}
                </div>
              )}

              {/* Botão Imponente de Já Efetuei o Pagamento */}
              <div>
                <button
                  onClick={handleManualCheck}
                  disabled={checkLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white font-extrabold py-4 px-6 rounded-2xl transition duration-200 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 disabled:opacity-50 text-base sm:text-lg border border-emerald-400/30"
                >
                  {checkLoading ? (
                    <>
                      <RefreshCw className="animate-spin text-emerald-200" size={22} />
                      <span>Verificando transação no banco...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={24} className="text-emerald-200" />
                      <span>Já efetuei o pagamento</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-white/40 text-center mt-3 font-medium">Clique neste botão logo após confirmar o Pix no seu celular.</p>
              </div>

              {/* Copia e Cola */}
              <div className="pt-2">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-2">Pix Copia e Cola</p>
                <div className="flex bg-[#050810] border border-white/15 rounded-xl overflow-hidden shadow-inner">
                  <span className="px-4 py-3.5 text-white/70 font-mono text-xs sm:text-sm flex-1 truncate select-all">{pixData.payload}</span>
                  <button
                    onClick={() => copy(pixData.payload, 'p')}
                    className="px-5 bg-white/5 hover:bg-white/10 active:bg-white/5 text-emerald-400 font-bold text-xs sm:text-sm border-l border-white/10 flex items-center justify-center gap-1.5 transition shrink-0"
                  >
                    {copied === 'p' ? <span className="flex items-center gap-1">✓ Copiado</span> : <><Copy size={14} /> Copiar</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
