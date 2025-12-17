# 🐛 Guia de Debug do Webhook GGCheckout

## ✅ Deploy Concluído

A Edge Function foi atualizada com **logs defensivos detalhados** para identificar exatamente onde o webhook está falhando.

## 📊 Como Investigar o Erro

### 1. Ver Logs em Tempo Real

Acesse o dashboard do Supabase:
```
https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/logs/edge-functions
```

Procure por:
- `📥 Webhook received - Headers:` - Mostra headers recebidos
- `📥 Webhook received - Payload keys:` - Lista todas as chaves do JSON
- `📥 Webhook received - Payload data:` - Mostra valores extraídos
- `🔄 Step X:` - Progresso do processamento
- `❌ Step X FAILED:` - Onde falhou
- `💥 Webhook processing error` - Erro detalhado com stack trace

### 2. Queries SQL para Investigar

Execute no **SQL Editor** do Supabase:

#### A. Ver último webhook com erro:
```sql
SELECT 
  created_at,
  success,
  error_message,
  payload->>'event' as event,
  payload->'payment'->>'id' as payment_id,
  payload->'customer'->>'email' as customer_email,
  jsonb_pretty(payload) as payload_completo
FROM webhook_logs 
WHERE success = false
ORDER BY created_at DESC 
LIMIT 1;
```

#### B. Ver último pedido (ou falta dele):
```sql
SELECT 
  id,
  external_id,
  status,
  delivery_status,
  customer_email,
  product_id,
  error_message,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;
```

#### C. Verificar estoque por product_id:
```sql
SELECT 
  product_id,
  COUNT(*) as total_disponivel
FROM accounts 
WHERE status = 'available' 
  AND is_sold = false
GROUP BY product_id;
```

### 3. Testar Manualmente

Execute um webhook de teste:

```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "event": "pix.paid",
    "payment": {
      "id": "debug-test-'$(date +%s)'",
      "status": "paid",
      "amount": 100
    },
    "customer": {
      "email": "debug@teste.com",
      "name": "Debug Test"
    },
    "product": {
      "id": "RgdbLTKukcPtAeonlcJC",
      "price": 100
    }
  }'
```

Depois execute as queries acima para ver se funcionou.

## 🔍 Erros Comuns e Soluções

### Erro: "Missing status field in payload"

**Causa:** GGCheckout não enviou campo `status` nem `payment.status`

**Debug:** Veja no log `📥 Webhook received - Payload data:` quais campos vieram

**Solução:** Ajustar código para suportar outro campo (ex: `event`)

---

### Erro: "no_stock_for_product_id: XXXXXXX"

**Causa:** Não há contas disponíveis para esse product_id

**Debug:** Execute query C acima para ver estoque

**Solução:** Adicionar contas com o product_id correto:

```sql
INSERT INTO accounts (product_id, email, password, status, is_sold, created_at)
VALUES 
  ('RgdbLTKukcPtAeonlcJC', 'conta_real@email.com', 'senha123', 'available', false, NOW());
```

---

### Erro: "Missing transaction_id, order_id, external_id or payment.id"

**Causa:** GGCheckout não enviou nenhum ID único

**Debug:** Veja no log quais campos de ID vieram

**Solução:** Adicionar suporte para outro campo (ex: `webhook.id`)

---

### Erro: Webhook recebido mas não criou pedido

**Causa:** Erro antes de chegar em `processOrder()`

**Debug:** 
1. Veja logs no Dashboard
2. Procure por `🔄 Step X:` para saber onde parou
3. Execute query A para ver `error_message`

**Solução:** Depende do erro específico

---

### Erro: "Invalid signature"

**Causa:** Assinatura HMAC não bate

**Debug:** Veja no log se `x-signature: ***EXISTS***` ou `MISSING`

**Solução Temporária:** Remover secret para desabilitar validação:
```bash
supabase secrets unset GGCHECKOUT_WEBHOOK_SECRET
supabase functions deploy ggcheckout
```

---

## 📝 Checklist de Debug

Quando um webhook falhar:

- [ ] **1. Ver logs no Dashboard** - Identificar em qual Step falhou
- [ ] **2. Executar Query A** - Ver `error_message` no webhook_logs
- [ ] **3. Executar Query B** - Ver se pedido foi criado
- [ ] **4. Executar Query C** - Verificar estoque disponível
- [ ] **5. Comparar payload** - Ver se estrutura real bate com esperada
- [ ] **6. Ajustar código** - Corrigir campos faltando ou product_id
- [ ] **7. Redeploy** - `supabase functions deploy ggcheckout`
- [ ] **8. Testar novamente** - Clicar "Testar integração" no GGCheckout

## 🚀 Teste Após Correção

Após fazer qualquer correção:

1. **Deploy:**
```bash
cd "/home/gabifran/Projeto Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main"
supabase functions deploy ggcheckout
```

2. **Teste manual:**
```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "event": "pix.paid",
    "payment": {"id": "test-'$(date +%s)'", "status": "paid", "amount": 100},
    "customer": {"email": "teste@email.com", "name": "Teste"},
    "product": {"id": "RgdbLTKukcPtAeonlcJC", "price": 100}
  }'
```

3. **Verificar resultado:**
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

## 📞 Próximos Passos

Agora que os logs estão implementados:

1. **Faça um teste real** - Clique "Testar integração" no GGCheckout
2. **Veja os logs** - Acesse o Dashboard do Supabase
3. **Execute as queries** - Use as queries do arquivo `DEBUG_QUERIES.sql`
4. **Me envie os resultados:**
   - Screenshot dos logs
   - Resultado da Query A (último webhook)
   - Resultado da Query B (último pedido)
   - Resultado da Query C (estoque)

Com esses dados, consigo identificar o problema exato e corrigi-lo!
