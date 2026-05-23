'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function saveProduct(formData: FormData) {
  const supabase = supabaseAdmin()
  
  const id = formData.get('id') as string | null
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price_brl = Math.round(parseFloat(formData.get('price') as string) * 100)
  const price_original_brl = formData.get('price_original') 
    ? Math.round(parseFloat(formData.get('price_original') as string) * 100) 
    : null
  const status = formData.get('status') as string
  const image_url = formData.get('image_url') as string
  const categories = JSON.parse(formData.get('categories') as string || '[]') as string[]
  const platforms = JSON.parse(formData.get('platforms') as string || '[]') as string[]

  let productId = id

  const productData = {
    name,
    description,
    price_brl,
    price_original_brl,
    active: status === 'active',
    image_url,
    platforms
  }

  if (id) {
    // Update
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
    
    if (error) throw new Error(error.message)
  } else {
    // Create
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    productId = data.id
  }

  // Update Categories (N:N)
  if (productId) {
    // Clear existing
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', productId)
    
    // Insert new
    if (categories.length > 0) {
      const categoryRelations = categories.map(catId => ({
        product_id: productId,
        category_id: catId
      }))
      await supabase.from('product_categories').insert(categoryRelations)
    }
  }

  revalidatePath('/admin/products')
  revalidatePath('/')
  return { success: true, id: productId }
}

export async function deleteProduct(id: string) {
  try {
    const supabase = supabaseAdmin()
    
    // 1. Verificar se existem vendas (orders) vinculadas
    // IMPORTANTE: Se houver venda, não podemos deletar o produto pois ele é o pai da venda
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id)
    
    if (countError) return { error: 'Erro ao verificar vendas: ' + countError.message }
    
    if (count && count > 0) {
      return { error: 'Este produto já possui vendas no histórico. Por segurança, você deve apenas desativá-lo (Status: Inativo) para que ele suma da loja, mas continue no seu registro de vendas.' }
    }

    // 2. Limpar o estoque (credentials) vinculado
    await supabase
      .from('credentials')
      .delete()
      .eq('product_id', id)

    // 3. Limpar categorias vinculadas
    await supabase
      .from('product_categories')
      .delete()
      .eq('product_id', id)

    // 4. Excluir o produto de fato
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) {
      return { error: 'Erro ao excluir do banco: ' + error.message }
    }
    
    revalidatePath('/admin/products')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: 'Erro inesperado: ' + err.message }
  }
}

export async function updateProductStatus(id: string, status: 'active' | 'inactive') {
  const supabase = supabaseAdmin()
  const { error } = await supabase
    .from('products')
    .update({ active: status === 'active' })
    .eq('id', id)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/products')
  revalidatePath('/') 
  return { success: true }
}
