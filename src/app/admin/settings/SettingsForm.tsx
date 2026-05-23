'use client'
import { useState } from 'react'
import { Save, Loader2, Image as ImageIcon, Link as LinkIcon, Type } from 'lucide-react'
import { updateSiteSettings } from './actions'

export function SettingsForm({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSiteSettings('hero_banner', data)
      alert('Configurações salvas com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Título */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Type className="w-3 h-3" /> Título Principal
          </label>
          <input 
            type="text" 
            value={data.title}
            onChange={e => setData({ ...data, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Texto de Destaque */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Type className="w-3 h-3" /> Texto em Destaque (Colorido)
          </label>
          <input 
            type="text" 
            value={data.highlight}
            onChange={e => setData({ ...data, highlight: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
          Subtítulo / Descrição
        </label>
        <textarea 
          value={data.description}
          onChange={e => setData({ ...data, description: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium min-h-[100px] resize-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Botão Texto */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            Texto do Botão
          </label>
          <input 
            type="text" 
            value={data.buttonText}
            onChange={e => setData({ ...data, buttonText: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>

        {/* Botão Link */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
            <LinkIcon className="w-3 h-3" /> Link do Botão
          </label>
          <input 
            type="text" 
            value={data.buttonLink}
            onChange={e => setData({ ...data, buttonLink: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Background Image */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
          <ImageIcon className="w-3 h-3" /> URL da Imagem de Fundo (Opcional)
        </label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={data.backgroundImage}
            onChange={e => setData({ ...data, backgroundImage: e.target.value })}
            placeholder="https://exemplo.com/imagem.jpg"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all font-medium"
          />
          {data.backgroundImage && (
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
              <img src={data.backgroundImage} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-white/20 italic">Recomendado: 1920x600px ou superior. Deixe em branco para usar o gradiente padrão.</p>
      </div>

      <div className="pt-6 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-3xl font-bold transition-all shadow-xl shadow-blue-600/30 active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Configurações
        </button>
      </div>
    </form>
  )
}
