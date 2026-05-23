import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createImmediatePixCharge } from '@/lib/efi'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado para comprar' }, { status: 401 })
    }

    const { product_id } = await req.json()

    if (!product_id) {
      return NextResponse.json({ error: 'product_id é obrigatório' }, { status: 400 })
    }

    const buyer_email = user.email!
    const admin = supabaseAdmin()

    // 1. Buscar produto
    const { data: product, error: productError } = await admin
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // 2. Tentar reservar uma credencial (atômico)
    // Primeiro criamos o pedido como rascunho
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        product_id,
        buyer_email,
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Erro ao iniciar pedido' }, { status: 500 })
    }

    // Agora vinculamos uma credencial ao pedido de forma atômica
    const { data: credentialId, error: reserveError } = await admin
      .rpc('reserve_credential', { 
        p_product_id: product_id, 
        p_order_id: order.id 
      })

    if (reserveError || !credentialId) {
      // Se não conseguiu reservar, deletamos o pedido rascunho
      await admin.from('orders').delete().eq('id', order.id)
      console.error('Erro de reserva:', reserveError)
      return NextResponse.json({ 
        error: 'Produto sem estoque disponível', 
        details: 'Não há credenciais disponíveis para este produto no momento.' 
      }, { status: 409 })
    }

    // 3. Atualizar o pedido com a credencial reservada
    await admin
      .from('orders')
      .update({ credential_id: credentialId })
      .eq('id', order.id)


    // 4. Criar cobrança PIX na Efí Bank
    try {
      const pixData = await createImmediatePixCharge(order.id, product.price_brl, buyer_email)

      // 5. Atualizar pedido com dados da Efí
      await admin
        .from('orders')
        .update({
          efi_txid: pixData.txid,
          pix_payload: pixData.pixCopiaECola,
          qr_code_image: pixData.qrCodeImage,
        })
        .eq('id', order.id)

      return NextResponse.json({
        order_id: order.id,
        pix_payload: pixData.pixCopiaECola,
        qr_code_image: pixData.qrCodeImage,
      })
    } catch (efiError: any) {
      console.error('Efí Bank full error:', JSON.stringify(efiError, null, 2))
      // Se falhar a criação do PIX, removemos o pedido temporário
      await admin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ 
        error: 'Erro ao gerar cobrança PIX', 
        details: efiError.message || efiError 
      }, { status: 502 })
    }
  } catch (err) {
    console.error('create-order error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

