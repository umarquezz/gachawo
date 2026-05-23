import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { CollectionProductManager } from '../../CollectionProductManager'

export const dynamic = 'force-dynamic'

async function getCollectionData(id: string) {
  const supabase = supabaseAdmin()
  
  const [collectionRes, allProductsRes, currentRelRes] = await Promise.all([
    supabase.from('categories').select('*').eq('id', id).single(),
    supabase.from('products').select('id, name, price_brl, image_url').order('name'),
    supabase.from('product_categories').select('product_id').eq('category_id', id).order('sort_order', { ascending: true })
  ])

  if (collectionRes.error || !collectionRes.data) return null

  return {
    collection: collectionRes.data,
    allProducts: allProductsRes.data || [],
    currentIds: currentRelRes.data?.map(r => r.product_id) || []
  }
}

export default async function CollectionProductsPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const data = await getCollectionData(id)

  if (!data) notFound()

  return (
    <div className="max-w-7xl mx-auto">
      <CollectionProductManager 
        collection={data.collection}
        allProducts={data.allProducts}
        currentIds={data.currentIds}
      />
    </div>
  )
}
