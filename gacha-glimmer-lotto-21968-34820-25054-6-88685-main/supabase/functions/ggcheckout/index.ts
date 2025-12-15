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
  transaction_id?: string
  order_id?: string
  external_id?: string
  status: string
  product_id: string
  user_id?: string
  customer_email?: string
  customer_name?: string
  customer_document?: string
  amount: number
  event?: string
  signature?: string
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
    // Parse webhook payload
    const payload: WebhookPayload = await req.json()
    
    console.log('📨 Webhook received:', {
      transaction_id: payload.transaction_id || payload.order_id || payload.external_id,
      status: payload.status,
      product_id: payload.product_id,
      timestamp: new Date().toISOString()
    })

    // Initialize Supabase client with service role key
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
    if (webhookSecret && payload.signature) {
      const isValid = await validateSignature(payload, webhookSecret)
      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        
        await updateWebhookLog(supabase, webhookLogId, false, 'Invalid signature')
        
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // 4. EXTRACT TRANSACTION ID (try multiple fields)
    const transactionId = payload.transaction_id || payload.order_id || payload.external_id
    if (!transactionId) {
      throw new Error('Missing transaction_id, order_id or external_id in payload')
    }

    // 5. NORMALIZE STATUS
    const normalizedStatus = STATUS_MAPPING[payload.status.toLowerCase()] || 'pending'

    console.log('🔍 Processing transaction:', {
      transactionId,
      status: payload.status,
      normalizedStatus
    })

    // 6. PROCESS ORDER
    const result = await processOrder(supabase, {
      transactionId,
      status: normalizedStatus,
      productId: payload.product_id,
      userId: payload.user_id,
      customerEmail: payload.customer_email,
      customerName: payload.customer_name,
      customerDocument: payload.customer_document,
      amount: payload.amount,
      webhookPayload: payload
    })

    // 7. UPDATE WEBHOOK LOG
    await updateWebhookLog(supabase, webhookLogId, true, null, result.orderId)

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
    console.error('💥 Webhook processing error:', error)

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
          error.message || String(error)
        )
      } catch (logError) {
        console.error('Failed to update webhook log:', logError)
      }
    }

    // Return 200 to avoid infinite retries (log the error for manual review)
    return new Response(
      JSON.stringify({ 
        ok: false,
        error: 'Internal server error',
        message: 'Webhook received but processing failed. Check logs.',
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
      source: 'ggcheckout',
      event_type: payload.event || 'payment',
      payload: payload,
      processed: false
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

  if (!payload.status) {
    errors.push('Missing required field: status')
  }

  if (!payload.product_id) {
    errors.push('Missing required field: product_id')
  }

  if (!payload.transaction_id && !payload.order_id && !payload.external_id) {
    errors.push('Missing required field: transaction_id, order_id or external_id')
  }

  if (payload.amount !== undefined && (typeof payload.amount !== 'number' || payload.amount <= 0)) {
    errors.push('Invalid amount: must be a positive number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

async function validateSignature(payload: WebhookPayload, secret: string): Promise<boolean> {
  // TODO: Implement signature validation based on GGCheckout documentation
  // This is a placeholder - update based on actual GGCheckout signature method
  
  // Example implementation (adjust based on actual GGCheckout method):
  // const expectedSignature = await generateSignature(payload, secret)
  // return expectedSignature === payload.signature
  
  console.warn('⚠️ Signature validation not fully implemented yet')
  return true // For now, accept all (remove this when implementing)
}

interface OrderProcessingParams {
  transactionId: string
  status: string
  productId: string
  userId?: string
  customerEmail?: string
  customerName?: string
  customerDocument?: string
  amount: number
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
    transactionId,
    status,
    productId,
    userId,
    customerEmail,
    customerName,
    customerDocument,
    amount,
    webhookPayload
  } = params

  // 1. CHECK FOR EXISTING ORDER (IDEMPOTENCY)
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status, delivery_status, account_id')
    .eq('transaction_id', transactionId)
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
      transaction_id: transactionId,
      user_id: userId,
      product_id: productId,
      amount,
      status,
      customer_email: customerEmail,
      customer_name: customerName,
      customer_document: customerDocument,
      webhook_payload: webhookPayload,
      delivery_status: 'pending'
    })
    .select('id')
    .single()

  if (createError) {
    console.error('Failed to create order:', createError)
    throw new Error(`Failed to create order: ${createError.message}`)
  }

  console.log('✅ Order created:', newOrder.id)

  // 3. IF PAYMENT IS APPROVED, DELIVER ACCOUNT
  if (status === 'completed') {
    return await deliverAccount(supabase, newOrder.id, productId, userId)
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
  userId?: string
): Promise<OrderProcessingResult> {
  
  console.log('🚀 Attempting to deliver account...', { orderId, productId, userId })

  try {
    // 1. CALL claim_account_stock RPC (with lock)
    const { data: credentials, error: claimError } = await supabase
      .rpc('claim_account_stock', {
        p_product_id: productId,
        p_user_id: userId || null
      })

    if (claimError) {
      console.error('Failed to claim account:', claimError)
      throw new Error(`Failed to claim account: ${claimError.message}`)
    }

    if (!credentials) {
      console.warn('⚠️ No stock available for product:', productId)
      
      // Update order with failure
      await supabase
        .from('orders')
        .update({
          status: 'failed',
          delivery_status: 'failed',
          error_message: 'Out of stock',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      return {
        orderId,
        status: 'failed',
        isNew: true,
        message: 'Order created but out of stock'
      }
    }

    console.log('✅ Account claimed successfully')

    // 2. GET ACCOUNT ID (query the accounts table)
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('product_id', productId)
      .eq('status', 'sold')
      .order('sold_at', { ascending: false })
      .limit(1)
      .single()

    // 3. UPDATE ORDER WITH ACCOUNT AND MARK AS DELIVERED
    await supabase
      .from('orders')
      .update({
        status: 'completed',
        delivery_status: 'delivered',
        account_id: account?.id,
        delivered_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    console.log('✅ Order completed and account delivered')

    // TODO: Send email notification with credentials
    // await sendEmailWithCredentials(customerEmail, credentials)

    return {
      orderId,
      status: 'completed',
      isNew: true,
      message: 'Order completed and account delivered',
      credentials // Consider not returning this in production (security)
    }

  } catch (error) {
    console.error('💥 Error during account delivery:', error)

    // Update order with error
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        delivery_status: 'failed',
        error_message: error.message || String(error),
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    throw error
  }
}
