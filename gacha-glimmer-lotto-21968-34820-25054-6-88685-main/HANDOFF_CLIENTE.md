# 📋 Guia de Operação - Webhook GGCheckout

## 🔗 1. Configuração do Webhook

### URL do Webhook:
```
https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
```

### Onde Configurar:
1. Acesse o painel do **GGCheckout**
2. Vá em **Configurações** → **Webhooks**
3. Cole a URL acima
4. Marque todos os eventos: **Pagamento Aprovado, Pendente, Cancelado**
5. Se houver campo de **Secret/Assinatura**, copie e guarde (já configurado: `GGCHECKOUT_WEBHOOK_SECRET`)

---

## ✅ 2. Como Validar se Está Funcionando

### Query 1: Ver últimos webhooks recebidos
```sql
SELECT 
  created_at,
  success,
  error_message,
  (payload::jsonb->>'transaction_id') as transaction_id,
  (payload::jsonb->>'status') as status
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**O que esperar:**
- ✅ `success = true` → Webhook processado com sucesso
- ❌ `success = false` + `error_message` → Ver seção de troubleshooting

### Query 2: Ver últimas entregas
```sql
SELECT 
  created_at,
  external_id,
  status,
  delivery_status,
  account_id,
  customer_email,
  amount
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

**O que esperar:**
- ✅ `status = "completed"` + `delivery_status = "delivered"` + `account_id` preenchido → **SUCESSO TOTAL**
- ⚠️ `status = "completed"` + `delivery_status = "pending"` → Conta não entregue (ver troubleshooting)
- ⏳ `status = "pending"` → Pagamento ainda não confirmado

---

## 📦 3. Como Adicionar Novas Contas no Estoque

### Campos Obrigatórios:
```sql
INSERT INTO accounts (product_id, email, password, status, is_sold)
VALUES 
  ('50k', 'conta@exemplo.com', 'senha123', 'available', false),
  ('50k', 'conta2@exemplo.com', 'senha456', 'available', false),
  ('50k', 'conta3@exemplo.com', 'senha789', 'available', false);
```

### Campos:
- `product_id`: Identificador do produto (ex: `50k`, `60k`, `70k`)
- `email`: Email da conta a ser entregue
- `password`: Senha da conta
- `status`: Sempre `'available'` para contas novas
- `is_sold`: Sempre `false` para contas novas

### Verificar Estoque Disponível:
```sql
SELECT 
  product_id,
  COUNT(*) as quantidade
FROM accounts
WHERE status = 'available' AND is_sold = false
GROUP BY product_id;
```

---

## ⚠️ 4. O Que Acontece Quando o Estoque Acaba

### Comportamento:
Quando não há contas disponíveis, o webhook:
1. ✅ Cria a order normalmente
2. ❌ Define `status = "failed"`
3. ❌ Define `delivery_status = "error"`
4. 📝 Adiciona `error_message = "Out of stock"`

### Como Ver Orders Sem Estoque:
```sql
SELECT 
  created_at,
  external_id,
  customer_email,
  product_id,
  error_message
FROM orders
WHERE delivery_status = 'error'
ORDER BY created_at DESC;
```

### Como Resolver:
1. Adicionar novas contas (ver seção 3)
2. As orders antigas **NÃO são reprocessadas automaticamente**
3. Para entregar manualmente, entre em contato com o suporte técnico

---

## 🔧 5. Troubleshooting Rápido

### ❌ Problema: "Invalid signature" (Assinatura Inválida)

**Sintomas:**
```sql
SELECT * FROM webhook_logs 
WHERE error_message = 'invalid_signature' 
ORDER BY created_at DESC LIMIT 5;
```

**Causas:**
- Secret configurado errado no Supabase
- GGCheckout mudou o secret
- GGCheckout não está enviando assinatura

**Solução:**
1. Verificar secret no painel do GGCheckout
2. Reconfigurar: `supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=novo_secret`
3. Fazer redeploy: `supabase functions deploy ggcheckout`

---

### ❌ Problema: Webhook Não Chegando

**Como Verificar:**
```sql
SELECT COUNT(*) as total_webhooks_hoje
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '24 hours';
```

Se retornar **0**, o webhook não está chegando.

**Causas:**
- URL incorreta no painel GGCheckout
- Firewall bloqueando
- GGCheckout com problema

**Solução:**
1. Verificar URL no painel GGCheckout (seção 1)
2. Testar manualmente com curl:
```bash
curl -X POST "https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TESTE-123",
    "status": "paid",
    "product_id": "50k",
    "amount": 10.00
  }'
```
3. Se curl funcionar mas webhook real não, problema está no GGCheckout

---

### ❌ Problema: Order Criada Mas Conta Não Entregue

**Sintomas:**
```sql
SELECT 
  external_id,
  status,
  delivery_status,
  account_id,
  error_message
FROM orders
WHERE status = 'completed' AND account_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Causas:**
- Estoque zerado (ver seção 4)
- Erro na tabela `accounts` (contas com status errado)

**Solução:**
1. Verificar estoque:
```sql
SELECT product_id, COUNT(*) FROM accounts 
WHERE status = 'available' AND is_sold = false 
GROUP BY product_id;
```
2. Se estoque = 0, adicionar contas (seção 3)
3. Se estoque > 0, verificar logs do Dashboard Supabase para erro específico

---

## ✅ 6. Checklist de Produção

Antes de ir para produção, confirme:

- [ ] **URL do webhook configurada** no painel GGCheckout
- [ ] **Secret configurado** (`GGCHECKOUT_WEBHOOK_SECRET` no Supabase)
- [ ] **Estoque de contas adicionado** (mínimo 10 contas por produto)
- [ ] **Teste com pagamento real** de R$ 1,00 realizado e conta entregue
- [ ] **Monitoramento configurado**: Verificar `webhook_logs` diariamente

### Queries de Monitoramento Diário:
```sql
-- 1. Total de vendas hoje
SELECT COUNT(*), SUM(amount) as total
FROM orders 
WHERE created_at > CURRENT_DATE;

-- 2. Estoque por produto
SELECT product_id, COUNT(*) 
FROM accounts 
WHERE status = 'available' AND is_sold = false 
GROUP BY product_id;

-- 3. Erros nas últimas 24h
SELECT error_message, COUNT(*) 
FROM webhook_logs 
WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_message;
```

---

## 📞 Suporte Técnico

Em caso de problemas não resolvidos por este guia:

1. **Verificar logs detalhados**: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/logs/edge-functions
2. **Consultar documentação completa**: Ver arquivos `WEBHOOK_SETUP.md`, `TESTING_GUIDE.md`, `PRODUCTION_CHECKLIST.md`
3. **Contato**: [Inserir informações de contato do suporte técnico]

---

**Última atualização:** 15/12/2025  
**Versão do Webhook:** v9 (100% funcional)
