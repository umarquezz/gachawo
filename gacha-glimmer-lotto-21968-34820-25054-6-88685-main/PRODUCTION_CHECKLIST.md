# ✅ Checklist de Produção - Webhook GGCheckout

**Data**: 15 de dezembro de 2025  
**Projeto**: zcsyzddfmcvmxqqxqzsk  
**Webhook URL**: https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout

---

## 📋 Índice

1. [Validação de Tabelas](#1-validação-de-tabelas)
2. [Validação de Constraints e Índices](#2-validação-de-constraints-e-índices)
3. [Validação de RLS e Permissões](#3-validação-de-rls-e-permissões)
4. [Validação de Secrets](#4-validação-de-secrets)
5. [Validação da Edge Function](#5-validação-da-edge-function)
6. [Queries de Monitoramento](#6-queries-de-monitoramento)
7. [Teste de Produção](#7-teste-de-produção)
8. [Dashboard de Monitoramento](#8-dashboard-de-monitoramento)

---

## 1. Validação de Tabelas

### 1.1 ✅ Verificar se as tabelas existem

**Local no Painel**: 
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/editor
- Menu lateral: **"Table Editor"**

**Query SQL**:
```sql
-- Copie e execute no SQL Editor
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'webhook_logs', 'accounts')
ORDER BY tablename;
```

**Resultado Esperado**:
```
schemaname | tablename     | tableowner
-----------+---------------+-----------
public     | accounts      | postgres
public     | orders        | postgres
public     | webhook_logs  | postgres
```

✅ **Validação**: Deve retornar 3 linhas (3 tabelas)

---

### 1.2 ✅ Verificar estrutura da tabela ORDERS

**Query SQL**:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;
```

**Campos Obrigatórios** (verificar na resposta):
- ✅ `id` (uuid, PK)
- ✅ `external_id` (text, NOT NULL, UNIQUE)
- ✅ `user_id` (uuid, FK opcional)
- ✅ `account_id` (uuid, FK opcional)
- ✅ `product_id` (text, NOT NULL)
- ✅ `amount` (numeric, NOT NULL)
- ✅ `currency` (text, default 'BRL')
- ✅ `status` (text, NOT NULL)
- ✅ `delivery_status` (text, NOT NULL)
- ✅ `customer_email` (text, NOT NULL)
- ✅ `customer_name` (text)
- ✅ `customer_document` (text)
- ✅ `customer_phone` (text)
- ✅ `raw_payload` (jsonb, NOT NULL)
- ✅ `error_message` (text)
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

---

### 1.3 ✅ Verificar estrutura da tabela WEBHOOK_LOGS

**Query SQL**:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'webhook_logs'
ORDER BY ordinal_position;
```

**Campos Obrigatórios**:
- ✅ `id` (uuid, PK)
- ✅ `external_id` (text)
- ✅ `event_type` (text, NOT NULL)
- ✅ `payload` (jsonb, NOT NULL)
- ✅ `status` (text, NOT NULL)
- ✅ `error_message` (text)
- ✅ `processed_at` (timestamptz)
- ✅ `created_at` (timestamptz)

---

### 1.4 ✅ Verificar estrutura da tabela ACCOUNTS (estoque)

**Query SQL**:
```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'accounts'
ORDER BY ordinal_position;
```

**Campos Mínimos Esperados**:
- ✅ `id` (uuid, PK)
- ✅ `email` (text) - credencial da conta
- ✅ `password` (text) - credencial da conta
- ✅ `is_claimed` (boolean) - indica se está em uso

---

## 2. Validação de Constraints e Índices

### 2.1 ✅ CRITICAL: Verificar UNIQUE constraint em external_id

**Por que é crítico**: Garante idempotência - impede pedidos duplicados.

**Query SQL**:
```sql
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.orders'::regclass
  AND contype = 'u'; -- unique constraints
```

**Resultado Esperado**:
```
constraint_name            | constraint_type | constraint_definition
--------------------------+----------------+---------------------------
orders_external_id_unique | u              | UNIQUE (external_id)
```

✅ **Validação**: Deve existir constraint UNIQUE em `external_id`

❌ **Se falhar**: Execute a migration novamente:
```sql
ALTER TABLE orders ADD CONSTRAINT orders_external_id_unique UNIQUE (external_id);
```

---

### 2.2 ✅ Verificar Foreign Keys

**Query SQL**:
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
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
```

**Foreign Keys Esperadas**:
1. ✅ `orders.user_id` → `auth.users(id)` - DELETE SET NULL
2. ✅ `orders.account_id` → `accounts(id)` - DELETE SET NULL

---

### 2.3 ✅ Verificar Índices de Performance

**Query SQL**:
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'orders'
ORDER BY indexname;
```

**Índices Críticos** (mínimo esperado):
- ✅ `idx_orders_external_id` - busca rápida por external_id (idempotência)
- ✅ `idx_orders_status` - filtrar por status
- ✅ `idx_orders_delivery_status` - filtrar entregas pendentes
- ✅ `idx_orders_created_at` - ordenação temporal
- ✅ `idx_orders_user_id` - busca por usuário (partial index)
- ✅ `idx_orders_account_id` - busca por conta (partial index)

**Verificar Performance**:
```sql
-- Esta query deve usar o índice (EXPLAIN mostrará Index Scan)
EXPLAIN ANALYZE
SELECT * FROM orders WHERE external_id = 'TEST-123';
```

---

## 3. Validação de RLS e Permissões

### 3.1 ✅ Verificar se RLS está habilitada

**Local no Painel**:
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/auth/policies
- Verifique cada tabela: `orders`, `webhook_logs`, `accounts`

**Query SQL**:
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'webhook_logs', 'accounts');
```

**Resultado Esperado**:
```
schemaname | tablename     | rls_enabled
-----------+---------------+------------
public     | orders        | true
public     | webhook_logs  | true
public     | accounts      | true
```

---

### 3.2 ✅ CRITICAL: Verificar policies para SERVICE_ROLE

**Por que é crítico**: Edge Function usa service_role - precisa de acesso total.

**Query SQL**:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'webhook_logs', 'accounts')
ORDER BY tablename, policyname;
```

**Policies Obrigatórias**:

1. **orders**:
   - ✅ Policy para `service_role` com `ALL` (SELECT, INSERT, UPDATE, DELETE)
   - ✅ Policy para usuários autenticados verem seus próprios pedidos

2. **webhook_logs**:
   - ✅ Policy para `service_role` com `ALL`

3. **accounts**:
   - ✅ Policy para `service_role` com `ALL`
   - ✅ Policy para SELECT com `is_claimed = false` (optional)

---

### 3.3 ✅ Testar permissões do SERVICE_ROLE

**Teste INSERT via service_role**:
```sql
-- Execute como service_role (no SQL Editor do Supabase)
INSERT INTO orders (
  external_id,
  product_id,
  amount,
  currency,
  status,
  delivery_status,
  customer_email,
  raw_payload
) VALUES (
  'TEST-PERMISSIONS-' || NOW()::text,
  'test-product',
  29.90,
  'BRL',
  'pending',
  'pending',
  'test@example.com',
  '{}'::jsonb
)
RETURNING id, external_id, status;
```

✅ **Se executar com sucesso**: Permissões OK  
❌ **Se falhar com "permission denied"**: Falta policy

**Cleanup**:
```sql
DELETE FROM orders WHERE external_id LIKE 'TEST-PERMISSIONS-%';
```

---

## 4. Validação de Secrets

### 4.1 ✅ Listar secrets da Edge Function

**Local no Painel**:
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/settings/functions
- Seção: **"Edge Function Secrets"**

**Via CLI**:
```bash
supabase secrets list --project-ref zcsyzddfmcvmxqqxqzsk
```

**Secrets Esperadas**:
- ✅ `SUPABASE_URL` (auto-injetada)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (auto-injetada)
- ⚠️ `GGCHECKOUT_WEBHOOK_SECRET` (opcional - se GGCheckout usar assinatura)

---

### 4.2 ✅ Configurar secret do GGCheckout (se necessário)

**Quando configurar**: Se o GGCheckout enviar um header de assinatura (ex: `X-Signature`).

**Via CLI**:
```bash
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=sua_chave_secreta_aqui \
  --project-ref zcsyzddfmcvmxqqxqzsk
```

**Via Painel**:
1. Acesse: Settings → Edge Functions → Secrets
2. Click "Add new secret"
3. Name: `GGCHECKOUT_WEBHOOK_SECRET`
4. Value: (cole a chave fornecida pelo GGCheckout)
5. Save

---

### 4.3 ⚠️ SEGURANÇA: Verificar que SERVICE_ROLE_KEY não está exposta

**NUNCA faça isso** no frontend:
```typescript
// ❌ ERRADO - NUNCA no frontend
const supabase = createClient(url, SERVICE_ROLE_KEY)
```

**SEMPRE use anon_key** no frontend:
```typescript
// ✅ CORRETO - Frontend usa anon_key
const supabase = createClient(url, ANON_KEY)
```

**Verificar**:
```bash
# Buscar por service_role_key no código frontend
grep -r "service_role" src/
```

✅ **Não deve retornar nada** no código frontend (src/)

---

## 5. Validação da Edge Function

### 5.1 ✅ Verificar se a função está deployada

**Local no Painel**:
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions
- Verifique se aparece: **"ggcheckout"**

**Via CLI**:
```bash
supabase functions list --project-ref zcsyzddfmcvmxqqxqzsk
```

**Resultado Esperado**:
```
NAME         VERSION  CREATED AT              UPDATED AT
ggcheckout   v1       2025-12-15 10:00:00     2025-12-15 10:00:00
```

---

### 5.2 ✅ Testar endpoint da função (health check)

**Teste OPTIONS (CORS)**:
```bash
curl -X OPTIONS https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Origin: https://example.com" \
  -v
```

**Resultado Esperado**:
```
HTTP/2 200
access-control-allow-origin: *
access-control-allow-headers: authorization, x-client-info, apikey, content-type
```

✅ **CORS configurado corretamente**

---

### 5.3 ✅ Testar endpoint com payload mínimo

**Teste POST básico**:
```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjM5NTEsImV4cCI6MjA3Njk5OTk1MX0.OK4BkPJ0PWsDldSpNAin1NdzpeFIcKBn6FDgPaOIQhg" \
  -d '{
    "transaction_id": "PROD-AUDIT-001",
    "status": "approved",
    "product_id": "audit-test",
    "customer_email": "audit@example.com",
    "customer_name": "Auditoria Produção",
    "amount": 0.01,
    "currency": "BRL"
  }'
```

**Resultado Esperado** (HTTP 200):
```json
{
  "success": true,
  "order_id": "uuid-aqui",
  "external_id": "PROD-AUDIT-001",
  "status": "completed",
  "delivery_status": "delivered",
  "account_id": "uuid-da-conta-reservada",
  "message": "Order processed successfully"
}
```

✅ **Webhook funcionando**

---

### 5.4 ✅ Verificar logs da função

**Local no Painel**:
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions/ggcheckout/logs

**Via CLI**:
```bash
supabase functions logs ggcheckout \
  --project-ref zcsyzddfmcvmxqqxqzsk \
  --limit 50
```

**Logs Esperados** (após teste acima):
```
📨 Webhook received: { external_id: 'PROD-AUDIT-001', ... }
🔍 Processing transaction: { externalId: 'PROD-AUDIT-001', ... }
📝 Creating new order...
🎁 Delivering account to customer...
✅ Order processed successfully
```

---

## 6. Queries de Monitoramento

### 6.1 📊 Dashboard SQL - Últimos 20 Webhooks

**Query SQL** (copie no SQL Editor):
```sql
SELECT 
  id,
  external_id,
  event_type,
  status,
  error_message,
  processed_at,
  created_at,
  -- Preview do payload (primeiros campos)
  payload->>'status' as webhook_status,
  payload->>'product_id' as product_id,
  payload->>'customer_email' as customer_email
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

**Resultado Esperado**:
- Lista dos últimos 20 webhooks recebidos
- Coluna `status` deve mostrar: `received`, `processed`, ou `error`
- Se `status = 'error'`, verificar `error_message`

---

### 6.2 📊 Dashboard SQL - Últimos 20 Pedidos

```sql
SELECT 
  id,
  external_id,
  status,
  delivery_status,
  product_id,
  amount,
  currency,
  customer_email,
  account_id IS NOT NULL as has_account,
  error_message,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;
```

**Colunas Críticas**:
- ✅ `status = 'completed'` → Pagamento aprovado
- ✅ `delivery_status = 'delivered'` → Conta entregue
- ✅ `has_account = true` → Conta foi reservada
- ❌ `error_message IS NOT NULL` → Houve erro

---

### 6.3 📊 Estatísticas Gerais

```sql
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_status = 'pending') as delivery_pending,
  COUNT(*) FILTER (WHERE delivery_status = 'error') as delivery_errors,
  COUNT(*) FILTER (WHERE account_id IS NOT NULL) as with_account,
  SUM(amount) FILTER (WHERE status = 'completed') as total_revenue
FROM orders;
```

---

### 6.4 📊 Verificar Entregas Pendentes

```sql
SELECT * FROM get_pending_deliveries();

-- OU manualmente:
SELECT 
  id,
  external_id,
  status,
  delivery_status,
  customer_email,
  product_id,
  created_at
FROM orders
WHERE status = 'completed'
  AND delivery_status != 'delivered'
ORDER BY created_at DESC;
```

**Ação**: Se houver pedidos aqui, investigar por que não foram entregues.

---

### 6.5 📊 Verificar Estoque de Contas

```sql
SELECT 
  COUNT(*) as total_accounts,
  COUNT(*) FILTER (WHERE is_claimed = false) as available,
  COUNT(*) FILTER (WHERE is_claimed = true) as claimed
FROM accounts;
```

⚠️ **Alerta**: Se `available < 10`, precisa adicionar mais contas ao estoque.

---

### 6.6 📊 Auditoria de Idempotência

**Verificar se há duplicatas** (não deveria existir):
```sql
SELECT 
  external_id,
  COUNT(*) as total,
  ARRAY_AGG(id) as order_ids
FROM orders
GROUP BY external_id
HAVING COUNT(*) > 1;
```

✅ **Resultado Esperado**: 0 linhas (nenhuma duplicata)  
❌ **Se retornar linhas**: Constraint UNIQUE falhou - investigar urgente

---

### 6.7 📊 Taxa de Sucesso

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE status = 'received') as received,
  COUNT(*) FILTER (WHERE status = 'processed') as processed,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'processed') / COUNT(*),
    2
  ) as success_rate_percent
FROM webhook_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 7. Teste de Produção

### 7.1 🧪 Teste Completo End-to-End

**Passo 1: Limpar testes anteriores**
```sql
DELETE FROM orders WHERE external_id LIKE 'PROD-TEST-%';
DELETE FROM webhook_logs WHERE external_id LIKE 'PROD-TEST-%';
```

**Passo 2: Enviar webhook de teste**
```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjM5NTEsImV4cCI6MjA3Njk5OTk1MX0.OK4BkPJ0PWsDldSpNAin1NdzpeFIcKBn6FDgPaOIQhg" \
  -d '{
    "transaction_id": "PROD-TEST-E2E-001",
    "status": "approved",
    "product_id": "50k",
    "customer_email": "producao@teste.com",
    "customer_name": "Teste Produção",
    "customer_phone": "+5511999999999",
    "amount": 29.90,
    "currency": "BRL",
    "event": "payment.approved"
  }'
```

**Passo 3: Verificar criação do pedido**
```sql
SELECT * FROM orders WHERE external_id = 'PROD-TEST-E2E-001';
```

**Validações**:
- ✅ `status = 'completed'`
- ✅ `delivery_status = 'delivered'`
- ✅ `account_id IS NOT NULL`
- ✅ `raw_payload` contém o payload completo

**Passo 4: Verificar log do webhook**
```sql
SELECT * FROM webhook_logs WHERE external_id = 'PROD-TEST-E2E-001';
```

**Validações**:
- ✅ 1 entrada criada
- ✅ `status = 'received'`

**Passo 5: Verificar conta reservada**
```sql
SELECT 
  o.external_id,
  o.status,
  o.delivery_status,
  a.id as account_id,
  a.email as account_email,
  a.password as account_password,
  a.is_claimed
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE o.external_id = 'PROD-TEST-E2E-001';
```

**Validações**:
- ✅ `account_email` e `account_password` preenchidos
- ✅ `is_claimed = true`

**Passo 6: Testar idempotência**
```bash
# Enviar NOVAMENTE o mesmo payload
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjM5NTEsImV4cCI6MjA3Njk5OTk1MX0.OK4BkPJ0PWsDldSpNAin1NdzpeFIcKBn6FDgPaOIQhg" \
  -d '{
    "transaction_id": "PROD-TEST-E2E-001",
    "status": "approved",
    "product_id": "50k",
    "customer_email": "producao@teste.com",
    "customer_name": "Teste Produção",
    "customer_phone": "+5511999999999",
    "amount": 29.90,
    "currency": "BRL",
    "event": "payment.approved"
  }'
```

**Verificar que apenas 1 pedido existe**:
```sql
SELECT COUNT(*) FROM orders WHERE external_id = 'PROD-TEST-E2E-001';
-- Resultado esperado: 1
```

**Verificar que 2 webhooks foram logados**:
```sql
SELECT COUNT(*) FROM webhook_logs WHERE external_id = 'PROD-TEST-E2E-001';
-- Resultado esperado: 2
```

✅ **Se tudo passou**: Sistema pronto para produção

---

## 8. Dashboard de Monitoramento

### 8.1 📊 Criar View de Monitoramento

**Execute no SQL Editor**:
```sql
CREATE OR REPLACE VIEW v_webhook_monitoring AS
SELECT 
  o.id,
  o.external_id,
  o.status as order_status,
  o.delivery_status,
  o.product_id,
  o.amount,
  o.customer_email,
  o.account_id IS NOT NULL as has_account,
  a.email as account_email,
  o.error_message,
  o.created_at,
  o.updated_at,
  -- Tempo de processamento
  EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) as processing_time_seconds,
  -- Status do webhook
  (
    SELECT wl.status 
    FROM webhook_logs wl 
    WHERE wl.external_id = o.external_id 
    ORDER BY wl.created_at DESC 
    LIMIT 1
  ) as webhook_status
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
ORDER BY o.created_at DESC;
```

**Usar a view**:
```sql
-- Ver últimas 50 transações
SELECT * FROM v_webhook_monitoring LIMIT 50;

-- Filtrar apenas erros
SELECT * FROM v_webhook_monitoring 
WHERE delivery_status = 'error' 
  OR error_message IS NOT NULL;

-- Filtrar pedidos lentos (mais de 5 segundos)
SELECT * FROM v_webhook_monitoring 
WHERE processing_time_seconds > 5;
```

---

### 8.2 🚨 Alertas Críticos

**Query de Alertas** (executar diariamente):
```sql
-- ALERTA 1: Pedidos aprovados sem conta entregue
SELECT 
  'ALERTA: Pedido aprovado sem entrega' as alert_type,
  external_id,
  customer_email,
  created_at,
  error_message
FROM orders
WHERE status = 'completed'
  AND delivery_status != 'delivered'
  AND created_at > NOW() - INTERVAL '24 hours';

-- ALERTA 2: Estoque baixo
SELECT 
  'ALERTA: Estoque baixo' as alert_type,
  COUNT(*) FILTER (WHERE is_claimed = false) as available_accounts,
  COUNT(*) as total_accounts
FROM accounts
HAVING COUNT(*) FILTER (WHERE is_claimed = false) < 10;

-- ALERTA 3: Taxa de erro alta (>5%)
SELECT 
  'ALERTA: Taxa de erro alta' as alert_type,
  COUNT(*) as total_webhooks,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / COUNT(*), 2) as error_rate
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
HAVING ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'error') / COUNT(*), 2) > 5;

-- ALERTA 4: Duplicatas (CRÍTICO)
SELECT 
  'ALERTA CRÍTICO: Duplicatas detectadas' as alert_type,
  external_id,
  COUNT(*) as duplicates
FROM orders
GROUP BY external_id
HAVING COUNT(*) > 1;
```

---

## 9. Checklist Final - Go Live

### ✅ Pré-Deploy

- [ ] Tabelas criadas (orders, webhook_logs, accounts)
- [ ] Constraint UNIQUE em external_id existe
- [ ] Índices de performance criados
- [ ] RLS habilitada em todas as tabelas
- [ ] Policies para service_role configuradas
- [ ] Edge Function deployada
- [ ] Secrets configurados (se necessário)
- [ ] Teste E2E passou

### ✅ Go Live

- [ ] URL do webhook configurada no GGCheckout
- [ ] Monitoramento ativo (dashboard SQL)
- [ ] Logs da Edge Function sendo acompanhados
- [ ] Estoque de contas disponível (>10 contas)

### ✅ Pós-Deploy (Primeiras 24h)

- [ ] Primeira compra real processada com sucesso
- [ ] Idempotência validada em produção
- [ ] Conta entregue ao cliente
- [ ] Nenhum alerta crítico disparado
- [ ] Taxa de erro < 5%

---

## 10. Como Identificar Problemas Rapidamente

### 🔴 PROBLEMA: Webhook não está criando pedidos

**Diagnóstico**:
```sql
-- 1. Verificar se webhooks estão chegando
SELECT COUNT(*) FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

- **Se 0**: Webhook não está recebendo chamadas → Verificar URL no GGCheckout
- **Se >0**: Webhooks chegando → Verificar erros

```sql
-- 2. Verificar erros nos webhooks
SELECT * FROM webhook_logs 
WHERE status = 'error' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Ação**: Ler `error_message` e corrigir

---

### 🔴 PROBLEMA: Pedido criado mas conta não entregue

**Diagnóstico**:
```sql
SELECT 
  external_id,
  status,
  delivery_status,
  error_message,
  account_id
FROM orders
WHERE status = 'completed'
  AND delivery_status != 'delivered'
ORDER BY created_at DESC;
```

**Causas possíveis**:
1. ❌ **Estoque vazio** → Adicionar mais contas
2. ❌ **Erro no claim_account_stock()** → Verificar RPC function
3. ❌ **Lock/concorrência** → Verificar logs da função

---

### 🔴 PROBLEMA: Pedidos duplicados

**Diagnóstico**:
```sql
SELECT external_id, COUNT(*) as duplicates
FROM orders
GROUP BY external_id
HAVING COUNT(*) > 1;
```

**Causa**: Constraint UNIQUE não existe ou foi removida

**Correção**:
```sql
-- Remover duplicatas (manter apenas a primeira)
DELETE FROM orders a
USING orders b
WHERE a.external_id = b.external_id
  AND a.created_at > b.created_at;

-- Recriar constraint
ALTER TABLE orders 
ADD CONSTRAINT orders_external_id_unique UNIQUE (external_id);
```

---

## 11. Comandos Úteis

### Reiniciar função após deploy
```bash
supabase functions deploy ggcheckout --project-ref zcsyzddfmcvmxqqxqzsk
```

### Ver logs em tempo real
```bash
supabase functions logs ggcheckout \
  --project-ref zcsyzddfmcvmxqqxqzsk \
  --follow
```

### Adicionar secret
```bash
supabase secrets set KEY=value --project-ref zcsyzddfmcvmxqqxqzsk
```

### Listar secrets
```bash
supabase secrets list --project-ref zcsyzddfmcvmxqqxqzsk
```

---

## 📞 Suporte

**Se algo falhar**:

1. Verificar logs da Edge Function
2. Executar queries de diagnóstico (seção 10)
3. Consultar `WEBHOOK_SETUP.md` → Troubleshooting
4. Verificar policies RLS (seção 3)

---

## ✅ Resultado Esperado

Após seguir este checklist:

- ✅ Webhook recebendo chamadas do GGCheckout
- ✅ Pedidos sendo criados corretamente
- ✅ Contas sendo reservadas e entregues
- ✅ Idempotência funcionando (sem duplicatas)
- ✅ Logs e auditoria completos
- ✅ Monitoramento ativo
- ✅ Taxa de sucesso > 95%

**Status**: 🟢 PRONTO PARA PRODUÇÃO
