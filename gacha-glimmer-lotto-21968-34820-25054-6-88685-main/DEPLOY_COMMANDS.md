# 🚀 Comandos de Deploy - Webhook GGCheckout

## 📦 Deploy Completo (Execute na ordem)

### 1. Login no Supabase
```bash
supabase login
```

### 2. Vincular ao Projeto
```bash
supabase link --project-ref zcsyzddfmcvmxqqxqzsk
```

### 3. Configurar Secret do Webhook
```bash
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET="9fA7QmLx3RZkT2eH8VbCwYJ5uN6D4P0SgK"
```

### 4. Deploy da Edge Function
```bash
supabase functions deploy ggcheckout
```

---

## 📊 Monitoramento

### Ver logs em tempo real (últimos 50 eventos)
```bash
supabase functions logs ggcheckout --limit 50
```

### Ver logs continuamente (modo watch)
```bash
supabase functions logs ggcheckout --limit 50 --follow
```

---

## 🔄 Redeploy Rápido

Se fizer alterações no código:
```bash
cd /home/gabifran/Projeto\ Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main
supabase functions deploy ggcheckout
```

---

## ✅ Verificar Deployment

### Listar funções deployadas
```bash
supabase functions list
```

### Verificar secrets configurados
```bash
supabase secrets list
```

---

## 🧪 Teste Rápido Após Deploy

```bash
curl -X POST "https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4OTQwNzMsImV4cCI6MjA0NTQ3MDA3M30.7bdc57ce9f93d68acf324a9cf4135eea0db1fa1db8ad7f27b5e95cea9c3f6b1f" \
  -d '{
    "transaction_id": "DEPLOY-TEST-'$(date +%s)'",
    "status": "paid",
    "product_id": "50k",
    "amount": 10.00,
    "customer_email": "teste@example.com"
  }'
```

**Resposta esperada:**
```json
{
  "ok": true,
  "order_id": "...",
  "status": "completed",
  "message": "Order completed and account delivered"
}
```

---

## 🎯 Script de Deploy Completo

Copie e execute tudo de uma vez:
```bash
#!/bin/bash
cd /home/gabifran/Projeto\ Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main

echo "🔐 Configurando secret..."
supabase secrets set GGCHECKOUT_WEBHOOK_SECRET="9fA7QmLx3RZkT2eH8VbCwYJ5uN6D4P0SgK"

echo "🚀 Fazendo deploy..."
supabase functions deploy ggcheckout

echo "✅ Deploy concluído!"
echo "📊 Verificando status..."
supabase functions list

echo ""
echo "✨ Webhook URL: https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout"
echo "📝 Para ver logs: supabase functions logs ggcheckout --limit 50"
```

---

**Última atualização:** 15/12/2025  
**Secret configurado:** ✅ `9fA7QmLx3RZkT2eH8VbCwYJ5uN6D4P0SgK`
