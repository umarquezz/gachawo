'use client'
import { useState } from 'react'
import { Trash2, Copy, CheckCircle2, Circle, Key } from 'lucide-react'
import { deleteKey } from './actions'
import { cn } from '@/lib/utils'

export function KeysTable({ initialKeys }: { initialKeys: any[] }) {
  const [keys, setKeys] = useState(initialKeys)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta key?')) return
    setKeys(keys.filter(k => k.id !== id))
    await deleteKey(id)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-white/30 font-bold bg-white/[0.01]">
            <th className="px-6 py-4 font-bold">Key / Valor</th>
            <th className="px-6 py-4 font-bold text-center">Produto Associado</th>
            <th className="px-6 py-4 font-bold text-center">Data Adição</th>
            <th className="px-6 py-4 font-bold text-center">Status</th>
            <th className="px-6 py-4 font-bold text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {keys.map((k) => (
            <tr key={k.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-white/90 selection:bg-purple-500/30">
                    {k.key_value || k.email + ':' + k.password}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(k.key_value || `${k.email}:${k.password}`, k.id)}
                    className="p-1 text-white/10 hover:text-purple-400 transition-colors"
                  >
                    {copiedId === k.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </td>
              
              <td className="px-6 py-4 text-center">
                <span className="text-xs font-medium text-white/60">
                  {k.products?.name || 'Desconhecido'}
                </span>
              </td>

              <td className="px-6 py-4 text-center">
                <span className="text-[10px] font-mono text-white/20 whitespace-nowrap">
                  {new Date(k.created_at).toLocaleDateString('pt-BR')} 
                  <span className="ml-1 opacity-50">{new Date(k.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </td>

              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2",
                    k.sold 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {k.sold ? <Circle className="w-1.5 h-1.5 fill-red-400 border-none" /> : <CheckCircle2 className="w-1.5 h-1.5 fill-emerald-400 border-none" />}
                    {k.sold ? 'VENDIDO' : 'DISPONÍVEL'}
                  </span>
                </div>
              </td>

              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleDelete(k.id)}
                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {keys.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-white/20">
          <Key className="w-12 h-12 mb-4 opacity-10" />
          <p className="text-sm">Nenhuma key cadastrada.</p>
        </div>
      )}
    </div>
  )
}
