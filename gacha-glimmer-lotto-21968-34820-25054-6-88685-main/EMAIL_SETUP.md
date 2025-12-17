# 📧 Configuração de Envio de Email Automático

## ✅ Implementação Completa

O sistema agora envia automaticamente as credenciais por email após cada venda aprovada.

## 🚀 Como Configurar (Resend - Gratuito)

### 1. Criar Conta no Resend

1. Acesse: https://resend.com/signup
2. Crie uma conta gratuita (3.000 emails/mês grátis)
3. Confirme seu email

### 2. Obter API Key

1. Acesse: https://resend.com/api-keys
2. Clique em "Create API Key"
3. Nome: `supabase-webhook`
4. Permissão: "Sending access"
5. Copie a API Key (começa com `re_...`)

### 3. Configurar no Supabase

Execute no terminal:

```bash
cd "/home/gabifran/Projeto Kauan/gacha-glimmer-lotto-21968-34820-25054-6-88685-main"

# Configurar a API Key
supabase secrets set RESEND_API_KEY="re_sua_api_key_aqui"

# Deploy da nova versão
supabase functions deploy ggcheckout
```

### 4. Verificar Configuração

```bash
# Ver todos os secrets configurados
supabase secrets list
```

Deve mostrar:
- `GGCHECKOUT_WEBHOOK_SECRET`
- `RESEND_API_KEY`

## 📝 Personalizar o Email

### Mudar o Remetente (Recomendado)

Por padrão, o email vem de `onboarding@resend.dev`. Para usar seu próprio domínio:

1. No Resend, vá em "Domains"
2. Clique em "Add Domain"
3. Adicione seu domínio (ex: `seusite.com`)
4. Configure os registros DNS conforme instruções
5. Aguarde verificação (5-10 minutos)

Depois, edite o arquivo `index.ts` linha ~660:

```typescript
from: 'Sua Loja <noreply@seudominio.com>',
```

E faça deploy novamente:
```bash
supabase functions deploy ggcheckout
```

### Mudar o Template do Email

Edite o arquivo `supabase/functions/ggcheckout/index.ts` na função `sendEmailWithCredentials()` (linha ~648).

Você pode personalizar:
- Cores (atualmente roxo `#667eea`)
- Textos e mensagens
- Logo da empresa
- Informações de suporte

Após editar, faça deploy:
```bash
supabase functions deploy ggcheckout
```

## 🧪 Testar Email

Execute este comando para simular uma venda e testar o envio:

```bash
curl -X POST https://zcsyzddfmcvmxqqxqzsk.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -d '{
    "event": "pix.paid",
    "payment": {
      "id": "test-email-'$(date +%s)'",
      "status": "paid",
      "amount": 100
    },
    "customer": {
      "email": "SEU_EMAIL_AQUI@gmail.com",
      "name": "Teste Email"
    },
    "product": {
      "id": "RgdbLTKukcPtAeonlcJC",
      "price": 100
    }
  }'
```

**Substitua `SEU_EMAIL_AQUI@gmail.com` pelo seu email real.**

Você deve receber um email com as credenciais em alguns segundos.

## 📊 Monitorar Envios

### No Resend Dashboard

1. Acesse: https://resend.com/emails
2. Veja todos os emails enviados
3. Status de entrega, aberturas, etc

### No Supabase

Verifique os logs da Edge Function:

```sql
-- Ver últimas vendas e se email foi enviado
SELECT 
  o.external_id,
  o.customer_email,
  o.status,
  o.delivery_status,
  o.created_at
FROM orders o
WHERE o.status = 'completed'
ORDER BY o.created_at DESC
LIMIT 10;
```

Nos logs da função, procure por:
- `📧 Email sent successfully to: [email]` ✅ Sucesso
- `📧 Failed to send email (non-blocking)` ❌ Erro (mas venda continua)

## ⚠️ Solução de Problemas

### Email não está sendo enviado

1. **Verificar se API Key está configurada:**
```bash
supabase secrets list
```

2. **Verificar logs da função:**
- Acesse: https://supabase.com/dashboard/project/zcsyzddfmcvmxqqxqzsk/logs/edge-functions
- Procure por mensagens de erro com 📧

3. **Testar API Key manualmente:**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_sua_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": ["seu_email@gmail.com"],
    "subject": "Teste",
    "html": "<p>Teste de email</p>"
  }'
```

### Email cai em SPAM

1. Configure SPF, DKIM e DMARC no Resend
2. Use um domínio próprio (não `@resend.dev`)
3. Peça aos clientes para adicionar seu email aos contatos

### Limite de envios excedido

Resend gratuito: 3.000 emails/mês

Se precisar mais:
- Upgrade para plano pago ($20/mês = 50.000 emails)
- Ou use outro provedor (SendGrid, AWS SES, etc)

## 🔄 Alternativas ao Resend

### SendGrid (12.000 emails/mês grátis)
- API Key: https://sendgrid.com/
- Mais complexo de configurar
- Melhor para volumes maiores

### AWS SES (62.000 emails/mês grátis no primeiro ano)
- Requer conta AWS
- Configuração mais técnica
- Mais barato em grande escala

Para trocar, edite a função `sendEmailWithCredentials()` no `index.ts` e adapte a chamada da API.

## ✅ Checklist

- [ ] Conta Resend criada
- [ ] API Key gerada
- [ ] Secret configurado no Supabase
- [ ] Deploy feito
- [ ] Teste enviado com sucesso
- [ ] Email recebido na caixa de entrada
- [ ] Template personalizado (opcional)
- [ ] Domínio próprio configurado (opcional)

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Supabase Dashboard
2. Teste a API Key diretamente com curl
3. Verifique se não há typo no email do cliente
