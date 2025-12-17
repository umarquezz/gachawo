# 🎯 Passo a Passo - Teste com Compra Real

Este guia mostra como testar o webhook com uma compra real no GGCheckout e validar cada etapa no Supabase.

---

## 📋 Pré-requisitos

- ✅ Edge Function deployada
- ✅ Tabelas criadas (orders, webhook_logs, accounts)
- ✅ Estoque de contas disponível (>0 contas com `is_claimed = false`)
- ✅ URL do webhook configurada no GGCheckout

---

## 🧪 Parte 1: Teste com cURL (Desenvolvimento)

### Passo 1: Configurar ambiente

```bash
# Definir variáveis
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export WEBHOOK_URL="https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout"
```

### Passo 2: Enviar webhook de teste

```bash
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "transaction_id": "CURL-TEST-001",
    "status": "approved",
    "product_id": "50k-gemas",
    "amount": 29.90,
    "currency": "BRL",
    "customer_email": "curl.teste@example.com",
    "customer_name": "Teste cURL",
    "customer_document": "12345678900",
    "customer_phone": "+5511999999999",
    "event": "payment.approved",
    "payment_method": "pix",
    "created_at": "2025-12-15T10:30:00Z",
    "paid_at": "2025-12-15T10:30:15Z",
    "metadata": {
      "test": true,
      "method": "curl"
    }
  }'
```

**Resposta esperada (HTTP 200)**:
```json
{
  "ok": true,
  "order_id": "uuid-aqui",
  "status": "completed",
  "message": "Order processed successfully",
  "processing_time_ms": 234
}
```

### Passo 3: Validar no Supabase

#### 3.1 Ver order criada

**SQL Editor** → Nova query:
```sql
SELECT 
  id,
  external_id,
  status,
  delivery_status,
  customer_email,
  amount,
  currency,
  account_id,
  created_at
FROM orders
WHERE external_id = 'CURL-TEST-001';
```

**Resultado esperado**:
| external_id | status | delivery_status | account_id | customer_email |
|-------------|--------|-----------------|------------|----------------|
| CURL-TEST-001 | completed | delivered | uuid-conta | curl.teste@example.com |

✅ **Validações**:
- `status` = 'completed'
- `delivery_status` = 'delivered'
- `account_id` IS NOT NULL

#### 3.2 Ver account reservada

```sql
SELECT 
  o.external_id,
  o.delivery_status,
  a.id as account_id,
  a.email as account_email,
  a.password as account_password,
  a.is_claimed
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE o.external_id = 'CURL-TEST-001';
```

**Resultado esperado**:
| external_id | delivery_status | account_email | account_password | is_claimed |
|-------------|-----------------|---------------|------------------|------------|
| CURL-TEST-001 | delivered | conta001@game.com | senha123 | true |

✅ **Validações**:
- `account_email` e `account_password` preenchidos
- `is_claimed` = true (conta foi marcada como usada)

#### 3.3 Ver raw_payload completo

```sql
SELECT 
  external_id,
  raw_payload::jsonb
FROM orders
WHERE external_id = 'CURL-TEST-001';
```

**Resultado esperado**:
```json
{
  "transaction_id": "CURL-TEST-001",
  "status": "approved",
  "product_id": "50k-gemas",
  "amount": 29.90,
  "currency": "BRL",
  "customer_email": "curl.teste@example.com",
  "customer_name": "Teste cURL",
  "customer_document": "12345678900",
  "customer_phone": "+5511999999999",
  "event": "payment.approved",
  "payment_method": "pix",
  "created_at": "2025-12-15T10:30:00Z",
  "paid_at": "2025-12-15T10:30:15Z",
  "metadata": {
    "test": true,
    "method": "curl"
  }
}
```

✅ **Validação**: Todos os campos originais preservados

#### 3.4 Ver webhook logado

```sql
SELECT 
  id,
  external_id,
  event_type,
  status,
  payload::jsonb,
  processed_at,
  created_at
FROM webhook_logs
WHERE external_id = 'CURL-TEST-001';
```

✅ **Validações**:
- `status` = 'received'
- `payload` contém o JSON completo
- `processed_at` preenchido

---

## 🛒 Parte 2: Teste com Compra Real no GGCheckout

### Passo 1: Configurar webhook no GGCheckout

**Acessar painel do GGCheckout**:
1. Login em: https://ggcheckout.com/dashboard (ou URL fornecida)
2. Menu: **"Configurações"** → **"Webhooks"** ou **"Integrações"**

**Configurar webhook**:
```
URL: https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
Método: POST
Content-Type: application/json

Eventos para notificar:
☑️ payment.approved
☑️ payment.paid
☑️ payment.completed
☑️ payment.pending
☑️ payment.cancelled
☑️ payment.refunded
```

**Secret (se disponível)**:
- Se o GGCheckout fornecer um campo "Webhook Secret", copie a chave
- Configure no Supabase:
```bash
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=sua_chave_aqui \
  --project-ref zcsyzddfmcvmxqqxqzsk
```

### Passo 2: Criar produto de teste (se necessário)

No painel do GGCheckout:
1. Menu: **"Produtos"** → **"Novo Produto"**
2. Nome: "Teste Webhook - 1 Gem"
3. Preço: R$ 0,01 (ou menor valor permitido)
4. ID/SKU: `test-1gem`
5. Salvar

### Passo 3: Fazer compra de teste

**Opção A: Link de pagamento direto**
1. Copie o link do produto de teste
2. Abra em navegador anônimo (ou limpe cookies)
3. Preencha dados:
   - Nome: Teste Real Webhook
   - Email: **seu.email.real@gmail.com** (use um email real que você tenha acesso)
   - CPF: 123.456.789-00 (ou CPF válido)
   - Telefone: (11) 99999-9999

**Opção B: Integração frontend** (se disponível)
1. Acesse seu site: https://gacha-glimmer-lotto.lovable.app
2. Clique em comprar o produto mais barato
3. Complete o checkout

### Passo 4: Completar o pagamento

**Se PIX**:
1. Copie o código PIX ou QR Code
2. Pague pelo app do banco
3. Aguarde confirmação (1-30 segundos)

**Se Cartão de Crédito**:
1. Use cartão de teste fornecido pelo GGCheckout
   - Ex: `4111 1111 1111 1111` (Visa teste)
   - CVV: 123
   - Validade: 12/2030
2. Complete o pagamento

### Passo 5: Verificar logs em tempo real

**Abrir logs da Edge Function**:
```bash
supabase functions logs ggcheckout \
  --project-ref zcsyzddfmcvmxqqxqzsk \
  --follow
```

**OU via painel**:
- https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions/ggcheckout/logs

**Logs esperados** (após pagamento aprovado):
```
[timestamp] 📨 Webhook received: {
  external_id: 'GGC-2025-XXXXX',
  status: 'approved',
  product_id: 'test-1gem',
  customer_email: 'seu.email.real@gmail.com',
  timestamp: '2025-12-15T13:45:30.123Z'
}

[timestamp] 🔍 Processing transaction: {
  externalId: 'GGC-2025-XXXXX',
  status: 'approved',
  normalizedStatus: 'completed'
}

[timestamp] 📝 Creating new order...

[timestamp] 🎁 Delivering account to customer...

[timestamp] 🔒 Claiming account from stock (with lock)...

[timestamp] ✅ Account claimed successfully: {
  accountId: 'a1b2c3d4-e5f6-...',
  email: 'conta001@game.com'
}

[timestamp] 📧 TODO: Send email with credentials

[timestamp] ✅ Order processed successfully: {
  orderId: 'b2c3d4e5-f6a7-...',
  externalId: 'GGC-2025-XXXXX',
  status: 'completed',
  deliveryStatus: 'delivered',
  accountId: 'a1b2c3d4-e5f6-...'
}

[timestamp] ✅ Webhook processed successfully in 234ms
```

### Passo 6: Validar no Supabase

#### 6.1 Buscar por seu email

**SQL Editor**:
```sql
SELECT 
  id,
  external_id,
  status,
  delivery_status,
  customer_email,
  customer_name,
  product_id,
  amount,
  currency,
  account_id IS NOT NULL as has_account,
  created_at
FROM orders
WHERE customer_email = 'seu.email.real@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

✅ **Validar**:
- ✅ Linha existe
- ✅ `status` = 'completed'
- ✅ `delivery_status` = 'delivered'
- ✅ `has_account` = true

#### 6.2 Ver credenciais da conta entregue

```sql
SELECT 
  o.external_id,
  o.customer_email,
  o.product_id,
  o.amount,
  o.delivery_status,
  a.email as account_email,
  a.password as account_password,
  a.is_claimed
FROM orders o
LEFT JOIN accounts a ON o.account_id = a.id
WHERE o.customer_email = 'seu.email.real@gmail.com'
ORDER BY o.created_at DESC
LIMIT 1;
```

**Copie as credenciais**:
- `account_email`: conta que foi entregue
- `account_password`: senha da conta

✅ **Validar**:
- ✅ `account_email` e `account_password` NÃO são NULL
- ✅ `is_claimed` = true
- ✅ `delivery_status` = 'delivered'

#### 6.3 Ver payload completo enviado pelo GGCheckout

```sql
SELECT 
  external_id,
  customer_email,
  raw_payload::jsonb AS payload_completo
FROM orders
WHERE customer_email = 'seu.email.real@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Exemplo de payload real do GGCheckout**:
```json
{
  "id": "ggc_prod_12345",
  "transaction_id": "GGC-2025-ABC123-XYZ",
  "status": "approved",
  "product": {
    "id": "test-1gem",
    "name": "Teste Webhook - 1 Gem",
    "price": 0.01
  },
  "customer": {
    "name": "Teste Real Webhook",
    "email": "seu.email.real@gmail.com",
    "document": "12345678900",
    "phone": "+5511999999999"
  },
  "payment": {
    "method": "pix",
    "status": "paid",
    "amount": 0.01,
    "currency": "BRL",
    "paid_at": "2025-12-15T13:45:30Z"
  },
  "created_at": "2025-12-15T13:45:00Z",
  "updated_at": "2025-12-15T13:45:30Z"
}
```

✅ **Importante**: O formato exato pode variar - o webhook salva tudo no `raw_payload` para auditoria

#### 6.4 Ver log do webhook

```sql
SELECT 
  id,
  external_id,
  event_type,
  status,
  payload->'customer'->>'email' as customer_email,
  payload->'payment'->>'method' as payment_method,
  payload->'payment'->>'status' as payment_status,
  processed_at,
  created_at
FROM webhook_logs
WHERE payload->'customer'->>'email' = 'seu.email.real@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

✅ **Validar**:
- ✅ `status` = 'received'
- ✅ `payment_status` = 'paid' ou 'approved'
- ✅ `processed_at` preenchido

---

## 🧪 Parte 3: Teste de Idempotência

### Simular webhook duplicado

O GGCheckout pode enviar o mesmo webhook múltiplas vezes (retry). Vamos simular:

```bash
# Pegar o transaction_id da compra real
TRANSACTION_ID="GGC-2025-ABC123-XYZ"  # Substitua pelo real

# Enviar webhook duplicado
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "transaction_id": "'$TRANSACTION_ID'",
    "status": "approved",
    "product_id": "test-1gem",
    "amount": 0.01,
    "currency": "BRL",
    "customer_email": "seu.email.real@gmail.com",
    "event": "payment.approved"
  }'
```

### Verificar que não duplicou

```sql
-- Contar quantas orders existem com esse transaction_id
SELECT COUNT(*) as total
FROM orders
WHERE external_id = 'GGC-2025-ABC123-XYZ';
```

**Resultado esperado**: `1` (apenas 1 pedido)

```sql
-- Ver quantas vezes o webhook foi recebido
SELECT COUNT(*) as total_webhooks
FROM webhook_logs
WHERE external_id = 'GGC-2025-ABC123-XYZ';
```

**Resultado esperado**: `2` (webhook recebido 2x, mas apenas 1 pedido criado)

✅ **Idempotência funcionando**: Constraint UNIQUE preveniu duplicação

---

## 📊 Checklist de Validação Final

Após compra real, marque cada item:

### Order
- [ ] ✅ Order criada na tabela `orders`
- [ ] ✅ `external_id` = transaction_id do GGCheckout
- [ ] ✅ `status` = 'completed'
- [ ] ✅ `delivery_status` = 'delivered'
- [ ] ✅ `customer_email` = seu email real
- [ ] ✅ `account_id` IS NOT NULL
- [ ] ✅ `raw_payload` contém JSON completo

### Account
- [ ] ✅ Account existe na tabela `accounts`
- [ ] ✅ `account.email` preenchido
- [ ] ✅ `account.password` preenchido
- [ ] ✅ `account.is_claimed` = true
- [ ] ✅ FK `orders.account_id` → `accounts.id` correto

### Webhook Log
- [ ] ✅ Webhook logado na tabela `webhook_logs`
- [ ] ✅ `status` = 'received'
- [ ] ✅ `payload` contém JSON original
- [ ] ✅ `processed_at` preenchido

### Idempotência
- [ ] ✅ Apenas 1 order criada (mesmo com webhooks duplicados)
- [ ] ✅ Todos webhooks logados em `webhook_logs`
- [ ] ✅ Constraint UNIQUE funcionando

### Logs
- [ ] ✅ Logs da Edge Function mostram sucesso
- [ ] ✅ Sem erros nos logs
- [ ] ✅ Processing time < 1 segundo

---

## 🚨 Troubleshooting

### ❌ Order não foi criada

**Verificar**:
1. Webhook chegou?
```sql
SELECT * FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

2. Webhook tem erro?
```sql
SELECT 
  external_id,
  status,
  processing_error,
  payload
FROM webhook_logs
WHERE status = 'error'
  OR processing_error IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

3. URL do webhook está correta no GGCheckout?
   - Verificar configuração no painel

---

### ❌ Order criada mas sem account

**Verificar**:
```sql
SELECT 
  external_id,
  status,
  delivery_status,
  error_message,
  account_id
FROM orders
WHERE customer_email = 'seu.email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Possíveis causas**:
1. **Estoque vazio**: `error_message` = 'Out of stock'
   - Solução: Adicionar contas no estoque
   ```sql
   SELECT COUNT(*) FROM accounts WHERE is_claimed = false;
   ```

2. **Status não aprovado**: `status` = 'pending'
   - Normal se pagamento ainda não confirmado

3. **Erro no claim**: Ver logs da Edge Function

---

### ❌ Payload diferente do esperado

**Ver payload real**:
```sql
SELECT 
  external_id,
  raw_payload::jsonb
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**Comparar com documentação do GGCheckout**:
- Estrutura pode variar entre versões
- Webhook aceita qualquer campo adicional
- Campos obrigatórios: `status`, `product_id`, `transaction_id` (ou similar)

---

## ✅ Sucesso!

Se todos os itens do checklist passaram:

🎉 **Webhook funcionando perfeitamente em produção!**

### Próximos passos:
1. ✅ Implementar envio de email com credenciais (TODO no código)
2. ✅ Monitorar dashboard de pedidos
3. ✅ Configurar alertas de estoque baixo
4. ✅ Adicionar mais contas ao estoque regularmente

---

## 📚 Documentação Relacionada

- **Payloads reais**: `GGCHECKOUT_REAL_PAYLOAD.md`
- **Script de teste**: `scripts/test-ggcheckout-webhook.sh`
- **Checklist de produção**: `PRODUCTION_CHECKLIST.md`
- **Setup completo**: `WEBHOOK_SETUP.md`
