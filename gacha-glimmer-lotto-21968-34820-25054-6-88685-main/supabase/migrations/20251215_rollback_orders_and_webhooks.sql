-- =====================================================
-- ROLLBACK: Remover tabelas orders e webhook_logs
-- Data: 2025-12-15
-- ATENÇÃO: Este script apaga PERMANENTEMENTE os dados!
-- Execute apenas se precisar desfazer a migration.
-- =====================================================

-- Confirmar antes de executar
DO $$
BEGIN
  RAISE NOTICE 'ATENÇÃO: Este script irá apagar as tabelas orders e webhook_logs!';
  RAISE NOTICE 'Todos os dados serão perdidos permanentemente.';
  RAISE NOTICE 'Aguarde 5 segundos...';
  PERFORM pg_sleep(5);
END $$;

-- 1. Remover funções
DROP FUNCTION IF EXISTS get_pending_deliveries();
DROP FUNCTION IF EXISTS get_order_by_external_id(text);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 2. Remover views
DROP VIEW IF EXISTS orders_with_account_details;

-- 3. Remover índices (serão removidos automaticamente com as tabelas, mas listando para clareza)
DROP INDEX IF EXISTS idx_orders_external_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_delivery_status;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_customer_email;
DROP INDEX IF EXISTS idx_orders_product_id;
DROP INDEX IF EXISTS idx_orders_account_id;
DROP INDEX IF EXISTS idx_orders_status_delivery;

DROP INDEX IF EXISTS idx_webhook_logs_source;
DROP INDEX IF EXISTS idx_webhook_logs_processed;
DROP INDEX IF EXISTS idx_webhook_logs_order_id;
DROP INDEX IF EXISTS idx_webhook_logs_created_at;

-- 4. Remover tabelas
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Rollback concluído. Tabelas orders e webhook_logs removidas.';
END $$;

-- Verificação (deve retornar 0 para ambas)
SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('orders', 'webhook_logs');
