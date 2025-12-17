# 📋 Exemplo de Logs Esperados - Testes do Webhook

Este documento mostra como devem aparecer os logs durante a execução dos testes do webhook.

---

## ✅ Teste 1: Pagamento Aprovado (Primeira Chamada)

### Log da Edge Function (supabase functions logs)

```
2025-12-15 10:30:15.123 | 📨 Webhook received: {
  external_id: 'TEST-1734262215',
  status: 'approved',
  product_id: 'produto-teste',
  customer_email: 'teste@example.com',
  timestamp: '2025-12-15T13:30:15.123Z'
}

2025-12-15 10:30:15.145 | 🔍 Processing transaction: {
  externalId: 'TEST-1734262215',
  status: 'approved',
  normalizedStatus: 'completed'
}

2025-12-15 10:30:15.156 | 📝 Creating new order...

2025-12-15 10:30:15.189 | 🎁 Delivering account to customer...

2025-12-15 10:30:15.234 | 🔒 Claiming account from stock (with lock)...

2025-12-15 10:30:15.267 | ✅ Account claimed successfully: {
  accountId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  email: 'conta001@game.com'
}

2025-12-15 10:30:15.289 | 📧 TODO: Send email with credentials

2025-12-15 10:30:15.301 | ✅ Order processed successfully: {
  orderId: 'b2c3d4e5-f6a7-8901-2345-678901bcdef0',
  externalId: 'TEST-1734262215',
  status: 'completed',
  productId: 'produto-teste',
  deliveryStatus: 'delivered',
  accountId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
}
```

### Output do Script de Teste

```
========================================
TESTE 1: Pagamento Aprovado (Primeira Chamada)
========================================

► Enviando pagamento aprovado...
Payload:
{
  "transaction_id": "TEST-1734262215",
  "status": "approved",
  "product_id": "produto-teste",
  "customer_email": "teste@example.com",
  "customer_name": "Cliente Teste",
  "customer_document": "12345678900",
  "customer_phone": "+5511999999999",
  "amount": 29.9,
  "currency": "BRL",
  "event": "payment.approved"
}

Status: 200
Response:
{
  "success": true,
  "order_id": "b2c3d4e5-f6a7-8901-2345-678901bcdef0",
  "external_id": "TEST-1734262215",
  "status": "completed",
  "delivery_status": "delivered",
  "account_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "message": "Order processed successfully"
}

✓ Request successful

ℹ Resultado esperado:
  - Pedido criado com status 'completed'
  - Delivery_status 'delivered'
  - Account reservada do estoque
  - Webhook registrado em webhook_logs
```

### Consulta SQL após o teste

```sql
SELECT * FROM orders WHERE external_id = 'TEST-1734262215';
```

**Resultado:**
| id | external_id | status | delivery_status | account_id | customer_email | amount | created_at |
|----|-------------|--------|-----------------|------------|----------------|--------|------------|
| b2c3d4e5... | TEST-1734262215 | completed | delivered | a1b2c3d4... | teste@example.com | 29.90 | 2025-12-15 10:30:15 |

---

## 🔄 Teste 2: Idempotência (Segunda Chamada - Mesmo Payload)

### Log da Edge Function

```
2025-12-15 10:30:17.456 | 📨 Webhook received: {
  external_id: 'TEST-1734262215',
  status: 'approved',
  product_id: 'produto-teste',
  customer_email: 'teste@example.com',
  timestamp: '2025-12-15T13:30:17.456Z'
}

2025-12-15 10:30:17.478 | 🔍 Processing transaction: {
  externalId: 'TEST-1734262215',
  status: 'approved',
  normalizedStatus: 'completed'
}

2025-12-15 10:30:17.489 | 🔄 Order already exists (idempotency): {
  orderId: 'b2c3d4e5-f6a7-8901-2345-678901bcdef0',
  status: 'completed'
}

2025-12-15 10:30:17.501 | ✅ Returning existing order (idempotency check passed)
```

### Output do Script de Teste

```
========================================
TESTE 2: Idempotência (Segunda Chamada - Mesmo Payload)
========================================

► Reenviando mesmo pagamento...
Payload:
{
  "transaction_id": "TEST-1734262215",
  "status": "approved",
  "product_id": "produto-teste",
  "customer_email": "teste@example.com",
  "customer_name": "Cliente Teste",
  "customer_document": "12345678900",
  "customer_phone": "+5511999999999",
  "amount": 29.9,
  "currency": "BRL",
  "event": "payment.approved"
}

Status: 200
Response:
{
  "success": true,
  "order_id": "b2c3d4e5-f6a7-8901-2345-678901bcdef0",
  "external_id": "TEST-1734262215",
  "status": "completed",
  "delivery_status": "delivered",
  "account_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "message": "Order already exists (idempotency)",
  "is_new": false
}

✓ Request successful

ℹ Resultado esperado:
  - Pedido NÃO duplicado
  - Retorna pedido existente
  - Account_id permanece o mesmo
  - Constraint UNIQUE (external_id) previne duplicação
```

### Consulta SQL - Verificar Idempotência

```sql
SELECT COUNT(*) as total FROM orders WHERE external_id = 'TEST-1734262215';
```

**Resultado:**
| total |
|-------|
| 1     |

✅ **Apenas 1 pedido criado, mesmo com 2 chamadas!**

```sql
SELECT COUNT(*) as total FROM webhook_logs WHERE external_id = 'TEST-1734262215';
```

**Resultado:**
| total |
|-------|
| 2     |

✅ **Ambas as chamadas foram registradas no log de auditoria!**

---

## ⏳ Teste 3: Pagamento Pendente

### Log da Edge Function

```
2025-12-15 10:30:19.678 | 📨 Webhook received: {
  external_id: 'TEST-PENDING-1734262215',
  status: 'pending',
  product_id: 'produto-teste',
  customer_email: 'pendente@example.com',
  timestamp: '2025-12-15T13:30:19.678Z'
}

2025-12-15 10:30:19.689 | 🔍 Processing transaction: {
  externalId: 'TEST-PENDING-1734262215',
  status: 'pending',
  normalizedStatus: 'pending'
}

2025-12-15 10:30:19.701 | 📝 Creating new order...

2025-12-15 10:30:19.734 | ⏳ Status is not approved - skipping account delivery

2025-12-15 10:30:19.745 | ✅ Order created (pending): {
  orderId: 'c3d4e5f6-a7b8-9012-3456-789012cdef01',
  externalId: 'TEST-PENDING-1734262215',
  status: 'pending',
  deliveryStatus: 'pending'
}
```

### Output do Script de Teste

```
========================================
TESTE 3: Pagamento Pendente
========================================

► Enviando pagamento pendente...
Payload:
{
  "transaction_id": "TEST-PENDING-1734262215",
  "status": "pending",
  "product_id": "produto-teste",
  "customer_email": "pendente@example.com",
  "customer_name": "Cliente Pendente",
  "amount": 29.9,
  "currency": "BRL",
  "event": "payment.pending"
}

Status: 200
Response:
{
  "success": true,
  "order_id": "c3d4e5f6-a7b8-9012-3456-789012cdef01",
  "external_id": "TEST-PENDING-1734262215",
  "status": "pending",
  "delivery_status": "pending",
  "account_id": null,
  "message": "Order created (pending approval)"
}

✓ Request successful

ℹ Resultado esperado:
  - Pedido criado com status 'pending'
  - Delivery_status 'pending'
  - Account NÃO reservada (aguardando aprovação)
  - Pedido pode ser atualizado depois com status approved
```

### Consulta SQL

```sql
SELECT * FROM orders WHERE external_id = 'TEST-PENDING-1734262215';
```

**Resultado:**
| id | external_id | status | delivery_status | account_id | customer_email | amount |
|----|-------------|--------|-----------------|------------|----------------|--------|
| c3d4e5f6... | TEST-PENDING-1734262215 | pending | pending | **NULL** | pendente@example.com | 29.90 |

✅ **Account_id = NULL - nenhuma conta foi reservada!**

---

## ❌ Teste 4: Payload Inválido (Sem Email)

### Log da Edge Function

```
2025-12-15 10:30:22.123 | 📨 Webhook received: {
  external_id: 'TEST-INVALID-1734262215',
  status: 'approved',
  product_id: 'produto-teste',
  timestamp: '2025-12-15T13:30:22.123Z'
}

2025-12-15 10:30:22.134 | ❌ Invalid payload: customer_email is required
```

### Output do Script de Teste

```
========================================
TESTE 5: Validação - Payload Inválido
========================================

► Enviando payload sem customer_email...
Payload:
{
  "transaction_id": "TEST-INVALID-1734262215",
  "status": "approved",
  "product_id": "produto-teste",
  "amount": 29.9
}

Status: 400
Response:
{
  "success": false,
  "error": "customer_email is required"
}

✗ Request failed

ℹ Resultado esperado:
  - Erro 400 (Bad Request)
  - Mensagem: customer_email is required
  - Pedido NÃO criado
```

### Consulta SQL

```sql
SELECT COUNT(*) FROM orders WHERE external_id = 'TEST-INVALID-1734262215';
```

**Resultado:**
| count |
|-------|
| 0     |

✅ **Nenhum pedido criado - validação funcionou!**

---

## 📊 Resumo Visual dos Testes

```
╔══════════════════════════════════════════════════════════════╗
║  TESTE 1: Pagamento Aprovado                                 ║
║  ✅ Pedido criado                                            ║
║  ✅ Account reservada                                        ║
║  ✅ Status: completed                                        ║
║  ✅ Delivery: delivered                                      ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  TESTE 2: Idempotência (2ª chamada)                          ║
║  ✅ Mesmo pedido retornado                                   ║
║  ✅ Sem duplicação                                           ║
║  ✅ Account_id inalterado                                    ║
║  ✅ Constraint UNIQUE funcionou                              ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  TESTE 3: Pagamento Pendente                                 ║
║  ✅ Pedido criado                                            ║
║  ✅ Account NÃO reservada (NULL)                             ║
║  ✅ Status: pending                                          ║
║  ✅ Delivery: pending                                        ║
╚══════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  TESTE 4: Payload Inválido                                   ║
║  ✅ Erro 400 retornado                                       ║
║  ✅ Pedido NÃO criado                                        ║
║  ✅ Validação funcionou                                      ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 🎯 O Que Validar nos Logs

### ✅ Logs Corretos (Esperados)

1. **Webhook Received**: Sempre deve aparecer primeiro
2. **Processing transaction**: Mostra o external_id sendo processado
3. **Creating new order** (1ª vez) OU **Order already exists** (idempotência)
4. **Delivering account** (apenas para status approved/paid/completed)
5. **Account claimed successfully** (apenas se tem estoque)
6. **Order processed successfully** (sucesso geral)

### ❌ Logs de Erro (Investigar)

1. **Failed to create order**: Problema no banco de dados
2. **Out of stock**: Sem contas disponíveis no estoque
3. **Failed to claim account**: Erro ao reservar conta
4. **Invalid payload**: Faltam campos obrigatórios
5. **Transaction already has an account**: Idempotência impediu re-entrega

---

## 🔍 Comandos para Acompanhar Logs

### Em Tempo Real (Local)

```bash
# Terminal 1: Executar testes
./scripts/test-ggcheckout-webhook.sh

# Terminal 2: Ver logs
supabase functions logs ggcheckout --follow
```

### Em Produção

```bash
supabase functions logs ggcheckout --project-ref zcsyzddfmcvmxqqxqzsk --follow
```

### Filtrar Logs Específicos

```bash
# Ver apenas erros
supabase functions logs ggcheckout | grep "❌\|Failed\|Error"

# Ver apenas sucessos
supabase functions logs ggcheckout | grep "✅"

# Ver external_id específico
supabase functions logs ggcheckout | grep "TEST-1734262215"
```

---

## 📚 Próximos Passos

Se os logs estão corretos:

1. ✅ **Validar no banco de dados** com as consultas SQL fornecidas
2. ✅ **Testar em produção** (substituir URL local por produção)
3. ✅ **Configurar webhook no GGCheckout** com a URL real
4. ✅ **Monitorar primeiras transações reais**

Se houver erros nos logs:

1. ❌ Verificar mensagem de erro específica
2. ❌ Consultar `WEBHOOK_SETUP.md` → Troubleshooting
3. ❌ Verificar se migrations foram aplicadas corretamente
4. ❌ Verificar se a função `claim_account_stock()` existe
