'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  X, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon, 
  Gamepad2,
  AlertCircle,
  Apple,
  Smartphone as AndroidIcon,
  Monitor,
  Smartphone
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { saveProduct } from './actions'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
}

interface ProductFormProps {
  initialData?: any
  categories: Category[]
}

const PLATFORMS = [
  { id: 'pc', name: 'PC', icon: Monitor, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'ps3', name: 'PS3', icon: Gamepad2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'ps4', name: 'PS4', icon: Gamepad2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'ps5', name: 'PS5', icon: Gamepad2, color: 'text-blue-300', bg: 'bg-blue-300/10' },
  { id: 'xbox-one', name: 'Xbox One', icon: Gamepad2, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'xbox-series', name: 'Xbox Series', icon: Gamepad2, color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 'ios', name: 'IOS', icon: Apple, color: 'text-white', bg: 'bg-white/10' },
  { id: 'android', name: 'Android', icon: AndroidIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
]

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(initialData?.image_url || '')

  const [priceOriginal, setPriceOriginal] = useState(initialData?.price_original_brl ? (initialData.price_original_brl / 100).toString() : '')
  const [priceSale, setPriceSale] = useState(initialData?.price_brl ? (initialData.price_brl / 100).toString() : '')
  const [discount, setDiscount] = useState(0)

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.product_categories?.map((pc: any) => pc.category_id) || []
  )
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialData?.platforms || []
  )
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcular desconto automaticamente
  useEffect(() => {
    const original = parseFloat(priceOriginal)
    const sale = parseFloat(priceSale)
    if (original && sale && original > sale) {
      const diff = original - sale
      const percent = Math.round((diff / original) * 100)
      setDiscount(percent)
    } else {
      setDiscount(0)
    }
  }, [priceOriginal, priceSale])

  if (!mounted) return null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Apenas JPG, PNG ou WEBP são permitidos.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.')
      return
    }

    setUploading(true)
    
    // Sanitize filename
    const sanitizedName = file.name
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9.-]/g, '-') // Replace special chars and spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens
      .toLowerCase()

    const fileName = `${Date.now()}-${sanitizedName}`
    const { error: uploadError } = await supabase.storage.from('store_assets').upload(`products/${fileName}`, file)

    if (uploadError) {
      alert('Erro ao subir imagem.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('store_assets').getPublicUrl(`products/${fileName}`)
    setImagePreview(publicUrl)
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validação de preço
    const original = parseFloat(priceOriginal)
    const sale = parseFloat(priceSale)
    if (original && sale && original <= sale) {
      alert('O Preço Original deve ser maior que o Preço de Venda.')
      return
    }

    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('image_url', imagePreview)
    formData.append('categories', JSON.stringify(selectedCategories))
    formData.append('platforms', JSON.stringify(selectedPlatforms))
    if (initialData?.id) formData.append('id', initialData.id)

    try {
      await saveProduct(formData)
      router.push('/admin/products')
      router.refresh()
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button 
          type="submit" 
          disabled={loading || uploading}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {initialData ? 'Salvar Alterações' : 'Criar Produto'}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Básicos */}
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-8 space-y-6">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Nome do Produto</label>
              <input name="name" defaultValue={initialData?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all font-medium" />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Descrição</label>
              <textarea name="description" defaultValue={initialData?.description} rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500 transition-all text-sm" />
            </div>

            {/* Precificação Avançada */}
            <div className="grid sm:grid-cols-2 gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center justify-between">
                  Preço Original (R$)
                  <span className="text-[10px] lowercase font-normal italic">Preço riscado</span>
                </label>
                <input 
                  name="price_original" 
                  type="number" 
                  step="0.01" 
                  value={priceOriginal}
                  onChange={e => setPriceOriginal(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono outline-none focus:border-white/20 transition-all" 
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center justify-between">
                  Preço de Venda (R$)
                  {discount > 0 && <span className="text-emerald-400 font-bold">{discount}% OFF</span>}
                </label>
                <input 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  value={priceSale}
                  onChange={e => setPriceSale(e.target.value)}
                  required 
                  className="w-full bg-white/10 border border-purple-500/30 rounded-xl p-4 text-white font-mono outline-none focus:border-purple-500 transition-all shadow-inner" 
                  placeholder="0,00"
                />
              </div>

              {parseFloat(priceOriginal) > 0 && parseFloat(priceOriginal) <= parseFloat(priceSale) && (
                <div className="col-span-full flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse pt-2">
                  <AlertCircle className="w-4 h-4" /> Erro: O preço original deve ser maior que o de venda.
                </div>
              )}
            </div>
          </div>

          {/* Plataformas */}
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-8">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Plataformas Disponíveis</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATFORMS.map(plat => {
                const isSelected = selectedPlatforms.includes(plat.id)
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) setSelectedPlatforms(selectedPlatforms.filter(id => id !== plat.id))
                      else setSelectedPlatforms([...selectedPlatforms, plat.id])
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center gap-2",
                      isSelected
                        ? `border-purple-500 bg-purple-500/10 ${plat.color}`
                        : "bg-white/5 border-white/10 text-white/20 hover:border-white/20 hover:text-white/60"
                    )}
                  >
                    <plat.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{plat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lateral */}
        <div className="space-y-6">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-8">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Imagem de Capa</label>
            <div 
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={cn(
                "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative",
                imagePreview ? "border-white/10" : "border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5"
              )}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                 <ImageIcon className="w-10 h-10 text-white/5" />
              )}
              {uploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          </div>

          <div className="bg-[#111118] border border-white/5 rounded-2xl p-8">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Múltiplas Coleções</label>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (selectedCategories.includes(cat.id)) setSelectedCategories(selectedCategories.filter(id => id !== cat.id))
                    else setSelectedCategories([...selectedCategories, cat.id])
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between",
                    selectedCategories.includes(cat.id)
                      ? "bg-purple-600/10 border-purple-500/50 text-purple-400"
                      : "bg-white/5 border-white/10 text-white/30 hover:border-white/20"
                  )}
                >
                  {cat.name}
                  {selectedCategories.includes(cat.id) && <X className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
