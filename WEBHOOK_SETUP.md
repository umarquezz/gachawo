# 🔔 Configuração do Webhook GGCheckout

Este documento descreve como configurar e usar o webhook do GGCheckout para processar pagamentos e entregar contas automaticamente.

---

## 📍 URL do Webhook

Após o deploy da Edge Function, a URL será:

```
https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
```

**Substitua** `zcsyzddfmcvmxqqxqzsk` pelo ID do seu projeto Supabase (visível em: Project Settings → API).

---

## 🚀 Deploy da Edge Function

### Pré-requisitos

1. Instalar Supabase CLI:
```bash
npm install -g supabase
```

2. Login no Supabase:
```bash
supabase login
```

3. Linkar ao projeto:
```bash
cd /home/gabifran/Projeto\ Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main
supabase link --project-ref zcsyzddfmcvmxqqxqzsk
```

### Deploy da Migration (Criar Tabelas)

```bash
# Rodar a migration SQL no Supabase
supabase db push

# OU executar manualmente:
# 1. Acesse https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/editor
# 2. Abra o arquivo: supabase/migrations/20251215_create_orders_and_webhooks.sql
# 3. Copie todo o conteúdo e execute no SQL Editor
```

### Deploy da Edge Function

```bash
# Deploy da função
supabase functions deploy ggcheckout

# Verificar se deployou com sucesso
supabase functions list
```

---

## 🔐 Variáveis de Ambiente

Configure as secrets no Supabase:

```bash
# OPCIONAL: Secret para validar assinatura do webhook
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=sua_chave_secreta_aqui
```

**Nota**: Se o GGCheckout não fornecer um secret/assinatura, você pode pular essa configuração. O webhook validará apenas o payload mínimo.

---

## ⚙️ Configuração no Painel GGCheckout

### Passo 1: Acessar Configurações de Webhook

1. Faça login no painel do **GGCheckout**
2. Navegue para: **Configurações** → **Webhooks** (ou **Integrações**)
3. Clique em **Adicionar Webhook** ou **Nova URL de Notificação**

### Passo 2: Configurar URL

**URL do Webhook**:
```
https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
```

**Método HTTP**: `POST`

**Eventos para Notificar** (marque todos):
- ✅ Pagamento Aprovado / Pago
- ✅ Pagamento Pendente
- ✅ Pagamento Cancelado
- ✅ Pagamento Falhou
- ✅ Reembolso

### Passo 3: Autenticação (se disponível)

Se o GGCheckout fornecer uma chave de autenticação/assinatura:

1. Copie o **Webhook Secret** fornecido pelo GGCheckout
2. Configure no Supabase:
```bash
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=o_secret_copiado_aqui
```

### Passo 4: Testar Webhook

No painel do GGCheckout, procure por:
- **Testar Webhook** ou **Enviar Teste**
- Clique para enviar um evento de teste
- Verifique os logs no Supabase (Dashboard → Edge Functions → ggcheckout → Logs)

---

## 📦 Payload Esperado

O webhook espera receber um JSON com os seguintes campos:

### Campos Obrigatórios

```json
{
  "transaction_id": "GGC123456789",  // OU "order_id" OU "external_id"
  "status": "paid",                   // Valores: paid, approved, completed, pending, cancelled, failed
  "product_id": "50k",                // ID do produto (50k, 60k, 70k, 80k, 90k, 115k)
  "amount": 10.00                     // Valor da compra
}
```

### Campos Opcionais (Recomendados)

```json
{
  "user_id": "uuid-do-usuario",       // UUID do usuário no Supabase (se disponível)
  "customer_email": "cliente@email.com",
  "customer_name": "João Silva",
  "customer_document": "12345678900",
  "event": "payment.approved",        // Tipo de evento
  "signature": "sha256_hash_here"     // Assinatura para validação
}
```

### Exemplo Completo

```json
{
  "transaction_id": "GGC-2025-001",
  "status": "paid",
  "product_id": "50k",
  "amount": 10.00,
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "customer_email": "joao@example.com",
  "customer_name": "João Silva",
  "customer_document": "12345678900",
  "event": "payment.approved",
  "paid_at": "2025-12-15T10:30:00Z"
}
```

---

## 🔄 Mapeamento de Status

O webhook mapeia automaticamente os status do GGCheckout para o sistema interno:

| Status GGCheckout | Status Interno | Ação |
|-------------------|----------------|------|
| `paid` | `completed` | ✅ Entrega conta automaticamente |
| `approved` | `completed` | ✅ Entrega conta automaticamente |
| `completed` | `completed` | ✅ Entrega conta automaticamente |
| `pending` | `pending` | ⏳ Aguarda confirmação |
| `cancelled` | `cancelled` | ❌ Cancela pedido |
| `canceled` | `cancelled` | ❌ Cancela pedido |
| `failed` | `failed` | ❌ Marca como falha |
| `refunded` | `cancelled` | ↩️ Marca como reembolsado |

---

## ✅ Funcionalidades Implementadas

### 1. ✅ Idempotência

- O mesmo `transaction_id` pode ser enviado múltiplas vezes
- Apenas 1 pedido será criado
- Webhooks duplicados retornam os dados do pedido existente

**Teste**:
```bash
# Enviar o mesmo payload 3x - apenas 1 order será criada
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TEST001","status":"paid","product_id":"50k","amount":10}'

# Verificar
SELECT COUNT(*) FROM orders WHERE transaction_id = 'TEST001';
-- Deve retornar 1
```

### 2. ✅ Concorrência (Lock)

- Usa `claim_account_stock()` com `FOR UPDATE SKIP LOCKED`
- 2 compras simultâneas receberão contas diferentes
- Impossível entregar a mesma conta 2x

### 3. ✅ Logs e Auditoria

Todos os webhooks recebidos são registrados em `webhook_logs`:

```sql
-- Ver últimos webhooks
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Ver webhooks com erro
SELECT * FROM webhook_logs WHERE processed = false;
```

### 4. ✅ Validação de Payload

- Campos obrigatórios: `transaction_id`, `status`, `product_id`
- Validação de tipos (amount deve ser número positivo)
- Retorna erro descritivo se payload for inválido

### 5. ✅ Respostas HTTP Corretas

- **200 OK**: Webhook processado (mesmo se houve erro no processamento)
- **401 Unauthorized**: Assinatura inválida (se configurado)
- **405 Method Not Allowed**: Método HTTP diferente de POST

**Por que sempre retornar 200?**
- Evita retries infinitos do GGCheckout
- Erros são logados em `webhook_logs` para revisão manual

---

## 🧪 Testes

### Teste 1: Webhook Manual (cURL)

```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjM5NTEsImV4cCI6MjA3Njk5OTk1MX0.OK4BkPJ0PWsDldSpNAin1NdzpeFIcKBn6FDgPaOIQhg" \
  -d '{
    "transaction_id": "TEST-001",
    "status": "paid",
    "product_id": "50k",
    "amount": 10.00,
    "customer_email": "teste@example.com"
  }'
```

**Verificar Resultado**:
```sql
-- Ver webhook log
SELECT * FROM webhook_logs WHERE payload->>'transaction_id' = 'TEST-001';

-- Ver order criada
SELECT * FROM orders WHERE transaction_id = 'TEST-001';

-- Ver conta entregue
SELECT o.*, a.email, a.password 
FROM orders o 
LEFT JOIN accounts a ON o.account_id = a.id 
WHERE o.transaction_id = 'TEST-001';
```

### Teste 2: Idempotência

```bash
# Enviar 3x o mesmo transaction_id
for i in {1..3}; do
  curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
    -H "Content-Type: application/json" \
    -d '{
      "transaction_id": "IDEMPOTENCY-TEST",
      "status": "paid",
      "product_id": "50k",
      "amount": 10.00
    }'
  echo ""
done

# Verificar: deve haver apenas 1 order
SELECT COUNT(*) FROM orders WHERE transaction_id = 'IDEMPOTENCY-TEST';
-- Resultado esperado: 1
```

### Teste 3: Falta de Estoque

```bash
# Tentar comprar produto sem estoque
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "NO-STOCK-TEST",
    "status": "paid",
    "product_id": "999k",
    "amount": 99.00
  }'

# Verificar: order deve ter status='failed' e delivery_status='failed'
SELECT status, delivery_status, error_message 
FROM orders 
WHERE transaction_id = 'NO-STOCK-TEST';
-- Resultado esperado: failed, failed, "Out of stock"
```

### Teste 4: Status Pendente

```bash
# Enviar webhook com status pendente
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "PENDING-TEST",
    "status": "pending",
    "product_id": "50k",
    "amount": 10.00
  }'

# Verificar: order criada mas sem conta entregue
SELECT status, delivery_status, account_id 
FROM orders 
WHERE transaction_id = 'PENDING-TEST';
-- Resultado esperado: pending, pending, NULL
```

---

## 📊 Monitoramento

### Dashboard SQL

```sql
-- Resumo geral
SELECT 
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered
FROM orders;

-- Últimos pedidos
SELECT 
  transaction_id,
  status,
  delivery_status,
  product_id,
  amount,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Webhooks com erro
SELECT 
  id,
  created_at,
  processing_error,
  payload
FROM webhook_logs
WHERE processed = false
ORDER BY created_at DESC;

-- Estoque disponível por produto
SELECT 
  product_id,
  COUNT(*) as available
FROM accounts
WHERE status = 'available'
GROUP BY product_id
ORDER BY product_id;
```

### Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions
2. Clique em **ggcheckout**
3. Vá para a aba **Logs**
4. Filtre por:
   - ✅ Sucesso: `Webhook processed successfully`
   - ❌ Erro: `Webhook processing error`
   - 🔄 Idempotência: `Order already exists`

---

## 🔧 Troubleshooting

### Problema: Webhook retorna 404

**Causa**: Edge Function não foi deployada ou URL incorreta

**Solução**:
```bash
# Verificar se função existe
supabase functions list

# Re-deploy se necessário
supabase functions deploy ggcheckout

# Testar localmente
supabase functions serve ggcheckout
```

### Problema: Pedido criado mas conta não entregue

**Causa**: Falta de estoque ou erro na função `claim_account_stock()`

**Diagnóstico**:
```sql
-- Verificar estoque
SELECT product_id, COUNT(*) 
FROM accounts 
WHERE status = 'available' 
GROUP BY product_id;

-- Ver erro do pedido
SELECT error_message FROM orders WHERE transaction_id = 'SEU_TRANSACTION_ID';

-- Ver logs do webhook
SELECT processing_error FROM webhook_logs WHERE payload->>'transaction_id' = 'SEU_TRANSACTION_ID';
```

**Solução**:
- Se sem estoque: Adicionar mais contas na tabela `accounts`
- Se erro na função: Verificar logs da Edge Function

### Problema: Webhooks duplicados criando múltiplas orders

**Causa**: Idempotência não está funcionando (transaction_id diferente a cada envio)

**Diagnóstico**:
```sql
-- Ver orders duplicadas para mesmo customer_email
SELECT customer_email, COUNT(*) 
FROM orders 
GROUP BY customer_email 
HAVING COUNT(*) > 1;
```

**Solução**:
- Verificar se o GGCheckout está enviando o mesmo `transaction_id` em retries
- Se não estiver, considerar usar `customer_email + product_id + amount` como chave única

### Problema: "Invalid signature"

**Causa**: Secret configurado mas assinatura não bate

**Solução**:
```bash
# 1. Verificar secret configurado
supabase secrets list

# 2. Re-configurar secret correto
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=chave_correta_aqui

# 3. Re-deploy da função
supabase functions deploy ggcheckout
```

---

## 🔐 Segurança

### Checklist de Segurança

- ✅ HTTPS obrigatório (Supabase fornece automaticamente)
- ✅ RLS habilitado nas tabelas `orders` e `webhook_logs`
- ✅ Service Role Key apenas no servidor (Edge Function)
- ✅ Validação de payload mínimo
- ⚠️ Validação de assinatura (TODO: implementar quando GGCheckout fornecer)
- ✅ Logs não expõem credenciais das contas
- ✅ Usuários só veem seus próprios pedidos

### Boas Práticas

1. **Nunca exponha o Service Role Key no frontend**
2. **Configure o Webhook Secret** assim que o GGCheckout fornecer
3. **Monitore a tabela `webhook_logs`** regularmente para detectar ataques
4. **Configure alertas** para webhooks com erro
5. **Faça backup do banco** antes de fazer mudanças

---

## 📚 Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)

---

## 📞 Suporte

**Em caso de problemas**:

1. Verificar logs da Edge Function no Supabase Dashboard
2. Consultar `webhook_logs` no SQL Editor
3. Revisar este documento
4. Verificar configuração no painel do GGCheckout

**Contato do Desenvolvedor**:
- Documentação criada em: 15/12/2025
- Versão: 1.0

---

## 🎯 Resumo - Quick Start

```bash
# 1. Deploy da Migration
supabase db push

# 2. Deploy da Edge Function
supabase functions deploy ggcheckout

# 3. Configurar no GGCheckout
# URL: https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout

# 4. Testar
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TEST","status":"paid","product_id":"50k","amount":10}'

# 5. Verificar
SELECT * FROM orders WHERE transaction_id = 'TEST';
```

✅ **Pronto! O webhook está configurado e funcionando.**
