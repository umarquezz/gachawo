-- =====================================================
-- QUERIES DE DEBUG PARA WEBHOOK GGCHECKOUT
-- =====================================================

-- 1. VER ÚLTIMO WEBHOOK RECEBIDO COM ERRO
SELECT 
  id,
  created_at,
  success,
  error_message,
  payload->>'event' as event,
  payload->'payment'->>'id' as payment_id,
  payload->'payment'->>'status' as payment_status,
  payload->'customer'->>'email' as customer_email,
  payload->'product'->>'id' as product_id,
  jsonb_pretty(payload) as payload_completo
FROM webhook_logs 
WHERE success = false
ORDER BY created_at DESC 
LIMIT 1;

-- 2. VER TODOS OS WEBHOOKS DAS ÚLTIMAS 24H
SELECT 
  created_at,
  success,
  error_message,
  payload->>'event' as event,
  payload->'payment'->>'id' as payment_id,
  payload->'customer'->>'email' as customer_email
FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 3. VER ÚLTIMO PEDIDO CRIADO
SELECT 
  id,
  external_id,
  status,
  delivery_status,
  customer_email,
  customer_name,
  product_id,
  account_id,
  error_message,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;

-- 4. VER PEDIDOS DE UM EMAIL ESPECÍFICO
-- (SUBSTITUA O EMAIL)
SELECT 
  o.id,
  o.external_id,
  o.status,
  o.delivery_status,
  o.customer_email,
  o.product_id,
  o.account_id,
  a.email as conta_entregue_email,
  a.password as conta_entregue_senha,
  o.error_message,
  o.created_at
FROM orders o
LEFT JOIN accounts a ON a.id = o.account_id
WHERE o.customer_email = 'SEU_EMAIL_AQUI@gmail.com'
ORDER BY o.created_at DESC;

-- 5. VERIFICAR ESTOQUE DISPONÍVEL POR PRODUTO
SELECT 
  product_id,
  COUNT(*) as total_disponivel,
  MIN(created_at) as conta_mais_antiga,
  MAX(created_at) as conta_mais_recente
FROM accounts 
WHERE status = 'available' 
  AND is_sold = false
GROUP BY product_id
ORDER BY product_id;

-- 6. VER TODAS AS CONTAS DISPONÍVEIS (COM DETALHES)
SELECT 
  id,
  product_id,
  email,
  password,
  status,
  is_sold,
  created_at
FROM accounts 
WHERE status = 'available' 
  AND is_sold = false
ORDER BY product_id, created_at;

-- 7. VER ÚLTIMAS 10 VENDAS COMPLETAS
SELECT 
  o.external_id,
  o.customer_email,
  o.status,
  o.delivery_status,
  o.product_id,
  a.email as conta_entregue,
  o.created_at,
  o.delivered_at
FROM orders o
LEFT JOIN accounts a ON a.id = o.account_id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC
LIMIT 10;

-- 8. VERIFICAR SE HÁ WEBHOOKS PENDENTES (SEM PEDIDO CRIADO)
SELECT 
  wl.created_at,
  wl.success,
  wl.error_message,
  wl.payload->'payment'->>'id' as payment_id,
  wl.payload->'customer'->>'email' as customer_email
FROM webhook_logs wl
LEFT JOIN orders o ON o.external_id = wl.payload->'payment'->>'id'
WHERE wl.created_at > NOW() - INTERVAL '24 hours'
  AND o.id IS NULL
ORDER BY wl.created_at DESC;

-- 9. ESTATÍSTICAS GERAIS
SELECT 
  COUNT(CASE WHEN success = true THEN 1 END) as webhooks_sucesso,
  COUNT(CASE WHEN success = false THEN 1 END) as webhooks_erro,
  COUNT(*) as total_webhooks
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 10. PRODUCT_IDS ÚNICOS RECEBIDOS DO GGCHECKOUT
SELECT DISTINCT
  payload->'product'->>'id' as product_id_ggcheckout,
  COUNT(*) as vezes_recebido
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY payload->'product'->>'id'
ORDER BY vezes_recebido DESC;
