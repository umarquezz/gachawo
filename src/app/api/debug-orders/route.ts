import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Rota de diagnóstico - verificar estado dos pedidos recentes
 * Acesse: /api/debug-orders para ver o estado
 */
export async function GET(req: NextRequest) {
  const admin = supabaseAdmin()

  // Buscar os 10 pedidos mais recentes com todos os dados
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, status, efi_txid, credential_id, paid_at, created_at, product_id, buyer_email')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Para cada pedido pago, verificar se a credencial existe no banco
  const ordersWithCredCheck = await Promise.all(
    (orders || []).map(async (order: any) => {
      let credentialData = null
      if (order.credential_id) {
        const { data: cred } = await admin
          .from('credentials')
          .select('id, type, email, sold')
          .eq('id', order.credential_id)
          .single()
        credentialData = cred
      }
      return {
        ...order,
        credential_check: credentialData,
        issues: [
          !order.efi_txid && '⚠️ SEM efi_txid (PIX não foi salvo)',
          order.status === 'paid' && !order.credential_id && '🔴 PAGO SEM CREDENTIAL_ID',
          order.status === 'paid' && order.credential_id && !credentialData && '🔴 CREDENTIAL_ID INVÁLIDO (não encontrada no banco)',
          order.status === 'pending' && order.efi_txid && '🟡 PENDENTE com txid (webhook não chegou ainda)',
        ].filter(Boolean)
      }
    })
  )

  return NextResponse.json({
    total: ordersWithCredCheck.length,
    orders: ordersWithCredCheck,
    timestamp: new Date().toISOString()
  }, {
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * POST: Forçar processamento manual de um pedido pelo txid
 * Body: { txid: "..." } ou { order_id: "..." }
 */
export async function POST(req: NextRequest) {
  const { txid, order_id } = await req.json()
  const admin = supabaseAdmin()

  let order: any = null

  if (txid) {
    const { data } = await admin.from('orders').select('*').eq('efi_txid', txid).single()
    order = data
  } else if (order_id) {
    const { data } = await admin.from('orders').select('*').eq('id', order_id).single()
    order = data
  }

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  }

  if (order.status === 'paid') {
    return NextResponse.json({ message: 'Pedido já está pago', order })
  }

  // Verificar/buscar credencial disponível
  let credentialId = order.credential_id

  if (!credentialId) {
    const { data: cred } = await admin
      .from('credentials')
      .select('id')
      .eq('product_id', order.product_id)
      .eq('sold', false)
      .limit(1)
      .single()
    credentialId = cred?.id
  }

  if (!credentialId) {
    return NextResponse.json({ error: 'Nenhuma credencial disponível para este produto' }, { status: 409 })
  }

  // Marcar credencial como vendida
  await admin.from('credentials').update({ sold: true, order_id: order.id }).eq('id', credentialId)

  // Marcar pedido como pago
  const { error: updateError } = await admin
    .from('orders')
    .update({ status: 'paid', credential_id: credentialId, paid_at: new Date().toISOString() })
    .eq('id', order.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, order_id: order.id, credential_id: credentialId })
}
