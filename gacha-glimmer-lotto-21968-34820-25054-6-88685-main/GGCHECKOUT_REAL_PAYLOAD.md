# 📋 Payload Real do GGCheckout - Documentação

Este documento mostra o payload **REAL** enviado pelo GGCheckout nos webhooks.

---

## 🔍 Campos do Webhook Recebidos

Baseado na análise do código `supabase/functions/ggcheckout/index.ts`:

### ✅ Campos Obrigatórios

| Campo | Tipo | Descrição | Validação |
|-------|------|-----------|-----------|
| `status` | string | Status do pagamento | **OBRIGATÓRIO** |
| `product_id` | string | ID do produto comprado | **OBRIGATÓRIO** |
| `transaction_id` OU `order_id` OU `external_id` | string | ID único da transação | **OBRIGATÓRIO** (um dos 3) |
| `amount` | number | Valor pago | Opcional, mas deve ser > 0 se enviado |

### ⚠️ Campos Opcionais mas Recomendados

| Campo | Tipo | Descrição | Uso |
|-------|------|-----------|-----|
| `customer_email` | string | Email do cliente | Recomendado para entrega |
| `customer_name` | string | Nome do cliente | Identificação |
| `customer_document` | string | CPF/CNPJ | Identificação fiscal |
| `customer_phone` | string | Telefone | Contato |
| `currency` | string | Moeda (BRL, USD, etc) | Default: 'BRL' |
| `event` | string | Tipo do evento | Ex: 'payment.approved' |
| `user_id` | string | ID do usuário no sistema | Para vincular ao auth.users |
| `signature` | string | Assinatura do webhook | Para validação de autenticidade |

### 📝 Campos Extras

O webhook aceita **qualquer campo adicional** através de `[key: string]: any`.
Todos os campos são salvos no `raw_payload` (jsonb) para auditoria completa.

---

## 📄 Exemplos de Payloads Reais

### Exemplo 1: Pagamento Aprovado (Completo)

```json
{
  "transaction_id": "GGC-2025-001-ABC123",
  "status": "approved",
  "product_id": "50k-gemas",
  "amount": 29.90,
  "currency": "BRL",
  "customer_email": "cliente@example.com",
  "customer_name": "João Silva",
  "customer_document": "12345678900",
  "customer_phone": "+5511999999999",
  "event": "payment.approved",
  "created_at": "2025-12-15T10:30:00Z",
  "paid_at": "2025-12-15T10:30:15Z",
  "payment_method": "pix",
  "metadata": {
    "referral_code": "PROMO2025",
    "utm_source": "instagram"
  }
}
```

**Resultado esperado**:
- ✅ Pedido criado com `status = 'completed'`
- ✅ Account reservada do estoque
- ✅ `delivery_status = 'delivered'`
- ✅ `external_id = 'GGC-2025-001-ABC123'`

---

### Exemplo 2: Pagamento Pendente (PIX aguardando)

```json
{
  "order_id": "ORDER-2025-002",
  "status": "pending",
  "product_id": "100k-gemas",
  "amount": 49.90,
  "currency": "BRL",
  "customer_email": "cliente2@example.com",
  "customer_name": "Maria Santos",
  "event": "payment.pending",
  "payment_method": "pix",
  "qr_code": "00020126580014br.gov.bcb.pix...",
  "expires_at": "2025-12-15T11:00:00Z"
}
```

**Resultado esperado**:
- ✅ Pedido criado com `status = 'pending'`
- ⏳ Account **NÃO** reservada (aguardando pagamento)
- ⏳ `delivery_status = 'pending'`
- ✅ `external_id = 'ORDER-2025-002'`

---

### Exemplo 3: Pagamento Cancelado

```json
{
  "external_id": "EXT-2025-003",
  "status": "cancelled",
  "product_id": "200k-gemas",
  "amount": 99.90,
  "customer_email": "cliente3@example.com",
  "event": "payment.cancelled",
  "cancelled_at": "2025-12-15T10:45:00Z",
  "cancellation_reason": "timeout"
}
```

**Resultado esperado**:
- ✅ Pedido criado com `status = 'cancelled'`
- ❌ Account **NÃO** reservada
- ❌ `delivery_status = 'pending'`

---

### Exemplo 4: Payload Mínimo (apenas campos obrigatórios)

```json
{
  "transaction_id": "MIN-001",
  "status": "paid",
  "product_id": "test-product"
}
```

**Resultado esperado**:
- ✅ Pedido criado com `status = 'completed'`
- ⚠️ Account reservada (se houver estoque)
- ⚠️ Sem email - não pode enviar credenciais

---

## 🔄 Mapeamento de Status

O webhook mapeia automaticamente o status recebido:

| Status GGCheckout | Status Interno | Ação |
|-------------------|----------------|------|
| `paid` | `completed` | ✅ Reserva conta |
| `approved` | `completed` | ✅ Reserva conta |
| `completed` | `completed` | ✅ Reserva conta |
| `pending` | `pending` | ⏳ Aguarda aprovação |
| `cancelled` | `cancelled` | ❌ Não reserva |
| `canceled` | `cancelled` | ❌ Não reserva |
| `failed` | `failed` | ❌ Não reserva |
| `refunded` | `cancelled` | ❌ Não reserva |

**Código fonte** (linha 16-25 de `index.ts`):
```typescript
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
```

---

## 🧪 Como Testar com Payload Real

### 1️⃣ Teste com cURL (desenvolvimento)

```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "transaction_id": "TEST-REAL-PAYLOAD-001",
    "status": "approved",
    "product_id": "50k-gemas",
    "amount": 29.90,
    "currency": "BRL",
    "customer_email": "teste.real@example.com",
    "customer_name": "Teste Payload Real",
    "customer_document": "12345678900",
    "customer_phone": "+5511999999999",
    "event": "payment.approved",
    "payment_method": "pix",
    "created_at": "2025-12-15T10:30:00Z",
    "paid_at": "2025-12-15T10:30:15Z"
  }'
```

### 2️⃣ Teste com Script Automatizado

```bash
# Usar o script atualizado
./scripts/test-ggcheckout-webhook.sh
```

O script agora envia payloads **realistas** simulando o GGCheckout.

### 3️⃣ Teste com Compra Real no GGCheckout

**Passo 1: Configurar webhook no painel GGCheckout**
```
URL: https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
Eventos: payment.approved, payment.pending, payment.cancelled
```

**Passo 2: Fazer compra de teste**
- Use um produto de baixo valor (ex: R$ 0,01 se disponível)
- Complete o pagamento (PIX ou cartão)

**Passo 3: Verificar no Supabase**

a) **Order inserida**:
```sql
SELECT * FROM orders 
WHERE customer_email = 'seu-email@example.com'
ORDER BY created_at DESC 
LIMIT 1;
```

Verificar:
- ✅ `external_id` = transaction_id do GGCheckout
- ✅ `status` = 'completed'
- ✅ `delivery_status` = 'delivered'
- ✅ `raw_payload` contém o JSON completo

b) **Account reservada**:
```sql
SELECT 
  o.external_id,
  o.status,
  o.delivery_status,
  o.account_id,
  a.email as account_email,
  a.password as account_password,
  a.is_claimed
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE o.customer_email = 'seu-email@example.com'
ORDER BY o.created_at DESC
LIMIT 1;
```

Verificar:
- ✅ `account_id` IS NOT NULL
- ✅ `account_email` e `account_password` preenchidos
- ✅ `is_claimed` = true

c) **Webhook logado**:
```sql
SELECT 
  id,
  external_id,
  event_type,
  status,
  payload,
  processed_at,
  created_at
FROM webhook_logs
WHERE payload->>'customer_email' = 'seu-email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Verificar:
- ✅ `status` = 'received'
- ✅ `payload` contém o JSON completo enviado pelo GGCheckout

---

## 📊 Validação do raw_payload

O campo `raw_payload` na tabela `orders` guarda o JSON completo:

```sql
-- Ver payload completo de um pedido
SELECT 
  external_id,
  raw_payload::jsonb
FROM orders
WHERE external_id = 'GGC-2025-001-ABC123';
```

**Exemplo de resultado**:
```json
{
  "transaction_id": "GGC-2025-001-ABC123",
  "status": "approved",
  "product_id": "50k-gemas",
  "amount": 29.90,
  "currency": "BRL",
  "customer_email": "cliente@example.com",
  "customer_name": "João Silva",
  "customer_document": "12345678900",
  "customer_phone": "+5511999999999",
  "event": "payment.approved",
  "created_at": "2025-12-15T10:30:00Z",
  "paid_at": "2025-12-15T10:30:15Z",
  "payment_method": "pix",
  "metadata": {
    "referral_code": "PROMO2025",
    "utm_source": "instagram"
  }
}
```

✅ **Todos os campos originais preservados para auditoria**

---

## 🔍 Logs do Webhook

O webhook loga automaticamente:

### Console logs (Supabase Functions → Logs):
```
📨 Webhook received: {
  external_id: 'GGC-2025-001-ABC123',
  status: 'approved',
  product_id: '50k-gemas',
  customer_email: 'cliente@example.com',
  timestamp: '2025-12-15T13:30:15.123Z'
}

🔍 Processing transaction: {
  externalId: 'GGC-2025-001-ABC123',
  status: 'approved',
  normalizedStatus: 'completed'
}

📝 Creating new order...

🎁 Delivering account to customer...

🔒 Claiming account from stock (with lock)...

✅ Account claimed successfully: {
  accountId: 'a1b2c3d4-...',
  email: 'conta001@game.com'
}

✅ Order processed successfully: {
  orderId: 'b2c3d4e5-...',
  externalId: 'GGC-2025-001-ABC123',
  status: 'completed',
  deliveryStatus: 'delivered',
  accountId: 'a1b2c3d4-...'
}
```

### Database logs (webhook_logs table):
```sql
SELECT 
  external_id,
  event_type,
  status,
  error_message,
  processed_at,
  created_at,
  -- Ver payload completo
  payload::jsonb AS full_payload
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🚨 Troubleshooting

### ❌ Erro: "Missing required field: customer_email"

**Payload enviado**:
```json
{
  "transaction_id": "TEST-001",
  "status": "approved",
  "product_id": "50k"
  // Falta customer_email
}
```

**Solução**: 
- `customer_email` não é obrigatório na validação
- Mas é obrigatório no banco (NOT NULL)
- Adicione o campo no payload

---

### ❌ Erro: "Invalid amount: must be a positive number"

**Payload enviado**:
```json
{
  "transaction_id": "TEST-002",
  "status": "approved",
  "product_id": "50k",
  "amount": "29.90"  // String, não number
}
```

**Solução**: Envie `amount` como number:
```json
{
  "amount": 29.90
}
```

---

### ⚠️ Pedido criado mas conta não entregue

**Verificar**:
```sql
SELECT 
  external_id,
  status,
  delivery_status,
  error_message
FROM orders
WHERE external_id = 'seu-transaction-id';
```

**Possíveis causas**:
1. **Status não aprovado**: `status` = 'pending' → Não entrega até aprovar
2. **Sem estoque**: `error_message` = 'Out of stock'
3. **Erro no claim**: Verificar logs da Edge Function

---

## 📚 Documentação Relacionada

- **Script de teste**: `scripts/test-ggcheckout-webhook.sh`
- **Setup completo**: `WEBHOOK_SETUP.md`
- **Checklist de produção**: `PRODUCTION_CHECKLIST.md`
- **Código fonte**: `supabase/functions/ggcheckout/index.ts`
