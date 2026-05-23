import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Webhook da Efí Bank (Pix)
 * 
 * A Efí envia uma notificação POST para esta rota assim que um Pix é confirmado.
 * Formato do payload: { "pix": [{ "txid": "...", "endToEndId": "...", "valor": "...", "horario": "...", ... }] }
 * 
 * Para ativar, configure a URL do webhook no painel da Efí:
 * https://sua-url.com/api/webhook/efi
 * 
 * ⚠️ A Efí valida conexão mTLS. Em produção, certifique-se que o servidor aceita o certificado da Efí.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Efí Webhook] Recebido:', JSON.stringify(body, null, 2))

    // A Efí envia um array de transações Pix confirmadas
    const pixNotifications = body?.pix

    if (!pixNotifications || !Array.isArray(pixNotifications) || pixNotifications.length === 0) {
      // Pode ser uma notificação de teste/handshake da Efí
      console.log('[Efí Webhook] Payload sem dados Pix - possivelmente um handshake de validação.')
      return NextResponse.json({ received: true })
    }

    const admin = supabaseAdmin()

    for (const pix of pixNotifications) {
      const txid = pix.txid

      if (!txid) {
        console.warn('[Efí Webhook] Notificação Pix sem txid:', pix)
        continue
      }

      console.log(`[Efí Webhook] Processando txid: ${txid}`)

      // Buscar o pedido pelo txid salvo na hora da criação
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('*')
        .eq('efi_txid', txid)
        .single()

      if (orderError || !order) {
        console.error(`[Efí Webhook] Pedido NÃO ENCONTRADO no banco para txid: ${txid}. Verifique se o txid está correto.`)
        continue
      }

      console.log(`[Efí Webhook] Pedido encontrado: ID ${order.id}, Status Atual: ${order.status}`)

      // Ignorar se já foi processado
      if (order.status === 'paid') {
        console.log(`[Efí Webhook] Pedido ${order.id} já está pago. Ignorando.`)
        continue
      }

      // 1. Identificar a credencial (preferência pela que já está no pedido)
      let credentialId = order.credential_id

      // Fallback: Se não tiver credencial no pedido, buscar uma disponível do mesmo produto
      if (!credentialId) {
        console.warn(`[Efí Webhook] Pedido ${order.id} sem credencial_id. Buscando fallback...`)
        const { data: fallbackCred } = await admin
          .from('credentials')
          .select('id')
          .eq('product_id', order.product_id)
          .eq('sold', false)
          .limit(1)
          .single()
        
        credentialId = fallbackCred?.id
      }

      if (!credentialId) {
        console.error(`[Efí Webhook] ERRO CRÍTICO: Cliente pagou pedido ${order.id} mas não há estoque disponível!`)
        // Marcamos como pago para registro financeiro, mas sem credencial (entrega manual necessária)
        await admin
          .from('orders')
          .update({ 
            status: 'paid', 
            paid_at: new Date().toISOString(),
            notes: 'PAGO SEM ESTOQUE - ENTREGA MANUAL NECESSÁRIA'
          })
          .eq('id', order.id)
        continue
      }

      console.log(`[Efí Webhook] Vinculando credencial ${credentialId} ao pedido ${order.id}...`)

      // 2. Marcar credencial como vendida e vincular ao pedido
      const { error: credUpdateError } = await admin
        .from('credentials')
        .update({ 
          sold: true, 
          order_id: order.id 
        })
        .eq('id', credentialId)

      if (credUpdateError) {
        console.error(`[Efí Webhook] Erro ao atualizar credencial ${credentialId}:`, credUpdateError)
      }

      // 3. Marcar pedido como pago e garantir o vínculo com a credencial
      const { error: finalUpdateError } = await admin
        .from('orders')
        .update({
          status: 'paid',
          credential_id: credentialId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id)

      if (finalUpdateError) {
        console.error(`[Efí Webhook] Erro final ao atualizar pedido ${order.id}:`, finalUpdateError)
      } else {
        console.log(`[Efí Webhook] ✅ Pedido ${order.id} confirmado com sucesso.`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Efí Webhook] Erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

/**
 * GET é necessário para a Efí validar a URL do webhook (handshake inicial).
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'ok', message: 'Efí Pix Webhook ativo' })
}
