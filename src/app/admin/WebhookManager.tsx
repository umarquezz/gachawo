'use client'

import { useState } from 'react'
import { Webhook, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { registerEfiWebhook } from './actions'

export function WebhookManager() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const handleRegister = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await registerEfiWebhook()
      if (res.success) {
        setResult({ type: 'success', message: res.message })
      } else {
        setResult({ type: 'error', message: res.error || 'Erro desconhecido' })
      }
    } catch (err) {
      setResult({ type: 'error', message: 'Erro de conexão.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
          <Webhook size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Configuração de Webhook (Efí)</h3>
          <p className="text-[10px] text-white/40">Sincronize seu site com o banco para liberar pedidos automaticamente.</p>
        </div>
      </div>

      {result && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-xs font-medium border ${
          result.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {result.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {result.message}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Webhook size={16} />}
        {loading ? 'REGISTRANDO...' : 'VINCULAR SITE AO BANCO EFÍ'}
      </button>
      
      <p className="text-[9px] text-white/20 mt-3 leading-relaxed">
        ⚠️ Clique neste botão toda vez que mudar a URL do site ou se os pagamentos pararem de cair automaticamente.
      </p>
    </div>
  )
}
