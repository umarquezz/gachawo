// =====================================================
// EDGE FUNCTION: GGCheckout Webhook Handler
// Endpoint: https://[PROJECT_ID].supabase.co/functions/v1/ggcheckout
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Status mapping from GGCheckout to our system
const STATUS_MAPPING: Record<string, string> = {
  'paid': 'completed',
  'approved': 'completed',
  'completed': 'completed',
  'pending': 'pending',
  'cancelled': 'cancelled',
  'canceled': 'cancelled',
  'failed': 'failed',
  'refunded': 'cancelled',
}

interface WebhookPayload {
  // Direct fields (old format compatibility)
  transaction_id?: string
  order_id?: string
  external_id?: string
  status?: string
  product_id?: string
  user_id?: string
  customer_email?: string
  customer_name?: string
  customer_document?: string
  customer_phone?: string
  amount?: number
  currency?: string
  event?: string
  signature?: string
  
  // Nested GGCheckout format
  payment?: {
    id: string
    status: string
    amount: number
    method: string
  }
  customer?: {
    email: string
    name: string
    document: string
    phone: string
  }
  products?: Array<{
    id: string
    name: string
    price: number
  }>
  product?: {
    id: string
    title: string
    price: number
  }
  
  [key: string]: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  const startTime = Date.now()
  let webhookLogId: string | null = null

  try {
    // Parse request body (store raw for signature validation)
    const rawBody = await req.text()
    const payload: WebhookPayload = JSON.parse(rawBody)

    // DEFENSIVE LOGGING - Headers
    console.log('📥 Webhook received - Headers:', {
      'content-type': req.headers.get('content-type'),
      'x-signature': req.headers.get('x-signature') ? '***EXISTS***' : 'MISSING',
      'user-agent': req.headers.get('user-agent'),
    })

    // DEFENSIVE LOGGING - Payload structure
    console.log('📥 Webhook received - Payload keys:', Object.keys(payload))
    console.log('📥 Webhook received - Payload data:', {
      event: payload.event,
      // Direct fields
      transaction_id: payload.transaction_id,
      order_id: payload.order_id,
      external_id: payload.external_id,
      status: payload.status,
      product_id: payload.product_id,
      customer_email: payload.customer_email,
      amount: payload.amount,
      // Nested fields
      payment_id: payload.payment?.id,
      payment_status: payload.payment?.status,
      payment_amount: payload.payment?.amount,
      customer_nested_email: payload.customer?.email,
      customer_nested_name: payload.customer?.name,
      product_nested_id: payload.product?.id,
      products_array_length: payload.products?.length,
      products_first_id: payload.products?.[0]?.id,
      timestamp: new Date().toISOString()
    })    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. LOG WEBHOOK (always, even if processing fails)
    webhookLogId = await logWebhook(supabase, payload)

    // 2. VALIDATE PAYLOAD
    const validation = validatePayload(payload)
    if (!validation.valid) {
      console.error('❌ Invalid payload:', validation.errors)
      
      await updateWebhookLog(supabase, webhookLogId, false, validation.errors.join('; '))
      
      // Return 200 to avoid retries (invalid payload won't fix itself)
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid payload',
          details: validation.errors 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. VALIDATE SIGNATURE (if secret is configured)
    const webhookSecret = Deno.env.get('GGCHECKOUT_WEBHOOK_SECRET')
    const receivedSignature = req.headers.get('x-signature') || payload.signature
    
    if (webhookSecret && receivedSignature) {
      const isValid = await validateSignature(rawBody, receivedSignature, webhookSecret)
      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        
        await updateWebhookLog(supabase, webhookLogId, false, 'invalid_signature')
        
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      console.log('✅ Signature validated successfully')
    } else if (webhookSecret && !receivedSignature) {
      console.warn('⚠️ GGCHECKOUT_WEBHOOK_SECRET configured but no signature received')
    }

    // 4. NORMALIZE PAYLOAD (support both direct and nested formats)
    console.log('🔄 Step 4: Normalizing payload...')
    const externalId = payload.transaction_id || payload.order_id || payload.external_id || payload.payment?.id
    if (!externalId) {
      const error = 'Missing transaction_id, order_id, external_id or payment.id in payload'
      console.error('❌ Step 4 FAILED:', error)
      throw new Error(error)
    }
    console.log('✅ Step 4: externalId =', externalId)

    // Get status from nested or direct field
    const rawStatus = payload.payment?.status || payload.status
    if (!rawStatus) {
      const error = 'Missing status field in payload'
      console.error('❌ Step 4 FAILED:', error)
      throw new Error(error)
    }
    console.log('✅ Step 4: rawStatus =', rawStatus)

    // 5. NORMALIZE STATUS
    console.log('🔄 Step 5: Normalizing status...')
    const normalizedStatus = STATUS_MAPPING[rawStatus.toLowerCase()] || 'pending'
    console.log('✅ Step 5: normalizedStatus =', normalizedStatus)
    
    // Extract fields from nested or direct format
    console.log('🔄 Step 5b: Extracting fields...')
    const productId = payload.product_id || payload.product?.id || payload.products?.[0]?.id || '50k'
    const customerEmail = payload.customer_email || payload.customer?.email
    const customerName = payload.customer_name || payload.customer?.name
    const customerDocument = payload.customer_document || payload.customer?.document
    const customerPhone = payload.customer_phone || payload.customer?.phone
    const amount = payload.amount || payload.payment?.amount || payload.product?.price
    
    console.log('✅ Step 5b: Extracted fields:', {
      externalId,
      rawStatus,
      normalizedStatus,
      productId,
      customerEmail,
      customerName,
      amount
    })

    // 6. PROCESS ORDER
    console.log('🔄 Step 6: Processing order...')
    const result = await processOrder(supabase, {
      externalId,
      status: normalizedStatus,
      productId,
      userId: payload.user_id,
      customerEmail,
      customerName,
      customerDocument,
      customerPhone,
      amount,
      currency: payload.currency || 'BRL',
      webhookPayload: payload
    })
    console.log('✅ Step 6: Order processed:', result)

    // 7. UPDATE WEBHOOK LOG
    console.log('🔄 Step 7: Updating webhook log...')
    await updateWebhookLog(supabase, webhookLogId, true, null, result.orderId)
    console.log('✅ Step 7: Webhook log updated')

    const processingTime = Date.now() - startTime
    console.log(`✅ Webhook processed successfully in ${processingTime}ms:`, {
      orderId: result.orderId,
      isNew: result.isNew,
      status: result.status
    })

    // 8. RETURN SUCCESS
    return new Response(
      JSON.stringify({ 
        ok: true,
        order_id: result.orderId,
        status: result.status,
        message: result.message,
        processing_time_ms: processingTime
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    // DEFENSIVE LOGGING - Detailed error
    console.error('💥 Webhook processing error - Type:', error?.constructor?.name)
    console.error('💥 Webhook processing error - Message:', error?.message || String(error))
    console.error('💥 Webhook processing error - Stack:', error?.stack)
    
    const errorMessage = error?.message || String(error)
    const errorDetails = {
      type: error?.constructor?.name || 'Unknown',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }
    
    console.error('💥 Error details:', errorDetails)

    // Update webhook log with error
    if (webhookLogId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        await updateWebhookLog(
          supabase, 
          webhookLogId, 
          false, 
          `${errorDetails.type}: ${errorMessage}`
        )
        console.log('✅ Webhook log updated with error')
      } catch (logError) {
        console.error('❌ Failed to update webhook log:', logError)
      }
    } else {
      console.error('❌ No webhookLogId - could not save error to database')
    }

    // Return 200 to avoid infinite retries (log the error for manual review)
    return new Response(
      JSON.stringify({ 
        ok: false,
        error: errorDetails.type,
        message: errorMessage,
        details: 'Webhook received but processing failed. Check logs.',
        processing_time_ms: processingTime
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function logWebhook(supabase: any, payload: WebhookPayload): Promise<string> {
  const { data, error } = await supabase
    .from('webhook_logs')
    .insert({
      payload: payload,
      success: false,
      processed_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to log webhook:', error)
    throw new Error('Failed to log webhook')
  }

  return data.id
}

async function updateWebhookLog(
  supabase: any, 
  logId: string, 
  processed: boolean, 
  errorMessage: string | null,
  orderId?: string
): Promise<void> {
  await supabase
    .from('webhook_logs')
    .update({
      processed,
      processing_error: errorMessage,
      order_id: orderId,
      processed_at: new Date().toISOString()
    })
    .eq('id', logId)
}

function validatePayload(payload: WebhookPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check status (support both direct and nested format)
  const hasStatus = payload.status || payload.payment?.status
  if (!hasStatus) {
    errors.push('Missing required field: status or payment.status')
  }

  // Check product_id (support multiple formats)
  const hasProductId = payload.product_id || payload.product?.id || payload.products?.[0]?.id
  if (!hasProductId) {
    errors.push('Missing required field: product_id, product.id or products[0].id')
  }

  // Check transaction ID (support multiple formats)
  const hasTransactionId = payload.transaction_id || payload.order_id || payload.external_id || payload.payment?.id
  if (!hasTransactionId) {
    errors.push('Missing required field: transaction_id, order_id, external_id or payment.id')
  }

  // Validate amount if present (support nested format)
  const amount = payload.amount || payload.payment?.amount || payload.product?.price
  if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
    errors.push('Invalid amount: must be a positive number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

async function validateSignature(
  rawBody: string, 
  receivedSignature: string, 
  secret: string
): Promise<boolean> {
  try {
    // Generate HMAC-SHA256 signature using raw body
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(rawBody)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    // Compare signatures (case-insensitive, handle potential prefix)
    const receivedClean = receivedSignature.toLowerCase().replace(/^sha256=/, '')
    const expectedClean = expectedSignature.toLowerCase()
    
    console.log('🔐 Signature validation:', {
      received: receivedClean.substring(0, 16) + '...',
      expected: expectedClean.substring(0, 16) + '...',
      match: receivedClean === expectedClean
    })
    
    return receivedClean === expectedClean
  } catch (error) {
    console.error('❌ Signature validation error:', error)
    return false
  }
}

interface OrderProcessingParams {
  externalId: string
  status: string
  productId: string
  userId?: string
  customerEmail?: string
  customerName?: string
  customerDocument?: string
  customerPhone?: string
  amount: number
  currency: string
  webhookPayload: WebhookPayload
}

interface OrderProcessingResult {
  orderId: string
  status: string
  isNew: boolean
  message: string
  credentials?: any
}

async function processOrder(
  supabase: any, 
  params: OrderProcessingParams
): Promise<OrderProcessingResult> {
  
  const {
    externalId,
    status,
    productId,
    userId,
    customerEmail,
    customerName,
    customerDocument,
    customerPhone,
    amount,
    currency,
    webhookPayload
  } = params

  // 1. CHECK FOR EXISTING ORDER (IDEMPOTENCY)
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, delivery_status, account_id')
    .eq('external_id', externalId)
    .single()

  if (existingOrder) {
    console.log('🔄 Order already exists (idempotency):', {
      orderId: existingOrder.id,
      status: existingOrder.status
    })

    // If order was already completed, return the existing data
    if (existingOrder.status === 'completed' && existingOrder.delivery_status === 'delivered') {
      return {
        orderId: existingOrder.id,
        status: existingOrder.status,
        isNew: false,
        message: 'Order already processed (idempotent response)'
      }
    }

    // If status changed to completed, try to deliver again
    if (status === 'completed' && existingOrder.status !== 'completed') {
      console.log('📦 Status changed to completed, attempting delivery...')
      return await deliverAccount(supabase, existingOrder.id, productId, userId)
    }

    // Otherwise, just update the status
    await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingOrder.id)

    return {
      orderId: existingOrder.id,
      status,
      isNew: false,
      message: 'Order status updated'
    }
  }

  // 2. CREATE NEW ORDER
  console.log('📝 Creating new order...')
  
  const { data: newOrder, error: createError } = await supabase
    .from('orders')
    .insert({
      external_id: externalId,
      product_id: productId,
      amount,
      currency,
      status,
      customer_email: customerEmail,
      customer_name: customerName,
      raw_payload: webhookPayload,
      delivery_status: 'pending'
    })
    .select('id')
    .single()

  if (createError) {
    console.error('❌ Failed to create order:', createError)
    console.error('❌ Error details:', JSON.stringify(createError, null, 2))
    throw new Error(`Failed to create order: ${createError.message}`)
  }

  console.log('✅ Order created:', newOrder.id)

  // 3. IF PAYMENT IS APPROVED, DELIVER ACCOUNT
  if (status === 'completed') {
    return await deliverAccount(supabase, newOrder.id, productId, userId, customerEmail, customerName)
  }

  // 4. FOR OTHER STATUSES, JUST RETURN
  return {
    orderId: newOrder.id,
    status,
    isNew: true,
    message: `Order created with status: ${status}`
  }
}

async function deliverAccount(
  supabase: any,
  orderId: string,
  productId: string,
  userId?: string,
  customerEmail?: string,
  customerName?: string
): Promise<OrderProcessingResult> {
  
  console.log('🚀 Attempting to deliver account...', { orderId, productId, userId })

  try {
    // Check available stock first
    const { count: stockCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('status', 'available')
      .eq('is_sold', false)
    
    console.log(`📦 Stock check: ${stockCount || 0} accounts available for product_id="${productId}"`)
    
    if (!stockCount || stockCount === 0) {
      console.error(`❌ NO STOCK: product_id="${productId}" has 0 available accounts`)
      
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          delivery_status: 'error',
          error_message: `no_stock_for_product_id: ${productId}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      return {
        orderId,
        status: 'failed',
        isNew: true,
        message: `no_stock_for_product_id: ${productId}`
      }
    }

    // 1. FIND AND CLAIM AVAILABLE ACCOUNT (with atomic update)
    const { data: account, error: claimError } = await supabase
      .from('accounts')
      .select('id, email, password, product_id')
      .eq('product_id', productId)
      .eq('status', 'available')
      .eq('is_sold', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (claimError || !account) {
      console.error('❌ Failed to claim account:', claimError)
      
      // Update order with failure
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          delivery_status: 'error',
          error_message: `Failed to claim account: ${claimError?.message || 'unknown'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      return {
        orderId,
        status: 'failed',
        isNew: true,
        message: 'Failed to claim available account'
      }
    }

    console.log('✅ Account found:', account.id)

    // 2. MARK ACCOUNT AS SOLD (atomic update)
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        status: 'sold',
        is_sold: true,
        sold_at: new Date().toISOString(),
        sold_to: userId || null
      })
      .eq('id', account.id)
      .eq('status', 'available') // Double-check it's still available

    if (updateError) {
      console.error('Failed to mark account as sold:', updateError)
      throw new Error(`Failed to claim account: ${updateError.message}`)
    }

    console.log('✅ Account claimed successfully')

    // 3. UPDATE ORDER WITH ACCOUNT AND MARK AS DELIVERED
    await supabase
      .from('orders')
      .update({
        status: 'completed',
        delivery_status: 'delivered',
        account_id: account.id,
        delivered_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    console.log('✅ Order completed and account delivered')

    // Send email notification with credentials
    if (customerEmail) {
      try {
        await sendEmailWithCredentials(customerEmail, customerName, {
          email: account.email,
          password: account.password,
          productName: productId
        })
        console.log('📧 Email sent successfully to:', customerEmail)
      } catch (emailError) {
        console.error('📧 Failed to send email (non-blocking):', emailError)
        // Don't throw - email failure shouldn't block the delivery
      }
    }

    return {
      orderId,
      status: 'completed',
      isNew: true,
      message: 'Order completed and account delivered',
      credentials: { email: account.email, password: account.password }
    }

  } catch (error) {
    console.error('💥 Error during account delivery:', error)

    // Update order with error
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        delivery_status: 'error',
        error_message: error.message || String(error),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    throw error
  }
}

// =====================================================
// EMAIL DELIVERY FUNCTION
// =====================================================

async function sendEmailWithCredentials(
  customerEmail: string,
  customerName: string | undefined,
  credentials: { email: string; password: string; productName: string }
): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY not configured - skipping email')
    return
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .credential-row { margin: 10px 0; }
        .label { font-weight: bold; color: #667eea; }
        .value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-left: 10px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Sua Compra Foi Aprovada!</h1>
        </div>
        <div class="content">
          <p>Olá${customerName ? ' ' + customerName : ''}! 👋</p>
          
          <p>Sua compra foi processada com sucesso! Abaixo estão as credenciais da sua conta:</p>
          
          <div class="credentials">
            <h3>🔑 Credenciais de Acesso</h3>
            <div class="credential-row">
              <span class="label">📧 Email:</span>
              <span class="value">${credentials.email}</span>
            </div>
            <div class="credential-row">
              <span class="label">🔐 Senha:</span>
              <span class="value">${credentials.password}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Guarde essas credenciais em local seguro. Por questões de segurança, não enviaremos novamente por email.
          </div>

          <p>Se tiver qualquer dúvida ou problema, entre em contato conosco.</p>
          
          <p>Aproveite! 🎮</p>
        </div>
        <div class="footer">
          <p>Este é um email automático. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Entrega Automática <onboarding@resend.dev>', // Mude depois para seu domínio
      to: [customerEmail],
      subject: '🎉 Suas Credenciais - Compra Aprovada',
      html: emailHtml,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  const result = await response.json()
  console.log('📧 Email sent via Resend:', result)
}
