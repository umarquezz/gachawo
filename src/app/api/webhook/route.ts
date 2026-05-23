import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Webhook] Recebido:', JSON.stringify(body, null, 2))

    const admin = supabaseAdmin()

    // --- IDENTIFICAR ORIGEM DO WEBHOOK ---

    // 1. Caso seja Efí Bank (Pix)
    // Payload: { "pix": [{ "txid": "...", ... }] }
    if (body.pix && Array.isArray(body.pix)) {
      console.log('[Webhook] Detectado payload da Efí Bank')
      for (const pix of body.pix) {
        const txid = pix.txid
        if (!txid) continue

        const { data: order } = await admin
          .from('orders')
          .select('*')
          .eq('efi_txid', txid)
          .single()

        if (order && order.status !== 'paid') {
          // Processar como pago (Reutilizando a lógica do webhook/efi)
          await processOrderPayment(admin, order)
        }
      }
      return NextResponse.json({ received: true })
    }

    // 2. Caso seja Amplo Pay (Sistema antigo)
    // Payload: { event: 'TRANSACTION_PAID', transaction: { ... } }
    const event = body.event
    const transaction = body.transaction || body
    const externalId = transaction?.externalId || transaction?.external_id

    if ((event === 'TRANSACTION_PAID' || transaction?.status === 'COMPLETED') && externalId) {
      console.log('[Webhook] Detectado payload da Amplo Pay')
      const { data: order } = await admin
        .from('orders')
        .select('*')
        .eq('id', externalId)
        .single()

      if (order && order.status !== 'paid') {
        await processOrderPayment(admin, order)
      }
      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true, info: 'Nenhum processador compatível encontrado' })
  } catch (err) {
    console.error('[Webhook Error]:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// Função auxiliar para evitar duplicação de lógica
async function processOrderPayment(admin: any, order: any) {
  console.log(`[Webhook] Processando pagamento para pedido ${order.id}...`)
  
  let credentialId = order.credential_id
  if (!credentialId) {
    const { data: fallbackCred } = await admin
      .from('credentials')
      .select('id')
      .eq('product_id', order.product_id)
      .eq('sold', false)
      .limit(1)
      .single()
    credentialId = fallbackCred?.id
  }

  if (credentialId) {
    // Marcar credencial como vendida
    await admin.from('credentials').update({ sold: true, order_id: order.id }).eq('id', credentialId)
    // Atualizar pedido
    await admin.from('orders').update({
      status: 'paid',
      credential_id: credentialId,
      paid_at: new Date().toISOString(),
    }).eq('id', order.id)
    console.log(`[Webhook] Pedido ${order.id} finalizado com sucesso.`)
  } else {
    console.error(`[Webhook] Falha ao processar pedido ${order.id}: Sem estoque disponível.`)
    await admin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id)
  }
}
