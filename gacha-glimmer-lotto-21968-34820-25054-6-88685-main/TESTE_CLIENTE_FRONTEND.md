# 🎯 GUIA DE TESTE - HISTÓRICO DE COMPRAS

## ✅ O QUE FOI CORRIGIDO

O histórico de compras agora mostra:
- ✅ Status correto da compra (Entregue/Pendente)
- ✅ Valor real pago
- ✅ Credenciais da conta (email e senha) quando entregue

## 🖥️ COMO TESTAR LOCALMENTE

### 1. Servidor já está rodando!
```
URL: http://localhost:8081/
```

### 2. Fazer Login
- Acesse a página de login do seu site
- Entre com o email: `luizcharles007@gmail.com`
- Use a senha cadastrada no sistema

### 3. Ir para Histórico de Compras
- Navegue até a página de histórico
- Ou acesse diretamente: `http://localhost:8081/historico-compras`

### 4. Verificar Dados
Você deve ver:
- 📦 Card com a compra
- 🟢 Badge "Entregue" (verde)
- 💰 Valor real pago (não R$ 0,00)
- 📧 Email da conta do jogo
- 🔒 Senha da conta do jogo

## 📸 COMO DEVE FICAR

### Compra Entregue (Verde):
```
┌─────────────────────────────────────┐
│ Produto 50K CHRONO          Entregue │
│ ID: GGC-123456                       │
│                                      │
│ 📅 16/12/2024 às 22:35               │
│ 💰 R$ 49,90                          │
│                                      │
│ ✅ Conta Entregue - Credenciais:    │
│ 📧 Email: conta@exemplo.com          │
│ 🔒 Senha: senha123                   │
└─────────────────────────────────────┘
```

### Compra Pendente (Amarelo):
```
┌─────────────────────────────────────┐
│ Produto 50K CHRONO         Pendente  │
│ ID: GGC-789012                       │
│                                      │
│ 📅 17/12/2024 às 10:20               │
│ 💰 R$ 49,90                          │
│                                      │
│ ⏳ Aguardando confirmação...         │
└─────────────────────────────────────┘
```

## 🔍 TESTES RECOMENDADOS

### Teste 1: Cliente que Comprou
- ✅ Login com `luizcharles007@gmail.com`
- ✅ Verificar se mostra compra entregue
- ✅ Copiar credenciais e testar no jogo

### Teste 2: Cliente sem Compra
- ✅ Login com outro email
- ✅ Deve mostrar: "Nenhuma compra encontrada"

### Teste 3: Compra Pendente
- ✅ Fazer nova compra (não pagar ainda)
- ✅ Verificar se aparece "Pendente"
- ✅ Pagar e verificar se muda para "Entregue"

## ⚠️ SE ALGO NÃO FUNCIONAR

### Erro: "Nenhuma compra encontrada"
**Possíveis causas:**
1. Email de login diferente do email da compra
2. Compra não foi processada pelo webhook
3. Cliente não logado corretamente

**Solução:**
```bash
# Verificar compras no banco
SELECT customer_email, status, delivery_status 
FROM orders 
WHERE customer_email = 'email-do-cliente@gmail.com';
```

### Erro: "Status Pendente" (mas pagamento confirmado)
**Possíveis causas:**
1. Webhook não recebeu notificação do GGCheckout
2. Problema no processamento (verificar logs)

**Solução:**
```bash
# Ver logs do webhook
SELECT created_at, success, error_message 
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Erro: "Valor R$ 0,00"
**Possíveis causas:**
1. Campo `amount` vazio no banco
2. Webhook não capturou valor corretamente

**Solução:**
```bash
# Verificar valores
SELECT id, external_id, amount, status 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🚀 DEPLOY PARA PRODUÇÃO

### Quando estiver tudo OK no teste local:

1. **Build do projeto:**
```bash
npm run build
```

2. **Deploy (Vercel/Netlify):**
```bash
# Vercel
vercel --prod

# OU Netlify
netlify deploy --prod --dir=dist
```

3. **Configurar Variáveis de Ambiente:**
- `VITE_SUPABASE_URL`: https://zcsyzddfmcvmxqqxqzsk.supabase.co
- `VITE_SUPABASE_ANON_KEY`: (copiar do arquivo .env)

4. **Testar em Produção:**
- Acessar URL do site (gachaworld.online)
- Fazer login com cliente real
- Verificar histórico

## 📞 CONTATO PARA SUPORTE

Se encontrar problemas:

1. **Capturar informações:**
   - Email do cliente
   - ID da compra (external_id)
   - Screenshot da tela
   - Mensagem de erro (se houver)

2. **Verificar logs:**
   - Edge Function: Supabase Dashboard → Functions → ggcheckout → Logs
   - Database: Supabase → Table Editor → webhook_logs e orders

3. **Comandos úteis:**
```bash
# Ver últimas compras
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

# Ver último webhook
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;

# Verificar conta entregue
SELECT * FROM accounts WHERE id = (
  SELECT account_id FROM orders WHERE customer_email = 'cliente@email.com'
);
```

## ✅ CHECKLIST FINAL

Antes de considerar concluído:

- [ ] Cliente consegue fazer login
- [ ] Histórico carrega sem erros
- [ ] Status aparece correto (Entregue/Pendente)
- [ ] Valor está correto (não R$ 0,00)
- [ ] Credenciais aparecem quando entregue
- [ ] Credenciais funcionam no jogo
- [ ] Layout está bonito e responsivo
- [ ] Testa em mobile e desktop

## 🎉 TUDO PRONTO!

Servidor rodando: **http://localhost:8081/**  
Status: **✅ FUNCIONANDO**

Qualquer dúvida, só chamar! 🚀
