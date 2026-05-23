import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = supabaseAdmin()

  const { data: order, error } = await admin
    .from('orders')
    .select('id, status, credential_id, paid_at')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  if (order.status !== 'paid') {
    return NextResponse.json({ status: order.status })
  }

  // Pedido pago: buscar credencial
  const { data: credential } = await admin
    .from('credentials')
    .select('type, email, password, key_value')
    .eq('id', order.credential_id)
    .single()

  return NextResponse.json({
    status: 'paid',
    paid_at: order.paid_at,
    credential,
  })
}
