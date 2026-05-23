'use client'
import { useState } from 'react'
import { setupEfiWebhook } from '../settings/actions'
import { CheckCircle2, AlertCircle, Loader2, Zap, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WebhookPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await setupEfiWebhook()
      if (res.success) {
        setResult({ success: true, message: `Webhook ativado! URL registrada: ${res.url}` })
      } else {
        setResult({ success: false, message: res.error || 'Erro ao configurar webhook' })
      }
    } catch (err: any) {
      setResult({ success: false, message: 'Erro de conexão com o servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        <Link href="/admin/settings" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-8 transition">
          <ArrowLeft size={16} /> Voltar para Configurações
        </Link>

        <div className="bg-[#111118] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <Zap size={22} className="text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Webhook Efí Bank</h1>
              <p className="text-white/40 text-sm">Configuração de recebimento automático via Pix</p>
            </div>
          </div>

          {/* Como funciona */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-6 space-y-3">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Como funciona</h3>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex gap-2"><span className="text-green-500 shrink-0">→</span> Cliente paga o Pix</li>
              <li className="flex gap-2"><span className="text-green-500 shrink-0">→</span> A Efí Bank notifica automaticamente este site</li>
              <li className="flex gap-2"><span className="text-green-500 shrink-0">→</span> O sistema libera a conta/credencial instantaneamente</li>
            </ul>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4 mb-6">
            <p className="text-yellow-400/80 text-xs leading-relaxed">
              <strong className="text-yellow-400">Importante:</strong> Clique neste botão sempre que trocar de domínio ou plataforma de hospedagem (ex: de Netlify para Vercel). Isso registra a URL correta na Efí Bank.
            </p>
          </div>

          {/* Resultado */}
          {result && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 mb-6 ${
              result.success
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {result.success
                ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                : <AlertCircle size={20} className="shrink-0 mt-0.5" />
              }
              <span className="text-sm leading-relaxed">{result.message}</span>
            </div>
          )}

          {/* Botão principal */}
          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-3 text-sm shadow-lg shadow-green-600/20"
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Configurando Webhook...</>
              : <><Zap size={18} /> Ativar Webhook Efí Bank</>
            }
          </button>

          {result?.success && (
            <button
              onClick={handleSetup}
              className="w-full mt-3 text-white/30 hover:text-white/60 text-xs flex items-center justify-center gap-2 py-2 transition"
            >
              <RefreshCw size={12} /> Reconfigurar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
