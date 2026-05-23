import { supabaseAdmin } from '@/lib/supabase'
import { SafeProductForm } from '../SafeProductForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getProduct(id: string) {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_categories (
        category_id
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

async function getCategories() {
  const supabase = supabaseAdmin()
  const { data } = await supabase.from('categories').select('id, name').order('name')
  return data || []
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories()
  ])

  if (!product) notFound()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Editar Produto</h2>
        <p className="text-white/40 text-sm">Atualize os detalhes de {product.name}.</p>
      </div>

      <SafeProductForm initialData={product} categories={categories} />
    </div>
  )
}
