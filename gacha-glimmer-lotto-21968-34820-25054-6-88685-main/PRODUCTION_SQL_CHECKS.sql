-- =====================================================
-- QUERIES DE VERIFICAÇÃO RÁPIDA - WEBHOOK GGCHECKOUT
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1️⃣ VER ÚLTIMOS WEBHOOKS RECEBIDOS (últimos 20)
-- Mostra se o webhook está recebendo requisições
SELECT 
  created_at,
  success,
  error_message,
  (payload::jsonb->>'transaction_id') as transaction_id,
  (payload::jsonb->>'status') as status,
  (payload::jsonb->>'product_id') as product_id
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;

-- 2️⃣ VER ÚLTIMAS ORDERS CRIADAS (últimos 20)
-- Mostra se orders estão sendo criadas corretamente
SELECT 
  created_at,
  external_id,
  status,
  delivery_status,
  account_id,
  product_id,
  customer_email
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- 3️⃣ VERIFICAR WEBHOOKS COM ERRO
-- Se houver erros de assinatura ou validação
SELECT 
  created_at,
  success,
  error_message,
  payload::jsonb->>'transaction_id' as transaction_id
FROM webhook_logs
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ VERIFICAR CONTAS DISPONÍVEIS POR PRODUTO
-- Mostra quantas contas estão disponíveis para entrega
SELECT 
  product_id,
  COUNT(*) as contas_disponiveis
FROM accounts
WHERE is_claimed = false
GROUP BY product_id
ORDER BY product_id;

-- 5️⃣ VERIFICAR ÚLTIMAS ENTREGAS
-- Mostra orders com contas entregues
SELECT 
  o.created_at,
  o.external_id,
  o.status,
  o.delivery_status,
  o.customer_email,
  a.email as conta_email,
  a.product_id
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE o.delivery_status = 'delivered'
ORDER BY o.created_at DESC
LIMIT 10;

-- 6️⃣ VERIFICAR SE HÁ WEBHOOKS DUPLICADOS (IDEMPOTÊNCIA)
-- Deve mostrar apenas 1 order por transaction_id
SELECT 
  external_id,
  COUNT(*) as quantidade_orders,
  CASE 
    WHEN COUNT(*) > 1 THEN '❌ DUPLICADO'
    ELSE '✅ OK'
  END as status_idempotencia
FROM orders
GROUP BY external_id
HAVING COUNT(*) > 1;

-- 7️⃣ ESTATÍSTICAS GERAIS
-- Resumo do sistema
SELECT 
  'Total Orders' as metrica,
  COUNT(*)::text as valor
FROM orders
UNION ALL
SELECT 
  'Orders Completed',
  COUNT(*)::text
FROM orders
WHERE status = 'completed'
UNION ALL
SELECT 
  'Orders Delivered',
  COUNT(*)::text
FROM orders
WHERE delivery_status = 'delivered'
UNION ALL
SELECT 
  'Total Webhooks',
  COUNT(*)::text
FROM webhook_logs
UNION ALL
SELECT 
  'Webhooks Success',
  COUNT(*)::text
FROM webhook_logs
WHERE success = true
UNION ALL
SELECT 
  'Contas Disponíveis',
  COUNT(*)::text
FROM accounts
WHERE is_claimed = false;
