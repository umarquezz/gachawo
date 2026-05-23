'use client'
import { useState } from 'react'
import { Save, Loader2, Image as ImageIcon, Type, MousePointer2, Tag } from 'lucide-react'
import { updateSiteSettings } from './actions'

export function PromoPopupForm({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSiteSettings('promo_popup', data)
      alert('Configurações do Popup salvas com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ativar/Desativar */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="space-y-1">
          <h4 className="text-white font-bold text-sm">Status do Popup</h4>
          <p className="text-white/40 text-xs italic">Ative ou desative a exibição do popup promocional.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.active}
            onChange={e => setData({ ...data, active: e.target.checked })}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/40 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Título */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Type className="w-3 h-3" /> Título do Popup
          </label>
          <input 
            type="text" 
            value={data.title}
            onChange={e => setData({ ...data, title: e.target.value })}
            placeholder="Ex: Oferta Limitada!"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Cupom */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Tag className="w-3 h-3" /> Código do Cupom
          </label>
          <input 
            type="text" 
            value={data.couponCode}
            onChange={e => setData({ ...data, couponCode: e.target.value })}
            placeholder="Ex: BEMVINDO10"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-wider"
          />
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
          Descrição Curta
        </label>
        <textarea 
          value={data.description}
          onChange={e => setData({ ...data, description: e.target.value })}
          placeholder="Ex: Use o cupom abaixo para ganhar 10% de desconto na sua primeira compra."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium min-h-[80px] resize-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Texto do Botão */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            Texto do Botão
          </label>
          <input 
            type="text" 
            value={data.buttonText}
            onChange={e => setData({ ...data, buttonText: e.target.value })}
            placeholder="Ex: Aproveitar Agora"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Imagem */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> URL da Imagem (Opcional)
          </label>
          <input 
            type="text" 
            value={data.imageUrl}
            onChange={e => setData({ ...data, imageUrl: e.target.value })}
            placeholder="https://exemplo.com/promo.jpg"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-3xl font-bold transition-all shadow-xl shadow-blue-600/30 active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Configurações do Popup
        </button>
      </div>
    </form>
  )
}
