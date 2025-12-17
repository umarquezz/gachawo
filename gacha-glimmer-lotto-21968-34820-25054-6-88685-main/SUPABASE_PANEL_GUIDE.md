# 🎯 Guia Visual Rápido - Painel Supabase

Este guia mostra **onde clicar** no painel do Supabase para validar cada item da auditoria.

**Dashboard URL**: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk

---

## 📍 1. Validar Tabelas Criadas

### Caminho:
```
Dashboard → Table Editor
```

### Onde clicar:
1. Menu lateral esquerdo → **"Table Editor"** (ícone de tabela)
2. Ver lista de tabelas

### ✅ O que verificar:
- Tabela `orders` existe
- Tabela `webhook_logs` existe  
- Tabela `accounts` existe

### 🖼️ Screenshot esperado:
```
Tables
├── accounts          (ícone de tabela)
├── orders           (ícone de tabela)
├── webhook_logs     (ícone de tabela)
└── ...
```

---

## 📍 2. Validar Estrutura da Tabela ORDERS

### Caminho:
```
Dashboard → Table Editor → orders
```

### Onde clicar:
1. Menu lateral → **"Table Editor"**
2. Click na tabela **"orders"**
3. Ver colunas na interface

### ✅ O que verificar:
Verifique se estas colunas existem:
- `id` (uuid)
- `external_id` (text) ← **CRÍTICO**
- `user_id` (uuid)
- `account_id` (uuid)
- `product_id` (text)
- `amount` (numeric)
- `currency` (text)
- `status` (text)
- `delivery_status` (text)
- `customer_email` (text)
- `customer_name` (text)
- `customer_document` (text)
- `customer_phone` (text)
- `raw_payload` (jsonb)
- `error_message` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

---

## 📍 3. Executar Script de Auditoria SQL

### Caminho:
```
Dashboard → SQL Editor → New query
```

### Onde clicar:
1. Menu lateral → **"SQL Editor"** (ícone </> )
2. Click em **"New query"**
3. Copiar todo o conteúdo de `scripts/audit-production.sql`
4. Click em **"Run"** (ou Ctrl+Enter)

### ✅ O que verificar:
O script exibirá mensagens como:
```
✅ SUCESSO: Todas as 3 tabelas existem
✅ CRÍTICO: Constraint UNIQUE em external_id existe
✅ CRÍTICO: Policies para service_role existem
✅ CRÍTICO: Função claim_account_stock() existe
🟢 STATUS: PRONTO PARA PRODUÇÃO
```

### ⚠️ Atenção:
Se aparecer mensagens `❌`, consulte a seção de correção.

---

## 📍 4. Validar RLS Policies

### Caminho:
```
Dashboard → Authentication → Policies
```

### Onde clicar:
1. Menu lateral → **"Authentication"** (ícone de cadeado)
2. Sub-menu → **"Policies"**
3. Ver policies por tabela

### ✅ O que verificar:

#### Tabela `orders`:
- Policy para `service_role` (ALL operations)
- Policy para `authenticated` (SELECT own orders)

#### Tabela `webhook_logs`:
- Policy para `service_role` (ALL operations)

#### Tabela `accounts`:
- Policy para `service_role` (ALL operations)

### 🖼️ Exemplo de policy correta:
```
Policy name: Enable all for service_role
Allowed role: service_role
Policy command: ALL (SELECT, INSERT, UPDATE, DELETE)
```

---

## 📍 5. Validar Edge Function Deployada

### Caminho:
```
Dashboard → Edge Functions
```

### Onde clicar:
1. Menu lateral → **"Edge Functions"** (ícone de raio ⚡)
2. Ver lista de funções

### ✅ O que verificar:
- Função `ggcheckout` aparece na lista
- Status: **"Deployed"** (verde)
- Versão: v1 ou superior
- URL: `https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout`

### 🔍 Click na função para ver:
- **Logs**: Click em "Logs" para ver execuções recentes
- **Details**: Ver timestamp do último deploy

---

## 📍 6. Validar Secrets Configurados

### Caminho:
```
Dashboard → Project Settings → Edge Functions
```

### Onde clicar:
1. Menu lateral (scroll até o final) → **⚙️ Settings**
2. Sub-menu → **"Edge Functions"**
3. Seção: **"Secrets"**

### ✅ O que verificar:
Secrets que devem existir:
- `SUPABASE_URL` ✅ (auto-injetado)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (auto-injetado)
- `GGCHECKOUT_WEBHOOK_SECRET` ⚠️ (opcional - apenas se GGCheckout usar assinatura)

### ⚠️ Atenção:
**NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend!

---

## 📍 7. Monitorar Logs da Edge Function

### Caminho:
```
Dashboard → Edge Functions → ggcheckout → Logs
```

### Onde clicar:
1. Menu lateral → **"Edge Functions"**
2. Click na função **"ggcheckout"**
3. Tab **"Logs"**

### ✅ O que verificar:
Após enviar um webhook de teste, você verá:
```
📨 Webhook received: { external_id: '...', status: '...' }
🔍 Processing transaction: { ... }
📝 Creating new order...
🎁 Delivering account to customer...
✅ Order processed successfully
```

### 🔴 Logs de erro:
```
❌ Invalid payload: ...
❌ Failed to create order: ...
❌ Out of stock
```

### Filtros úteis:
- **Status**: Filter by "Error" para ver apenas erros
- **Time range**: Últimas 1h, 24h, 7d

---

## 📍 8. Ver Dados das Tabelas (Monitoramento)

### Caminho:
```
Dashboard → Table Editor → [tabela] → View data
```

### Para ver pedidos recentes:
1. Menu lateral → **"Table Editor"**
2. Click em **"orders"**
3. Ver registros na grid
4. Click em uma linha para ver detalhes completos

### Colunas importantes:
- `external_id`: ID único da transação
- `status`: completed, pending, failed, cancelled
- `delivery_status`: delivered, pending, error
- `account_id`: Se preenchido, conta foi reservada
- `error_message`: Se preenchido, houve erro

### Filtros úteis:
No topo da grid, use filtros:
- `status = 'completed'` → Ver pedidos aprovados
- `delivery_status != 'delivered'` → Ver entregas pendentes
- `error_message is not null` → Ver erros

---

## 📍 9. Executar Queries de Monitoramento

### Caminho:
```
Dashboard → SQL Editor → New query
```

### Query 1: Últimos 20 pedidos
```sql
SELECT 
  external_id,
  status,
  delivery_status,
  customer_email,
  amount,
  account_id IS NOT NULL as has_account,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;
```

### Query 2: Últimos 20 webhooks
```sql
SELECT 
  external_id,
  event_type,
  status,
  error_message,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Query 3: Estatísticas
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE account_id IS NOT NULL) as with_account
FROM orders;
```

### Query 4: Estoque
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_claimed = false) as available,
  COUNT(*) FILTER (WHERE is_claimed = true) as claimed
FROM accounts;
```

---

## 📍 10. Verificar API Keys (Segurança)

### Caminho:
```
Dashboard → Project Settings → API
```

### Onde clicar:
1. Menu lateral (scroll até o final) → **⚙️ Settings**
2. Sub-menu → **"API"**
3. Seção: **"Project API keys"**

### ✅ O que verificar:
Duas chaves devem estar visíveis:
1. **`anon` `public`** ✅ USO NO FRONTEND
   - Seguro para expor no código frontend
   - Acesso limitado por RLS

2. **`service_role` `secret`** ⚠️ NUNCA EXPOR
   - Bypass RLS - acesso total
   - Apenas para backend/Edge Functions
   - **NUNCA** incluir no código frontend

### 🔒 Verificação de segurança:
```bash
# No terminal do projeto, buscar por service_role no frontend
cd "/home/gabifran/Projeto Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main"
grep -r "service_role" src/

# Resultado esperado: NENHUM resultado (vazio)
```

---

## 📍 11. Configurar URL do Webhook no GGCheckout

### URL para configurar:
```
https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
```

### No painel do GGCheckout:
1. Login no dashboard do GGCheckout
2. Menu: **"Configurações"** ou **"Webhooks"**
3. Campo: **"Webhook URL"**
4. Cole a URL acima
5. Método: **POST**
6. Eventos: Selecione:
   - ✅ `payment.approved`
   - ✅ `payment.completed`
   - ✅ `payment.pending`
   - ✅ `payment.cancelled`

---

## 📍 12. Teste de Produção E2E

### Via Terminal (cURL):
```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjM5NTEsImV4cCI6MjA3Njk5OTk1MX0.OK4BkPJ0PWsDldSpNAin1NdzpeFIcKBn6FDgPaOIQhg" \
  -d '{
    "transaction_id": "PROD-TEST-001",
    "status": "approved",
    "product_id": "50k",
    "customer_email": "teste@producao.com",
    "customer_name": "Teste Produção",
    "amount": 29.90,
    "currency": "BRL"
  }'
```

### Validar resultado:

#### 1. Ver logs da função:
- Dashboard → Edge Functions → ggcheckout → Logs
- Deve mostrar: `✅ Order processed successfully`

#### 2. Ver pedido criado:
- Dashboard → SQL Editor → Execute:
```sql
SELECT * FROM orders WHERE external_id = 'PROD-TEST-001';
```

#### 3. Ver webhook logado:
```sql
SELECT * FROM webhook_logs WHERE external_id = 'PROD-TEST-001';
```

#### 4. Ver conta reservada:
```sql
SELECT 
  o.external_id,
  o.status,
  o.delivery_status,
  a.email as account_email,
  a.is_claimed
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE o.external_id = 'PROD-TEST-001';
```

---

## 📍 13. Dashboard de Monitoramento Rápido

### Criar "Favorite Queries" no SQL Editor:

#### Query: Status Geral
```sql
-- Salvar como "Webhook Status Dashboard"
SELECT 
  'Orders' as metric,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered
FROM orders

UNION ALL

SELECT 
  'Webhooks' as metric,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE status = 'received') as received,
  COUNT(*) FILTER (WHERE status = 'error') as errors
FROM webhook_logs

UNION ALL

SELECT 
  'Accounts' as metric,
  COUNT(*) as total,
  NULL as last_24h,
  COUNT(*) FILTER (WHERE is_claimed = false) as available,
  COUNT(*) FILTER (WHERE is_claimed = true) as claimed
FROM accounts;
```

### Salvar query favorita:
1. SQL Editor → Digite a query acima
2. Click em **"Save"** (💾)
3. Nome: "Webhook Status Dashboard"
4. Agora pode executar rapidamente sempre que precisar

---

## ✅ Checklist Visual Rápido

Marque cada item conforme valida no painel:

### Estrutura
- [ ] ✅ Tabela `orders` existe (Table Editor)
- [ ] ✅ Tabela `webhook_logs` existe (Table Editor)
- [ ] ✅ Tabela `accounts` existe (Table Editor)
- [ ] ✅ Campo `external_id` existe em orders (Table Editor → orders)

### Segurança
- [ ] ✅ RLS habilitada em `orders` (Authentication → Policies)
- [ ] ✅ RLS habilitada em `webhook_logs` (Authentication → Policies)
- [ ] ✅ Policy para `service_role` em `orders` (Authentication → Policies)
- [ ] ✅ Policy para `service_role` em `webhook_logs` (Authentication → Policies)

### Edge Function
- [ ] ✅ Função `ggcheckout` deployada (Edge Functions)
- [ ] ✅ Status: "Deployed" (Edge Functions → ggcheckout)
- [ ] ✅ Logs funcionando (Edge Functions → ggcheckout → Logs)

### Testes
- [ ] ✅ Teste E2E passou (SQL Editor + cURL)
- [ ] ✅ Pedido criado (Table Editor → orders)
- [ ] ✅ Webhook logado (Table Editor → webhook_logs)
- [ ] ✅ Conta reservada (Table Editor → orders → account_id preenchido)

### Monitoramento
- [ ] ✅ Query de dashboard salva (SQL Editor → Favorites)
- [ ] ✅ Estoque > 10 contas (SQL Editor ou Table Editor → accounts)

---

## 🎯 Atalhos Úteis no Painel

| Página | Atalho |
|--------|--------|
| Table Editor | `/dashboard/project/zcsyzddfmcvmxqqxqzsk/editor` |
| SQL Editor | `/dashboard/project/zcsyzddfmcvmxqqxqzsk/sql` |
| Edge Functions | `/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions` |
| Function Logs | `/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions/ggcheckout/logs` |
| Policies | `/dashboard/project/zcsyzddfmcvmxqqxqzsk/auth/policies` |
| API Settings | `/dashboard/project/zcsyzddfmcvmxqqxqzsk/settings/api` |

---

## 📚 Documentação Relacionada

- **Checklist completo**: `PRODUCTION_CHECKLIST.md`
- **Script de auditoria**: `scripts/audit-production.sql`
- **Setup do webhook**: `WEBHOOK_SETUP.md`
- **Testes locais**: `TESTING_GUIDE.md`
