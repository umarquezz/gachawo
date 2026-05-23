import { useState, useEffect } from 'react'
import { X, Copy, QrCode, CheckCircle2, ShieldCheck, Gamepad2, ArrowRight, RefreshCw } from 'lucide-react'

interface Credential {
  type: 'account' | 'key'
  email?: string
  password?: string
  key_value?: string
}

interface CheckoutModalProps {
  product: any
  user: any
  supabase: any
  onClose: () => void
}

export function CheckoutModal({ product, user, supabase, onClose }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [pixPayload, setPixPayload] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  
  const [credential, setCredential] = useState<Credential | null>(null)
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Polling ativo consultando a Efí Bank
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
          setSuccess('Pagamento aprovado! Redirecionando para o seu histórico...')
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 1500)
        }
      } catch (err) { }
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
        setPixPayload(data.pix_payload)
        setQrCode(data.qr_code_image)
        setPolling(true)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
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
        setSuccess('Pagamento confirmado com sucesso! Redirecionando para o seu histórico...')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        setError('O pagamento ainda não foi processado pelo banco. Tente novamente em alguns segundos.')
      }
    } catch {
      setError('Erro ao verificar pagamento.')
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
    else setError('Link mágico enviado! Verifique seu e-mail para aprovar o login.')
    setLoading(false)
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 py-8">
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-lg sm:max-w-xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans my-auto">
        {/* Close Button */}
        {!credential && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition duration-200 z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* --- STAGE 0: CREDENTIAL DELIVERED --- */}
        {credential && (
          <div className="p-8 sm:p-10 text-center animate-in zoom-in-95 duration-400">
            <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">Pagamento Aprovado!</h2>
            <p className="text-white/60 text-sm sm:text-base mb-8">
              Suas credenciais foram liberadas com sucesso. Guarde-as com segurança.
            </p>

            <div className="bg-[#050810] rounded-xl p-6 border border-white/10 text-left mb-8 shadow-inner">
              {credential.type === 'account' ? (
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">E-mail de acesso</label>
                    <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                      <span className="px-4 py-3 text-white font-mono text-sm sm:text-base flex-1 border-r border-white/10 truncate select-all">{credential.email}</span>
                      <button 
                        onClick={() => copy(credential.email!, 'email')} 
                        className="px-4 bg-white/5 hover:bg-white/10 transition text-accent flex items-center justify-center font-medium text-xs gap-1.5"
                      >
                        {copied === 'email' ? <span className="text-emerald-400 flex items-center gap-1">✓ Copiado</span> : <><Copy size={14} /> Copiar</>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Senha</label>
                    <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                      <span className="px-4 py-3 text-white font-mono text-sm sm:text-base flex-1 border-r border-white/10 truncate select-all">{credential.password}</span>
                      <button 
                        onClick={() => copy(credential.password!, 'pass')} 
                        className="px-4 bg-white/5 hover:bg-white/10 transition text-accent flex items-center justify-center font-medium text-xs gap-1.5"
                      >
                        {copied === 'pass' ? <span className="text-emerald-400 flex items-center gap-1">✓ Copiado</span> : <><Copy size={14} /> Copiar</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Chave / Key de Ativação</label>
                  <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <span className="px-4 py-3.5 text-white font-mono text-sm sm:text-base flex-1 break-all select-all border-r border-white/10">{credential.key_value}</span>
                    <button 
                      onClick={() => copy(credential.key_value!, 'key')} 
                      className="px-4 bg-white/5 hover:bg-white/10 transition text-accent flex items-center justify-center font-medium text-xs gap-1.5 shrink-0"
                    >
                      {copied === 'key' ? <span className="text-emerald-400 flex items-center gap-1">✓ Copiado</span> : <><Copy size={14} /> Copiar</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={onClose} 
              className="w-full bg-white text-black font-extrabold py-4 px-8 rounded-xl hover:bg-gray-100 transition duration-200 text-base shadow-lg shadow-white/10"
            >
              Fechar e Acessar Conta
            </button>
          </div>
        )}

        {/* --- STAGE 1: WAITING PAYMENT (EFÍ PIX) --- */}
        {!credential && pixPayload && (
          <div className="p-6 sm:p-10 animate-in fade-in duration-400">
            <div className="flex items-center gap-3.5 mb-8 border-b border-white/10 pb-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <QrCode size={22} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Finalizar com Pix</h2>
                <p className="text-white/50 text-xs sm:text-sm mt-0.5">Escaneie o QR Code ou copie o código Pix abaixo.</p>
              </div>
            </div>
            
            {success && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs sm:text-sm text-center font-medium animate-in fade-in duration-300">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm text-center font-medium animate-in shake">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-8">
              {/* QR Code Container */}
              <div className="flex flex-col items-center shrink-0 w-full sm:w-auto">
                <div className="bg-white p-4 rounded-2xl shadow-xl border border-white/20 mb-4 w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center transition-all hover:scale-[1.02]">
                  <img src={qrCode!} alt="PIX QR Code" className="w-full h-full object-contain" />
                </div>
                
                <div className="flex items-center justify-center gap-2.5 text-xs text-emerald-400 font-semibold uppercase bg-emerald-500/10 py-2.5 px-4 rounded-xl border border-emerald-500/20 w-full tracking-wide">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                  Aguardando Pagamento
                </div>
              </div>

              {/* Instructions & Manual Confirmation Button */}
              <div className="flex-1 space-y-6 w-full">
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Passo a Passo Rápido</h3>
                  <ol className="text-xs sm:text-sm text-white/80 space-y-3.5">
                    <li className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 font-bold font-mono text-[11px] flex items-center justify-center text-white shrink-0 mt-0.5">1</span>
                      <span className="leading-snug">Abra o aplicativo do seu banco no celular.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 font-bold font-mono text-[11px] flex items-center justify-center text-white shrink-0 mt-0.5">2</span>
                      <span className="leading-snug">Selecione pagar via <strong className="text-emerald-400 font-bold">Pix QR Code</strong>.</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 font-bold font-mono text-[11px] flex items-center justify-center text-white shrink-0 mt-0.5">3</span>
                      <span className="leading-snug">Aponte a câmera para o QR Code ao lado.</span>
                    </li>
                  </ol>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleManualCheck}
                    disabled={checkLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white font-bold py-4 px-5 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 disabled:opacity-50 text-sm sm:text-base border border-emerald-400/30 font-sans"
                  >
                    {checkLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={18} />
                        <span>Consultando no banco...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={20} className="text-emerald-200" />
                        <span>Já realizei o pagamento</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-white/40 text-center mt-2.5 font-medium">Clique assim que concluir o pagamento no seu app bancário.</p>
                </div>
              </div>
            </div>

            {/* Pix Copia e Cola */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Pix Copia e Cola</span>
                <span className="text-[11px] text-white/50">Se preferir pagar copiando o código</span>
              </div>
              <div className="flex bg-[#050810] border border-white/15 rounded-xl overflow-hidden shadow-inner">
                <div className="px-4 py-3.5 text-white/70 font-mono text-xs sm:text-sm flex-1 truncate select-all">
                  {pixPayload}
                </div>
                <button 
                  onClick={() => copy(pixPayload, 'pix')} 
                  className="px-5 bg-white/5 hover:bg-white/10 active:bg-white/5 transition text-emerald-400 font-bold text-xs sm:text-sm border-l border-white/10 flex items-center justify-center gap-2 shrink-0"
                >
                  {copied === 'pix' ? <span className="flex items-center gap-1.5">✓ Copiado</span> : <><Copy size={15} /> Copiar Código</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STAGE 2: INITIAL CHECKOUT --- */}
        {!credential && !checkoutUrl && (
          <>
            <div className="bg-gradient-to-r from-emerald-500/15 via-primary/20 to-transparent p-6 sm:p-8 border-b border-white/10">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-18 bg-[#050810] rounded-xl border border-white/15 flex items-center justify-center shrink-0 shadow-lg p-3.5 text-emerald-400">
                  <Gamepad2 size={32} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg sm:text-xl leading-tight line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Entrega Instantânea via Pix</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8 bg-[#050810] p-5 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-white/60 text-sm sm:text-base font-medium">Investimento total:</span>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  R$ {(product.price_brl / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs sm:text-sm mb-6 text-center font-medium animate-in shake">
                  {error}
                </div>
              )}

              {user ? (
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] text-white font-extrabold py-4 rounded-xl transition duration-200 disabled:opacity-50 shadow-xl shadow-emerald-500/20 text-base sm:text-lg border border-emerald-400/30 flex items-center justify-center gap-3"
                >
                  {loading ? 'Gerando QR Code Pix...' : <><span>Gerar QR Code Pix Agora</span> <ArrowRight size={20} /></>}
                </button>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="text-center mb-6">
                    <ShieldCheck size={28} className="text-emerald-400 mx-auto mb-2 opacity-90" />
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium">Informe seu e-mail para vincularmos esta compra e garantirmos sua segurança e histórico.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Seu e-mail de acesso</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@melhor-email.com"
                      className="w-full bg-[#050810] border border-white/15 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:border-emerald-400/50 transition shadow-inner font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white hover:bg-gray-100 text-black font-extrabold py-4 rounded-xl transition duration-200 disabled:opacity-50 text-base sm:text-lg shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? 'Enviando...' : <><span>Entrar para Comprar</span> <ArrowRight size={20} /></>}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
