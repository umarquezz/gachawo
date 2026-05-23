'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function addKeysBatch(productId: string, keys: string[]) {
  const supabase = supabaseAdmin()
  
  const credentials = keys.map(keyValue => ({
    product_id: productId,
    type: 'key',
    key_value: keyValue,
    sold: false
  }))

  const { error } = await supabase
    .from('credentials')
    .insert(credentials)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/keys')
  return { success: true }
}

export async function deleteKey(id: string) {
  const supabase = supabaseAdmin()
  const { error } = await supabase
    .from('credentials')
    .delete()
    .eq('id', id)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/keys')
  return { success: true }
}
