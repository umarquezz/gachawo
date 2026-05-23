import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorySlug = searchParams.get('category')
  
  const admin = supabaseAdmin()
  
  if (categorySlug) {
    const { data, error } = await admin
      .from('products_with_stock')
      .select(`
        *,
        product_categories!inner (
          categories!inner (
            slug
          )
        )
      `)
      .eq('active', true)
      .eq('product_categories.categories.slug', categorySlug)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await admin
    .from('products_with_stock')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Supabase query error:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
  return NextResponse.json(data)
}
