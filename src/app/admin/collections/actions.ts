'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updateCollectionProducts(collectionId: string, productIds: string[]) {
  const supabase = supabaseAdmin()
  
  // 1. Limpar associações atuais
  const { error: deleteError } = await supabase
    .from('product_categories')
    .delete()
    .eq('category_id', collectionId)
  
  if (deleteError) throw new Error(deleteError.message)

  // 2. Inserir novas associações
  if (productIds.length > 0) {
    const data = productIds.map((pid, index) => ({
      category_id: collectionId,
      product_id: pid,
      sort_order: index
    }))
    
    const { error: insertError } = await supabase
      .from('product_categories')
      .insert(data)
    
    if (insertError) throw new Error(insertError.message)
  }

  revalidatePath('/admin/collections')
  revalidatePath(`/admin/collections/${collectionId}/products`)
  return { success: true }
}

export async function duplicateCollection(id: string) {
  const supabase = supabaseAdmin()
  
  // 1. Buscar dados da original
  const { data: original, error: fetchError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError || !original) throw new Error('Coleção não encontrada')

  // 2. Criar cópia
  const { data: copy, error: copyError } = await supabase
    .from('categories')
    .insert([{
      name: `${original.name} (Cópia)`,
      slug: `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      description: original.description,
      image_url: original.image_url,
      active: false,
      sort_order: (original.sort_order || 0) + 1
    }])
    .select()
    .single()

  if (copyError) throw new Error(copyError.message)

  revalidatePath('/admin/collections')
  return { success: true, newId: copy.id }
}

export async function createCollection(formData: { name: string; slug: string; description?: string; active?: boolean }) {
  const supabase = supabaseAdmin()
  
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      name: formData.name,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      active: formData.active ?? true,
      sort_order: 0
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/collections')
  return { success: true, collection: data }
}

export async function deleteCollection(id: string) {
  const supabase = supabaseAdmin()
  
  // Primeiro remover associações
  await supabase.from('product_categories').delete().eq('category_id', id)
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/collections')
  return { success: true }
}

export async function updateCollection(id: string, formData: { name: string; slug: string; description?: string; active?: boolean }) {
  const supabase = supabaseAdmin()
  
  const { error } = await supabase
    .from('categories')
    .update({
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      active: formData.active
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/collections')
  return { success: true }
}
