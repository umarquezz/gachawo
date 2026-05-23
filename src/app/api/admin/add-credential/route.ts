import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/utils/admin'

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { type, product_id, email, password, key_value } = await req.json()

    if (!type || !product_id) {
      return NextResponse.json({ error: 'type e product_id são obrigatórios' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const { error } = await admin.from('credentials').insert({
      type,
      product_id,
      email: email || null,
      password: password || null,
      key_value: key_value || null,
      sold: false,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
