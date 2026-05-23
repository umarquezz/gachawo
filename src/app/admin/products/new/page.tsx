import { supabaseAdmin } from '@/lib/supabase'
import { SafeProductForm } from '../SafeProductForm'

export const dynamic = 'force-dynamic'

async function getCategories() {
  const supabase = supabaseAdmin()
  const { data } = await supabase.from('categories').select('id, name').order('name')
  return data || []
}

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Novo Produto</h2>
        <p className="text-white/40 text-sm">Adicione um novo item ao seu catálogo.</p>
      </div>

      <SafeProductForm categories={categories} />
    </div>
  )
}
