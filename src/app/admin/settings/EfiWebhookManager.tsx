'use client'
import { useState } from 'react'
import { setupEfiWebhook } from './actions'
import { CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react'

export function EfiWebhookManager() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await setupEfiWebhook()
      if (res.success) {
        setResult({ success: true, message: `Webhook ativado com sucesso para: ${res.url}` })
      } else {
        setResult({ success: false, message: res.error || 'Erro ao configurar' })
      }
    } catch (err: any) {
      setResult({ success: false, message: 'Falha na conexão com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-white/60 text-sm mb-1">
            Esta ação sincroniza o seu site com a Efí Bank para que os pedidos sejam entregues automaticamente após o Pix.
          </p>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">
            Necessário apenas uma vez ou se você mudar o domínio do site.
          </p>
        </div>
        <button
          onClick={handleSetup}
          disabled={loading}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 shrink-0 shadow-lg shadow-primary/20"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
          {loading ? 'Configurando...' : 'Ativar Webhook Efí'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in zoom-in-95 duration-300 ${
          result.success 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {result.success ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
          <span className="text-sm font-medium">{result.message}</span>
        </div>
      )}
    </div>
  )
}
