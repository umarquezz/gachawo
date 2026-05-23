import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import getEfiPay from '@/lib/efi'

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const admin = supabaseAdmin()

    // 1. Buscar o pedido
    const { data: order, error } = await admin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (order.status === 'paid') {
      const { data: cred } = await admin.from('credentials').select('*').eq('id', order.credential_id).single()
      return NextResponse.json({ status: 'paid', credential: cred })
    }

    if (!order.efi_txid) {
      return NextResponse.json({ error: 'Pedido sem txid da Efí' }, { status: 400 })
    }

    // 2. Consultar a Efí Bank diretamente para ver se foi pago (Fallback do Webhook)
    try {
      const efi = getEfiPay()
      // @ts-ignore
      const params = { txid: order.efi_txid }
      const chargeDetail = await efi.pixDetailCharge(params)
      
      console.log(`[Force Check] Status na Efí para txid ${order.efi_txid}:`, chargeDetail.status)

      if (chargeDetail.status === 'CONCLUIDA') {
        console.log(`[Force Check] Pagamento concluído na Efí! Atualizando pedido ${orderId}...`)

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
          await admin.from('credentials').update({ sold: true, order_id: order.id }).eq('id', credentialId)
          await admin.from('orders').update({
            status: 'paid',
            credential_id: credentialId,
            paid_at: new Date().toISOString(),
          }).eq('id', order.id)
          
          const { data: cred } = await admin.from('credentials').select('*').eq('id', credentialId).single()
          return NextResponse.json({ status: 'paid', credential: cred })
        } else {
          await admin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id)
          return NextResponse.json({ status: 'paid', warning: 'Sem estoque' })
        }
      } else {
        return NextResponse.json({ status: 'pending', efi_status: chargeDetail.status })
      }
    } catch (efiError) {
      console.error('[Force Check] Erro na consulta Efí:', efiError)
      return NextResponse.json({ error: 'Erro ao consultar o banco Efí' }, { status: 502 })
    }

  } catch (err) {
    console.error('[Force Check] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
