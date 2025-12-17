-- =====================================================
-- SCRIPT DE AUDITORIA DE PRODUÇÃO - WEBHOOK GGCHECKOUT
-- =====================================================
-- Execute este script no SQL Editor do Supabase para
-- validar toda a infraestrutura do webhook.
-- =====================================================

\echo '=========================================='
\echo 'AUDITORIA DE PRODUÇÃO - WEBHOOK GGCHECKOUT'
\echo 'Data: 15/12/2025'
\echo '=========================================='
\echo ''

-- =====================================================
-- 1. VALIDAÇÃO DE TABELAS
-- =====================================================
\echo '1. VALIDANDO EXISTÊNCIA DAS TABELAS...'
\echo ''

SELECT 
  '✓ Tabela encontrada: ' || tablename as status,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'webhook_logs', 'accounts')
ORDER BY tablename;

\echo ''

-- Contagem de tabelas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('orders', 'webhook_logs', 'accounts');
  
  IF table_count = 3 THEN
    RAISE NOTICE '✅ SUCESSO: Todas as 3 tabelas existem';
  ELSE
    RAISE WARNING '❌ ERRO: Apenas % de 3 tabelas encontradas', table_count;
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 2. VALIDAÇÃO DE ESTRUTURA DA TABELA ORDERS
-- =====================================================
\echo '2. VALIDANDO ESTRUTURA DA TABELA ORDERS...'
\echo ''

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN is_nullable = 'NO' THEN 'NOT NULL'
    ELSE 'NULLABLE'
  END as nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

\echo ''

-- Validar campos críticos
DO $$
DECLARE
  has_external_id BOOLEAN;
  has_customer_email BOOLEAN;
  has_raw_payload BOOLEAN;
BEGIN
  SELECT 
    bool_and(column_name = 'external_id') INTO has_external_id
  FROM information_schema.columns
  WHERE table_name = 'orders' AND column_name = 'external_id';
  
  SELECT 
    bool_and(column_name = 'customer_email') INTO has_customer_email
  FROM information_schema.columns
  WHERE table_name = 'orders' AND column_name = 'customer_email';
  
  SELECT 
    bool_and(column_name = 'raw_payload') INTO has_raw_payload
  FROM information_schema.columns
  WHERE table_name = 'orders' AND column_name = 'raw_payload';
  
  IF has_external_id AND has_customer_email AND has_raw_payload THEN
    RAISE NOTICE '✅ SUCESSO: Campos críticos existem (external_id, customer_email, raw_payload)';
  ELSE
    RAISE WARNING '❌ ERRO: Faltam campos críticos na tabela orders';
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 3. VALIDAÇÃO CRÍTICA: CONSTRAINT UNIQUE
-- =====================================================
\echo '3. VALIDANDO CONSTRAINT UNIQUE EM EXTERNAL_ID (IDEMPOTÊNCIA)...'
\echo ''

SELECT
  conname AS constraint_name,
  CASE contype
    WHEN 'u' THEN '✓ UNIQUE'
    ELSE contype::text
  END AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND contype = 'u'
  AND pg_get_constraintdef(oid) LIKE '%external_id%';

\echo ''

-- Validar existência
DO $$
DECLARE
  has_unique_constraint BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE '%external_id%'
  ) INTO has_unique_constraint;
  
  IF has_unique_constraint THEN
    RAISE NOTICE '✅ CRÍTICO: Constraint UNIQUE em external_id existe - Idempotência garantida';
  ELSE
    RAISE WARNING '❌ CRÍTICO: Constraint UNIQUE em external_id NÃO EXISTE - Risco de duplicatas!';
    RAISE WARNING '   Execute: ALTER TABLE orders ADD CONSTRAINT orders_external_id_unique UNIQUE (external_id);';
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 4. VALIDAÇÃO DE FOREIGN KEYS
-- =====================================================
\echo '4. VALIDANDO FOREIGN KEYS...'
\echo ''

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'orders' 
  AND tc.constraint_type = 'FOREIGN KEY';

\echo ''
\echo '=========================================='

-- =====================================================
-- 5. VALIDAÇÃO DE ÍNDICES
-- =====================================================
\echo '5. VALIDANDO ÍNDICES DE PERFORMANCE...'
\echo ''

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'orders'
ORDER BY indexname;

\echo ''

-- Contar índices
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'orders'
    AND indexname LIKE 'idx_%';
  
  IF index_count >= 6 THEN
    RAISE NOTICE '✅ SUCESSO: % índices de performance criados', index_count;
  ELSE
    RAISE WARNING '⚠️  AVISO: Apenas % índices encontrados (esperado: 6+)', index_count;
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 6. VALIDAÇÃO DE RLS (ROW LEVEL SECURITY)
-- =====================================================
\echo '6. VALIDANDO RLS (ROW LEVEL SECURITY)...'
\echo ''

SELECT
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✓ HABILITADA'
    ELSE '✗ DESABILITADA'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'webhook_logs', 'accounts');

\echo ''
\echo '=========================================='

-- =====================================================
-- 7. VALIDAÇÃO DE POLICIES
-- =====================================================
\echo '7. VALIDANDO RLS POLICIES...'
\echo ''

SELECT
  tablename,
  policyname,
  CASE 
    WHEN 'service_role' = ANY(roles::text[]) THEN '✓ service_role'
    WHEN 'authenticated' = ANY(roles::text[]) THEN '✓ authenticated'
    WHEN 'anon' = ANY(roles::text[]) THEN '✓ anon'
    ELSE roles::text
  END as role,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'webhook_logs', 'accounts')
ORDER BY tablename, policyname;

\echo ''

-- Validar service_role
DO $$
DECLARE
  has_service_role_orders BOOLEAN;
  has_service_role_webhooks BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
      AND 'service_role' = ANY(roles::text[])
  ) INTO has_service_role_orders;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_logs'
      AND 'service_role' = ANY(roles::text[])
  ) INTO has_service_role_webhooks;
  
  IF has_service_role_orders AND has_service_role_webhooks THEN
    RAISE NOTICE '✅ CRÍTICO: Policies para service_role existem';
  ELSE
    RAISE WARNING '❌ CRÍTICO: Faltam policies para service_role - Edge Function não conseguirá escrever!';
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 8. VALIDAÇÃO DE FUNÇÕES
-- =====================================================
\echo '8. VALIDANDO FUNÇÕES RPC...'
\echo ''

SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
  'claim_account_stock',
  'get_order_by_external_id',
  'get_pending_deliveries'
)
ORDER BY proname;

\echo ''

-- Validar claim_account_stock
DO $$
DECLARE
  has_claim_function BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'claim_account_stock'
  ) INTO has_claim_function;
  
  IF has_claim_function THEN
    RAISE NOTICE '✅ CRÍTICO: Função claim_account_stock() existe';
  ELSE
    RAISE WARNING '❌ CRÍTICO: Função claim_account_stock() NÃO EXISTE - Contas não serão reservadas!';
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 9. ESTATÍSTICAS ATUAIS
-- =====================================================
\echo '9. ESTATÍSTICAS ATUAIS DO SISTEMA...'
\echo ''

SELECT 
  'Orders' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE account_id IS NOT NULL) as with_account
FROM orders
UNION ALL
SELECT 
  'Webhook Logs' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'received') as received,
  COUNT(*) FILTER (WHERE status = 'processed') as processed,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  NULL
FROM webhook_logs
UNION ALL
SELECT 
  'Accounts' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_claimed = true) as claimed,
  COUNT(*) FILTER (WHERE is_claimed = false) as available,
  NULL,
  NULL
FROM accounts;

\echo ''
\echo '=========================================='

-- =====================================================
-- 10. VERIFICAÇÃO DE DUPLICATAS (CRÍTICO)
-- =====================================================
\echo '10. VERIFICANDO DUPLICATAS (IDEMPOTÊNCIA)...'
\echo ''

SELECT 
  external_id,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id) as order_ids
FROM orders
GROUP BY external_id
HAVING COUNT(*) > 1;

\echo ''

-- Validar duplicatas
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT external_id
    FROM orders
    GROUP BY external_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✅ CRÍTICO: Nenhuma duplicata encontrada - Idempotência funcionando';
  ELSE
    RAISE WARNING '❌ CRÍTICO: % external_ids duplicados encontrados!', duplicate_count;
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 11. ALERTA DE ESTOQUE
-- =====================================================
\echo '11. VERIFICANDO ESTOQUE DE CONTAS...'
\echo ''

DO $$
DECLARE
  available_accounts INTEGER;
BEGIN
  SELECT COUNT(*) INTO available_accounts
  FROM accounts
  WHERE is_claimed = false;
  
  IF available_accounts >= 10 THEN
    RAISE NOTICE '✅ ESTOQUE: % contas disponíveis', available_accounts;
  ELSIF available_accounts > 0 THEN
    RAISE WARNING '⚠️  ESTOQUE BAIXO: Apenas % contas disponíveis (adicionar mais)', available_accounts;
  ELSE
    RAISE WARNING '❌ ESTOQUE VAZIO: Nenhuma conta disponível - Entregas falharão!';
  END IF;
END $$;

\echo ''
\echo '=========================================='

-- =====================================================
-- 12. RESUMO FINAL
-- =====================================================
\echo ''
\echo '=========================================='
\echo 'RESUMO DA AUDITORIA'
\echo '=========================================='
\echo ''

DO $$
DECLARE
  tables_ok BOOLEAN;
  unique_ok BOOLEAN;
  policies_ok BOOLEAN;
  function_ok BOOLEAN;
  duplicates_ok BOOLEAN;
  stock_ok BOOLEAN;
  all_ok BOOLEAN;
BEGIN
  -- Verificar tabelas
  SELECT COUNT(*) = 3 INTO tables_ok
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('orders', 'webhook_logs', 'accounts');
  
  -- Verificar UNIQUE constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) LIKE '%external_id%'
  ) INTO unique_ok;
  
  -- Verificar policies
  SELECT 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders' AND 'service_role' = ANY(roles::text[])) > 0
    AND
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'webhook_logs' AND 'service_role' = ANY(roles::text[])) > 0
  INTO policies_ok;
  
  -- Verificar função
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'claim_account_stock'
  ) INTO function_ok;
  
  -- Verificar duplicatas
  SELECT NOT EXISTS (
    SELECT 1 FROM orders
    GROUP BY external_id
    HAVING COUNT(*) > 1
  ) INTO duplicates_ok;
  
  -- Verificar estoque
  SELECT COUNT(*) > 0 INTO stock_ok
  FROM accounts WHERE is_claimed = false;
  
  all_ok := tables_ok AND unique_ok AND policies_ok AND function_ok AND duplicates_ok AND stock_ok;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO DA AUDITORIA:';
  RAISE NOTICE '';
  RAISE NOTICE '  % Tabelas criadas', CASE WHEN tables_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  % Constraint UNIQUE (idempotência)', CASE WHEN unique_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  % RLS Policies (service_role)', CASE WHEN policies_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  % Função claim_account_stock()', CASE WHEN function_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  % Sem duplicatas', CASE WHEN duplicates_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  % Estoque disponível', CASE WHEN stock_ok THEN '✅' ELSE '⚠️' END;
  RAISE NOTICE '';
  
  IF all_ok THEN
    RAISE NOTICE '🟢 STATUS: PRONTO PARA PRODUÇÃO';
    RAISE NOTICE '';
    RAISE NOTICE '   Próximos passos:';
    RAISE NOTICE '   1. Deploy da Edge Function: supabase functions deploy ggcheckout';
    RAISE NOTICE '   2. Configurar URL no GGCheckout dashboard';
    RAISE NOTICE '   3. Executar teste E2E (ver PRODUCTION_CHECKLIST.md seção 7)';
  ELSE
    RAISE WARNING '🔴 STATUS: ATENÇÃO - CORRIGIR PROBLEMAS ANTES DO DEPLOY';
    RAISE WARNING '';
    RAISE WARNING '   Consulte PRODUCTION_CHECKLIST.md para correções';
  END IF;
END $$;

\echo ''
\echo '=========================================='
\echo 'FIM DA AUDITORIA'
\echo '=========================================='
