# 🚀 Deploy Instructions - Webhook GGCheckout

## 📋 Arquivos Criados

### 1. Migration SQL
- **Arquivo**: `supabase/migrations/20251215_create_orders_and_webhooks.sql`
- **Conteúdo**: Cria tabelas `orders` e `webhook_logs` com RLS

### 2. Edge Function
- **Arquivo**: `supabase/functions/ggcheckout/index.ts`
- **Conteúdo**: Webhook handler com validação, idempotência e integração com `claim_account_stock()`

### 3. Documentação
- **Arquivo**: `WEBHOOK_SETUP.md`
- **Conteúdo**: Manual completo de configuração e uso

### 4. Script de Teste
- **Arquivo**: `test_webhook.sh`
- **Conteúdo**: Testes automatizados de todos os cenários

---

## 🎯 Checklist de Deploy

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Passo 2: Login e Link

```bash
# Login
supabase login

# Link ao projeto
cd gacha-glimmer-lotto-21968-34820-25054-6-88685-main
supabase link --project-ref zcsyzddfmcvmxqqxqzsk
```

### Passo 3: Deploy da Migration

**Opção A: Via CLI (Recomendado)**
```bash
supabase db push
```

**Opção B: Manual no Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/editor
2. Abra o arquivo: `supabase/migrations/20251215_create_orders_and_webhooks.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Execute (▶️ Run)

### Passo 4: Deploy da Edge Function

```bash
supabase functions deploy ggcheckout
```

### Passo 5: Configurar Secrets (Opcional)

```bash
# Se o GGCheckout fornecer um secret/chave de autenticação
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET=sua_chave_aqui
```

### Passo 6: Verificar Deploy

```bash
# Listar funções deployadas
supabase functions list

# Testar endpoint
curl https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
# Deve retornar: {"error":"Method not allowed"}
```

---

## 🧪 Testes

### Teste Rápido (Manual)

```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TEST-001",
    "status": "paid",
    "product_id": "50k",
    "amount": 10.00
  }'
```

**Resultado esperado**:
```json
{
  "ok": true,
  "order_id": "uuid-aqui",
  "status": "completed",
  "message": "Order completed and account delivered"
}
```

### Teste Completo (Script)

```bash
cd /home/gabifran/Projeto\ Kauan
./test_webhook.sh
```

---

## ⚙️ Configurar no GGCheckout

1. Acesse o painel do GGCheckout
2. Vá em: **Configurações** → **Webhooks**
3. Adicione a URL:
   ```
   https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
   ```
4. Selecione eventos: **Pagamento Aprovado**, **Pendente**, **Cancelado**
5. Salve e teste

---

## 📊 Monitoramento

### Verificar Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions
2. Clique em **ggcheckout**
3. Aba **Logs**

### Consultar Dados no Banco

```sql
-- Últimos pedidos
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Últimos webhooks
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Webhooks com erro
SELECT * FROM webhook_logs WHERE processed = false;

-- Estoque disponível
SELECT product_id, COUNT(*) 
FROM accounts 
WHERE status = 'available' 
GROUP BY product_id;
```

---

## 🔧 Troubleshooting

### Problema: Migration falha ao rodar

**Solução**: Execute manualmente no SQL Editor do Supabase.

### Problema: Edge Function retorna 404

**Causa**: Não foi deployada corretamente.

**Solução**:
```bash
supabase functions deploy ggcheckout --project-ref zcsyzddfmcvmxqqxqzsk
```

### Problema: Webhook recebe mas não cria order

**Diagnóstico**:
1. Verificar logs da Edge Function
2. Consultar `webhook_logs`:
   ```sql
   SELECT * FROM webhook_logs WHERE processed = false ORDER BY created_at DESC LIMIT 5;
   ```

---

## ✅ Checklist Final

- [ ] Migration deployada (tabelas `orders` e `webhook_logs` existem)
- [ ] Edge Function deployada (endpoint responde)
- [ ] Teste manual executado com sucesso
- [ ] Script de teste executado (`./test_webhook.sh`)
- [ ] URL configurada no painel GGCheckout
- [ ] Logs da Edge Function monitorados
- [ ] Teste com pagamento real realizado

---

## 📚 Documentação Completa

Consulte `WEBHOOK_SETUP.md` para documentação detalhada incluindo:
- Payload esperado
- Variáveis de ambiente
- Todos os cenários de teste
- Segurança e boas práticas
- Monitoramento e troubleshooting

---

## 🎉 Pronto!

Após seguir todos os passos, o webhook estará funcionando e processando pagamentos automaticamente.

**Próximos passos sugeridos**:
1. Adicionar mais contas na tabela `accounts` (estoque)
2. Implementar envio de email com credenciais
3. Criar dashboard de vendas no frontend
4. Configurar alertas para webhooks com erro
