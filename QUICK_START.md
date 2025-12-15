# 🎯 Quick Start Guide - GGCheckout Webhook

## ⚡ Deploy em 5 Minutos

### 1️⃣ Pré-requisitos
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login
```

### 2️⃣ Deploy do Banco de Dados
```bash
cd gacha-glimmer-lotto-21968-34820-25054-6-88685-main

# Opção A: CLI (Recomendado)
supabase db push

# Opção B: Manual
# 1. Abra: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/editor
# 2. Copie: supabase/migrations/20251215_create_orders_and_webhooks.sql
# 3. Cole no SQL Editor e execute
```

### 3️⃣ Deploy da Edge Function
```bash
supabase functions deploy ggcheckout
```

### 4️⃣ Configurar GGCheckout
```
URL: https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
Eventos: ✅ Pagamento Aprovado/Pago
```

### 5️⃣ Testar
```bash
cd ..
./test_webhook.sh
```

---

## 📁 Estrutura de Arquivos

```
Projeto Kauan/
├── 📄 IMPLEMENTATION_SUMMARY.md    ← LEIA PRIMEIRO (resumo executivo)
├── 📄 DEPLOY_INSTRUCTIONS.md       ← Instruções de deploy
├── 📄 WEBHOOK_SETUP.md             ← Documentação completa
├── 🧪 test_webhook.sh              ← Script de testes
├── 📄 REPORT_CHECKOUT_FLOW.md      ← Auditoria do projeto
├── 📄 COPILOT_TASK.md              ← Guidelines
│
└── gacha-glimmer-lotto-21968.../
    └── supabase/
        ├── migrations/
        │   └── 20251215_create_orders_and_webhooks.sql  ← Tabelas
        └── functions/
            └── ggcheckout/
                └── index.ts                              ← Webhook
```

---

## ✅ Checklist Rápido

```
[ ] Supabase CLI instalado
[ ] Login feito (supabase login)
[ ] Migration rodada (tabelas criadas)
[ ] Edge Function deployada
[ ] URL configurada no GGCheckout
[ ] Teste executado (./test_webhook.sh)
[ ] Pagamento real testado
```

---

## 🔍 Verificar se Funcionou

### No Supabase Dashboard

**1. Verificar Tabelas**
```sql
-- No SQL Editor
SELECT * FROM orders LIMIT 1;
SELECT * FROM webhook_logs LIMIT 1;
```
Se retornar sem erro → ✅ Tabelas criadas

**2. Verificar Edge Function**
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/functions
- Deve aparecer: `ggcheckout` na lista
- Se aparecer → ✅ Function deployada

**3. Testar Endpoint**
```bash
curl https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout
```
Resposta esperada: `{"error":"Method not allowed"}`  
Se retornar isso → ✅ Endpoint funcionando

### Teste Manual Completo

```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "MANUAL-TEST-001",
    "status": "paid",
    "product_id": "50k",
    "amount": 10.00,
    "customer_email": "test@example.com"
  }'
```

**Resposta esperada**:
```json
{
  "ok": true,
  "order_id": "uuid-aqui",
  "status": "completed",
  "message": "Order completed and account delivered"
}
```

Se retornar isso → ✅ Webhook funcionando 100%

**Verificar no banco**:
```sql
SELECT * FROM orders WHERE transaction_id = 'MANUAL-TEST-001';
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;
```

---

## 🚨 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| `supabase: command not found` | `npm install -g supabase` |
| `Error: Not logged in` | `supabase login` |
| Migration falha | Execute manualmente no SQL Editor |
| Edge Function 404 | `supabase functions deploy ggcheckout` |
| Webhook não cria order | Verificar logs: Dashboard → Functions → ggcheckout → Logs |
| "Out of stock" | Adicionar contas em `accounts` table |

---

## 🎓 Arquivos de Referência

| Precisa de... | Consulte |
|---------------|----------|
| Visão geral da implementação | `IMPLEMENTATION_SUMMARY.md` |
| Instruções detalhadas de deploy | `DEPLOY_INSTRUCTIONS.md` |
| Documentação completa do webhook | `WEBHOOK_SETUP.md` |
| Análise do projeto original | `REPORT_CHECKOUT_FLOW.md` |
| Testar funcionamento | `./test_webhook.sh` |

---

## 💡 Dicas

1. **Antes de fazer deploy em produção**: Teste com valores pequenos
2. **Monitore os logs**: Primeira semana, verificar diariamente
3. **Adicione estoque**: Pelo menos 10 contas de cada produto
4. **Configure alertas**: Para webhooks com erro
5. **Backup**: Sempre antes de mudanças no banco

---

## 📞 Precisa de Ajuda?

1. ✅ Verificar `WEBHOOK_SETUP.md` (seção Troubleshooting)
2. ✅ Consultar logs da Edge Function no Supabase
3. ✅ Verificar `webhook_logs` no banco
4. ✅ Rodar `./test_webhook.sh` para diagnóstico
5. ✅ Revisar este documento

---

## 🎉 Pronto para Deploy?

```bash
# 1 minuto ⏱️
supabase db push

# 1 minuto ⏱️
supabase functions deploy ggcheckout

# 2 minutos ⏱️
# Configurar no painel GGCheckout

# 1 minuto ⏱️
./test_webhook.sh

# TOTAL: ~5 minutos
```

**Sucesso** = Webhook processando pagamentos e entregando contas automaticamente! 🚀
