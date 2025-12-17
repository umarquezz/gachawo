-- =====================================================
-- MIGRATION: Criar tabela orders e webhook_logs
-- Data: 2025-12-15
-- Descrição: Tabelas para registrar pedidos e logs de webhook do GGCheckout
-- =====================================================

-- 1. Tabela de pedidos (orders)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação única do GGCheckout (chave de idempotência)
  -- Suporta: transaction_id, order_id, external_id do GGCheckout
  external_id text UNIQUE NOT NULL,
  
  -- Relacionamento com usuário (opcional, pode ser NULL para compras sem conta)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Dados do produto
  product_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  
  -- Status do pedido
  status text NOT NULL DEFAULT 'pending',
  -- Valores possíveis: 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  -- Relacionamento com conta entregue
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- Dados do cliente
  customer_email text NOT NULL,
  customer_name text,
  customer_document text,
  customer_phone text,
  
  -- Status de entrega
  delivery_status text DEFAULT 'pending',
  -- Valores possíveis: 'pending', 'delivered', 'error'
  delivered_at timestamptz,
  
  -- Payload original do webhook (para auditoria completa)
  raw_payload jsonb NOT NULL,
  
  -- Mensagens de erro (se houver)
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Índices para performance e queries comuns
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON orders(external_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON orders(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status_delivery ON orders(status, delivery_status);

-- Comentários para documentação
COMMENT ON TABLE orders IS 'Registro de todos os pedidos processados pelo webhook do GGCheckout';
COMMENT ON COLUMN orders.external_id IS 'ID único da transação no GGCheckout (transaction_id, order_id ou external_id) - chave de idempotência';
COMMENT ON COLUMN orders.status IS 'Status do pedido: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN orders.delivery_status IS 'Status da entrega da conta: pending, delivered, error';
COMMENT ON COLUMN orders.raw_payload IS 'Payload original do webhook para auditoria completa';
COMMENT ON COLUMN orders.currency IS 'Moeda da transação (padrão: BRL)';
COMMENT ON COLUMN orders.customer_email IS 'Email do cliente (obrigatório para entrega)';

-- 2. Tabela de logs de webhook (para debugging e auditoria)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origem do webhook
  source text NOT NULL DEFAULT 'ggcheckout',
  
  -- Tipo de evento
  event_type text,
  
  -- Payload completo recebido
  payload jsonb NOT NULL,
  
  -- Status do processamento
  processed boolean DEFAULT false,
  processing_error text,
  
  -- ID do pedido criado (se aplicável)
  order_id uuid REFERENCES orders(id),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id ON webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Comentários
COMMENT ON TABLE webhook_logs IS 'Logs de todos os webhooks recebidos para auditoria e debugging';
COMMENT ON COLUMN webhook_logs.processed IS 'Se true, o webhook foi processado com sucesso';

-- 3. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Row Level Security (RLS)
-- Habilitar RLS nas tabelas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política: Service role pode fazer tudo (para Edge Function)
CREATE POLICY "Service role has full access to orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to webhook_logs"
  ON webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Política: Usuários autenticados podem ver apenas seus próprios pedidos
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Usuários anônimos não têm acesso
CREATE POLICY "Anonymous users cannot access orders"
  ON orders
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Anonymous users cannot access webhook_logs"
  ON webhook_logs
  FOR ALL
  TO anon
  USING (false);

-- 5. Verificação de integridade
-- Adicionar constraint para validar status
ALTER TABLE orders
  ADD CONSTRAINT check_orders_status
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE orders
  ADD CONSTRAINT check_orders_delivery_status
  CHECK (delivery_status IN ('pending', 'delivered', 'failed'));

-- 6. View para facilitar consultas
CREATE OR REPLACE VIEW orders_with_account_details AS
SELECT 
  o.id,
  o.external_id,
  o.user_id,
  o.product_id,
  o.amount,
  o.currency,
  o.status,
  o.delivery_status,
  o.customer_email,
  o.customer_name,
  o.created_at,
  o.completed_at,
  o.delivered_at,
  o.error_message,
  a.id AS account_id,
  a.email AS account_email,
  a.password AS account_password,
  a.full_credentials AS account_credentials,
  a.product_id AS account_product_id
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id;

COMMENT ON VIEW orders_with_account_details IS 'View combinando pedidos com detalhes das contas entregues';

-- 7. Função helper para buscar pedido por external_id
CREATE OR REPLACE FUNCTION get_order_by_external_id(p_external_id text)
RETURNS TABLE (
  id uuid,
  external_id text,
  status text,
  delivery_status text,
  account_id uuid,
  customer_email text,
  amount numeric,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.external_id,
    o.status,
    o.delivery_status,
    o.account_id,
    o.customer_email,
    o.amount,
    o.created_at
  FROM orders o
  WHERE o.external_id = p_external_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para buscar pedidos pendentes de entrega
CREATE OR REPLACE FUNCTION get_pending_deliveries()
RETURNS TABLE (
  id uuid,
  external_id text,
  product_id text,
  customer_email text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.external_id,
    o.product_id,
    o.customer_email,
    o.created_at
  FROM orders o
  WHERE o.status = 'completed' 
    AND o.delivery_status = 'pending'
  ORDER BY o.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Verificação: Contar registros (deve retornar 0 inicialmente)
SELECT 
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM webhook_logs) as total_webhook_logs;
