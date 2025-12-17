# 🧪 Guia Rápido de Testes - GGCheckout Webhook

## ⚡ Teste Rápido (3 minutos)

### 1️⃣ Iniciar Supabase Local

```bash
cd "/home/gabifran/Projeto Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main"
supabase start
```

**Copie do output:**
- `anon key`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 2️⃣ Configurar Variável de Ambiente

```bash
# Cole a chave anon que você copiou
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3️⃣ Executar Testes Automatizados

```bash
./scripts/test-ggcheckout-webhook.sh
```

✅ **O script testa automaticamente:**
- Pagamento aprovado
- Idempotência (2 chamadas iguais)
- Pagamento pendente
- Pagamento cancelado
- Validação de payload
- Campos alternativos

---

## 🔍 Ver Logs em Tempo Real

**Terminal 1** (Executar testes):
```bash
./scripts/test-ggcheckout-webhook.sh
```

**Terminal 2** (Ver logs):
```bash
supabase functions logs ggcheckout --follow
```

---

## 📊 Verificar Resultados

### Via Supabase Studio (Interface Gráfica)

```bash
# Abrir studio local
http://localhost:54323
```

1. Clique em **"Table Editor"**
2. Selecione a tabela **"orders"**
3. Veja os pedidos criados
4. Verifique que `external_id` é único
5. Confira se `account_id` foi preenchido para pedidos aprovados

### Via SQL (Terminal)

```bash
# Ver pedidos criados
supabase db sql --local "
  SELECT 
    external_id, 
    status, 
    delivery_status, 
    account_id IS NOT NULL as has_account,
    created_at
  FROM orders
  ORDER BY created_at DESC
  LIMIT 10;
"

# Ver logs de webhook
supabase db sql --local "
  SELECT 
    external_id, 
    event_type, 
    status,
    created_at
  FROM webhook_logs
  ORDER BY created_at DESC
  LIMIT 10;
"

# Verificar idempotência (deve retornar 1)
supabase db sql --local "
  SELECT external_id, COUNT(*) as total
  FROM orders
  GROUP BY external_id
  HAVING COUNT(*) > 1;
"
```

---

## ✅ Resultados Esperados

### Teste 1: Pagamento Aprovado
- ✅ `orders.status` = `completed`
- ✅ `orders.delivery_status` = `delivered`
- ✅ `orders.account_id` ≠ `NULL` (conta reservada)
- ✅ `webhook_logs` tem 1 entrada

### Teste 2: Idempotência
- ✅ Apenas **1 pedido** criado (mesmo external_id)
- ✅ Segunda chamada retorna pedido existente
- ✅ `webhook_logs` tem **2 entradas** (ambos webhooks logados)

### Teste 3: Pagamento Pendente
- ✅ `orders.status` = `pending`
- ✅ `orders.delivery_status` = `pending`
- ✅ `orders.account_id` = `NULL` (sem conta)

### Teste 4: Pagamento Cancelado
- ✅ `orders.status` = `cancelled`
- ✅ `orders.delivery_status` = `pending`
- ✅ `orders.account_id` = `NULL`

### Teste 5: Payload Inválido
- ✅ HTTP 400 Bad Request
- ✅ Mensagem: "customer_email is required"
- ✅ **Nenhum pedido** criado

---

## 🐛 Troubleshooting

### ❌ Erro: "Cannot find module jq"

```bash
sudo apt install jq
```

### ❌ Erro: "SUPABASE_ANON_KEY não definida"

```bash
# Pegar a chave do output do 'supabase start'
export SUPABASE_ANON_KEY="cole_aqui"
```

### ❌ Erro: "Connection refused"

```bash
# Certifique-se que o Supabase está rodando
supabase status

# Se não estiver, inicie:
supabase start
```

### ❌ Edge Function não está executando

```bash
# Re-deploy da função localmente
supabase functions serve ggcheckout

# OU
supabase stop
supabase start
```

---

## 🎯 Teste Manual Simples

Se preferir testar manualmente sem o script:

```bash
# 1. Definir variáveis
export SUPABASE_ANON_KEY="sua-chave-aqui"
export WEBHOOK_URL="http://localhost:54321/functions/v1/ggcheckout"

# 2. Enviar webhook aprovado
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "transaction_id": "MANUAL-TEST-001",
    "status": "approved",
    "product_id": "produto-teste",
    "customer_email": "manual@example.com",
    "customer_name": "Teste Manual",
    "amount": 29.90,
    "currency": "BRL"
  }'

# 3. Verificar no banco
supabase db sql --local "SELECT * FROM orders WHERE external_id = 'MANUAL-TEST-001';"

# 4. Re-enviar (testar idempotência)
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "transaction_id": "MANUAL-TEST-001",
    "status": "approved",
    "product_id": "produto-teste",
    "customer_email": "manual@example.com",
    "customer_name": "Teste Manual",
    "amount": 29.90,
    "currency": "BRL"
  }'

# 5. Verificar que continua apenas 1 pedido
supabase db sql --local "SELECT COUNT(*) FROM orders WHERE external_id = 'MANUAL-TEST-001';"
```

---

## 🚀 Próximos Passos

Depois de validar localmente:

1. **Deploy para produção**:
   ```bash
   supabase db push
   supabase functions deploy ggcheckout
   ```

2. **Configurar webhook no GGCheckout**:
   - URL: `https://[PROJECT_ID].supabase.co/functions/v1/ggcheckout`

3. **Testar em produção** com os mesmos comandos (trocando a URL)

---

## 📚 Documentação Completa

- **Setup completo**: `WEBHOOK_SETUP.md`
- **Implementação técnica**: `IMPLEMENTATION_SUMMARY.md`
- **Instruções de deploy**: `DEPLOY_INSTRUCTIONS.md`
