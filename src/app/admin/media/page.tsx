'use client'
import { useState, useEffect, useRef } from 'react'
import { 
  Upload, 
  Search, 
  Grid, 
  List, 
  FolderPlus, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Check, 
  Image as ImageIcon,
  MoreVertical,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function AdminMediaPage() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = async () => {
    setLoading(true)
    const { data, error } = await supabase.storage
      .from('store_assets')
      .list('products', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error(error)
    } else {
      // Get public URLs
      const filesWithUrls = data.map(f => ({
        ...f,
        publicUrl: supabase.storage.from('store_assets').getPublicUrl(`products/${f.name}`).data.publicUrl
      }))
      setFiles(filesWithUrls)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const fileName = `${Date.now()}-${file.name}`
      await supabase.storage.from('store_assets').upload(`products/${fileName}`, file)
    }
    setUploading(false)
    fetchFiles()
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const deleteFile = async (name: string) => {
    if (!confirm('Excluir esta imagem permanentemente?')) return
    const { error } = await supabase.storage.from('store_assets').remove([`products/${name}`])
    if (!error) fetchFiles()
  }

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Galeria de Mídia</h2>
          <p className="text-white/40 text-sm">Organize e gerencie as imagens da sua loja.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-bold transition-all border border-white/10 text-sm">
            <FolderPlus className="w-5 h-5" /> Nova Pasta
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95 text-sm"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            Fazer Upload
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            multiple 
            className="hidden" 
            accept="image/*"
          />
        </div>
      </div>

      <div className="bg-[#111118] border border-white/5 rounded-2xl flex-1 flex flex-col min-h-[600px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Buscar por nome do arquivo..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all font-medium"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              <button className="p-2 bg-purple-600 text-white rounded-md shadow-lg shadow-purple-600/20"><Grid className="w-4 h-4" /></button>
              <button className="p-2 text-white/20 hover:text-white transition-all"><List className="w-4 h-4" /></button>
            </div>
            <div className="h-6 w-px bg-white/5"></div>
            <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-all">
              <Filter className="w-4 h-4" /> Recentes
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="p-8 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Carregando galeria...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {files.map((file) => (
                <div key={file.id} className="group relative">
                  <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden group-hover:border-purple-500/50 transition-all relative">
                    <img src={file.publicUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <button 
                        onClick={() => copyToClipboard(file.publicUrl)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-purple-600 transition-all text-white border border-white/10"
                        title="Copiar URL"
                      >
                        {copiedUrl === file.publicUrl ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <div className="flex gap-2">
                        <a 
                          href={file.publicUrl} 
                          target="_blank" 
                          className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white border border-white/10"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => deleteFile(file.name)}
                          className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-red-500 transition-all text-white border border-white/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-white/30 truncate font-mono text-center group-hover:text-white transition-colors">
                    {file.name}
                  </p>
                </div>
              ))}
              
              {files.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/20">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
                  <p className="text-sm">Sua galeria está vazia.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
