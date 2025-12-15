# Relatório de Auditoria: Fluxo de Checkout e Entrega de Contas

## 📋 Sumário Executivo

**Status do Projeto**: ⚠️ **CÓDIGO FONTE INCOMPLETO**  
**Risco Crítico**: Alto  
**Causa Provável do Bug**: Webhook/Callback do GGCheckout não implementado ou perdido

---

## 🔍 Situação Encontrada

### Estrutura do Projeto

O projeto foi exportado do **Lovable** (plataforma no-code/low-code) e está **INCOMPLETO**:

```
✅ PRESENTE:
- Estrutura base do Vite + React + TypeScript
- Configuração do Supabase
- Esquema SQL do banco de dados (tabela accounts)
- Função RPC claim_account_stock() para baixa de estoque
- Rotas definidas em App.tsx (Recharge, Thanks, PurchaseHistory)

❌ AUSENTE (CRÍTICO):
- Código fonte das páginas (src/pages/*.tsx - VAZIAS)
- Webhook do GGCheckout (supabase/functions/ggcheckout/ - VAZIO)
- Lógica de integração com checkout
- Handler de callbacks/confirmação de pagamento
- Logs e auditoria
- Qualquer código que persiste pedidos no banco
```

---

## 📊 Fluxo Esperado vs Realidade

### Fluxo Esperado (Como Deveria Funcionar)

```
┌─────────────────┐
│ 1. USUÁRIO      │
│ Clica "Comprar" │
│ na página       │
│ /recarga        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. FRONTEND     │
│ Gera link de    │
│ pagamento       │
│ GGCheckout      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. GGCHECKOUT   │
│ Processa        │
│ pagamento       │
└────────┬────────┘
         │
         ▼ (quando aprovado)
┌─────────────────────────────┐
│ 4. WEBHOOK/CALLBACK         │
│ GGCheckout notifica backend │
│ POST /ggcheckout            │
│ {                           │
│   status: "approved",       │
│   transaction_id: "xxx",    │
│   product_id: "50k",        │
│   customer_email: "..."     │
│ }                           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 5. EDGE FUNCTION            │
│ supabase/functions/ggcheckout/index.ts │
│                             │
│ a) Valida webhook           │
│ b) Verifica idempotência    │
│ c) Inicia transação         │
│ d) Grava pedido (orders)    │
│ e) Chama claim_account_stock│
│ f) Envia email/notificação  │
│ g) Retorna 200 OK           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│ 6. SUPABASE     │
│ RPC Function    │
│ claim_account_  │
│ stock()         │
│                 │
│ - SELECT... FOR │
│   UPDATE SKIP   │
│   LOCKED        │
│ - UPDATE status │
│   = 'sold'      │
│ - RETURN creds  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. CLIENTE      │
│ Recebe conta    │
│ via email ou    │
│ página /thanks  │
└─────────────────┘
```

### Realidade Atual

```
┌─────────────────┐
│ 1. USUÁRIO      │
│ Clica "Comprar" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. FRONTEND     │
│ ??? (código     │
│ não existe)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. GGCHECKOUT   │
│ Processa OK     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ 4. WEBHOOK ❌               │
│ Pasta vazia!                │
│ supabase/functions/ggcheckout/ │
│                             │
│ → Não recebe notificação    │
│ → Não grava pedido          │
│ → Não baixa estoque         │
│ → Cliente não recebe conta  │
└─────────────────────────────┘

RESULTADO: 💸 Dinheiro entra, conta não sai
```

---

## 🗂️ Arquivos Críticos Mapeados

### Arquivos Existentes

| Arquivo | Papel | Status |
|---------|-------|--------|
| `supabase/stock_setup_v2.sql` | Define tabela `accounts` e RPC `claim_account_stock()` | ✅ Completo |
| `supabase/db_magic_fix.sql` | Script de migração/correção da tabela accounts | ✅ Completo |
| `supabase/fix_accounts_table.sql` | Adiciona colunas faltantes (product_id, status, sold_to) | ✅ Completo |
| `src/App.tsx` | Define rotas (Recharge, Thanks, PurchaseHistory) | ⚠️ Importa páginas inexistentes |
| `supabase/config.toml` | ID do projeto Supabase | ✅ Presente |

### Arquivos AUSENTES (CRÍTICOS)

| Arquivo Esperado | Papel | Impacto da Ausência |
|------------------|-------|---------------------|
| `supabase/functions/ggcheckout/index.ts` | **Webhook handler** - Recebe notificações do GGCheckout | 🔴 **CRÍTICO** - Nenhuma compra é processada |
| `src/pages/Recharge.tsx` | Página de compra - Gera link GGCheckout | 🟠 Não sabemos como o link é gerado |
| `src/pages/Thanks.tsx` | Página de confirmação - Exibe conta ao cliente | 🟠 Não sabemos como entrega é feita |
| `src/pages/PurchaseHistory.tsx` | Histórico de compras | 🟡 Auditoria impossível |
| `src/integrations/supabase/client.ts` | Cliente Supabase configurado | 🟠 Não sabemos credenciais/configuração |
| Tabela `orders` ou `purchases` (schema SQL) | Persistir dados da compra | 🔴 **CRÍTICO** - Nenhum registro de vendas |

---

## ⚠️ Riscos Identificados

### 1. ❌ WEBHOOK NÃO IMPLEMENTADO (CRÍTICO)
**Severidade**: 🔴 Bloqueante  
**Evidência**: Pasta `supabase/functions/ggcheckout/` está vazia  
**Impacto**: 
- 100% das compras são perdidas
- GGCheckout notifica, mas ninguém escuta
- Dinheiro entra, conta não sai

**Código Esperado (AUSENTE)**:
```typescript
// supabase/functions/ggcheckout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const payload = await req.json()
  
  // ❌ Não existe validação de webhook
  // ❌ Não existe idempotência (transaction_id única)
  // ❌ Não existe gravação de pedido
  // ❌ Não existe chamada para claim_account_stock()
  // ❌ Não existe tratamento de erro
  
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

---

### 2. ❌ AUSÊNCIA DE TRANSAÇÃO ATÔMICA
**Severidade**: 🔴 Crítico  
**Evidência**: Função `claim_account_stock()` existe, mas não há código que:
1. Grava o pedido (orders)
2. Chama a função
3. Confirma tudo junto

**Problema**:
```sql
-- Cenário de falha:
BEGIN;
  INSERT INTO orders (...) VALUES (...);  -- ❌ Tabela não existe
  SELECT claim_account_stock('50k', user_id);  -- ✅ Executaria
COMMIT;  -- Se INSERT falhar, ROLLBACK não acontece porque não há transação
```

**Solução Necessária**:
- Criar tabela `orders`
- Envolver tudo em uma Edge Function com transação

---

### 3. ❌ IDEMPOTÊNCIA INEXISTENTE
**Severidade**: 🔴 Crítico  
**Evidência**: Sem webhook, não há como verificar duplicatas

**Cenário de Risco**:
```
GGCheckout envia webhook 3x (retry automático)
  ↓
Webhook 1: Grava pedido + Entrega conta A ✅
Webhook 2: Grava pedido DUPLICADO + Entrega conta B ❌
Webhook 3: Grava pedido DUPLICADO + Entrega conta C ❌

Resultado: Cliente paga 1x, recebe 3 contas
```

**Solução Necessária**:
```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY,
  transaction_id text UNIQUE NOT NULL,  -- ← CHAVE DA IDEMPOTÊNCIA
  ...
);
```

---

### 4. ❌ CONCORRÊNCIA (Parcialmente Mitigado)
**Severidade**: 🟡 Baixo (se webhook funcionar)  
**Evidência**: Função usa `FOR UPDATE SKIP LOCKED` ✅

**Análise**:
```sql
-- Código da função claim_account_stock() (CORRETO):
select id, email, password, full_credentials
from accounts
where product_id = p_product_id and status = 'available'
order by created_at asc
limit 1
for update skip locked;  -- ✅ Correto para concorrência
```

**Status**: ✅ Esse ponto está resolvido corretamente no banco

---

### 5. ❌ LOGS E AUDITORIA INEXISTENTES
**Severidade**: 🟠 Alto  
**Evidência**: 
- Sem tabela `orders`
- Sem logs de webhook
- Sem rastreamento de entregas

**Problema**:
- Impossível saber quantas vendas foram perdidas
- Impossível auditar o que aconteceu
- Cliente reclama: "Paguei mas não recebi" → Sem prova

**Dados Perdidos**:
- Qual transaction_id do GGCheckout?
- Quando o pagamento foi aprovado?
- Qual conta foi entregue?
- Para qual email?

---

### 6. ❌ FALHAS SILENCIOSAS (Provável)
**Severidade**: 🔴 Crítico  
**Evidência**: Código ausente, mas padrão comum é:

```typescript
// Anti-padrão comum:
try {
  await processPayment()
} catch (error) {
  console.log(error)  // ❌ Log no void
  return { ok: true }  // ❌ Retorna sucesso mesmo com erro!
}
```

**Impacto**: GGCheckout acha que deu certo, mas pedido não foi gravado

---

### 7. ⚠️ WEBHOOK RETORNANDO 200 CEDO DEMAIS (Risco)
**Severidade**: 🟠 Alto (se mal implementado)  
**Padrão Errado**:
```typescript
serve(async (req) => {
  const payload = await req.json()
  
  // ❌ ERRADO: Retorna antes de processar
  setTimeout(() => processOrder(payload), 0)
  
  return new Response("OK")  // ← GGCheckout acha que deu certo
  // Mas processOrder() pode falhar depois
})
```

---

## 🏗️ Arquitetura do Banco de Dados

### Esquema Atual (Parcial)

```sql
-- ✅ EXISTE
CREATE TABLE accounts (
  id uuid PRIMARY KEY,
  product_id text NOT NULL,
  email text,
  password text,
  full_credentials jsonb,
  status text DEFAULT 'available',  -- 'available' | 'sold'
  sold_at timestamptz,
  sold_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_accounts_product_status ON accounts(product_id, status);

-- ✅ EXISTE E ESTÁ CORRETO
CREATE OR REPLACE FUNCTION claim_account_stock(
  p_product_id text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_stock_id uuid;
  v_email text;
  v_password text;
  v_json_credentials jsonb;
BEGIN
  -- Lock otimista com SKIP LOCKED (correto!)
  SELECT id, email, password, full_credentials
  INTO v_stock_id, v_email, v_password, v_json_credentials
  FROM accounts
  WHERE product_id = p_product_id AND status = 'available'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_stock_id IS NULL THEN
    RETURN NULL;  -- Sem estoque
  END IF;

  UPDATE accounts SET
    status = 'sold',
    sold_at = now(),
    sold_to = p_user_id
  WHERE id = v_stock_id;

  RETURN COALESCE(
    v_json_credentials,
    jsonb_build_object('login', v_email, 'senha', v_password)
  );
END;
$$;
```

### Tabelas AUSENTES (Necessárias)

```sql
-- ❌ NÃO EXISTE - CRÍTICO
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL,  -- ID do GGCheckout
  user_id uuid REFERENCES auth.users(id),
  product_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL,  -- 'pending' | 'completed' | 'failed'
  account_id uuid REFERENCES accounts(id),  -- Conta entregue
  customer_email text,
  customer_name text,
  webhook_payload jsonb,  -- Backup do payload original
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ❌ NÃO EXISTE - Para auditoria
CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,  -- 'ggcheckout'
  event_type text,
  payload jsonb,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

---

## 📌 Pontos Prováveis da Falha

### Hipótese Mais Provável (90% de certeza)

**O webhook do GGCheckout não está configurado ou foi perdido na exportação do Lovable**

**Evidências**:
1. Pasta `supabase/functions/ggcheckout/` existe mas está vazia
2. Lovable gera código dinamicamente - pode não exportar Edge Functions
3. Sem webhook, nenhuma compra pode ser processada
4. Função `claim_account_stock()` existe e está correta → problema não é no banco

**Teste para Confirmar**:
```bash
# Verificar se o endpoint existe no Supabase
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/ggcheckout \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Se retornar 404 → CONFIRMADO: webhook não deployado
```

---

### Outras Causas Possíveis

| Hipótese | Probabilidade | Como Verificar |
|----------|---------------|----------------|
| Webhook existe mas URL errada no GGCheckout | 10% | Verificar painel GGCheckout → Configurações → Webhook URL |
| Webhook existe mas retorna erro 500 | 5% | Verificar logs do Supabase Edge Functions |
| Tabela `orders` não existe | 95% | Query: `SELECT * FROM orders LIMIT 1;` |
| Frontend não gera link de pagamento | 15% | Inspecionar código da página /recarga (se conseguir recuperar) |

---

## 🚀 Próximos Passos Recomendados

### FASE 1: Diagnóstico Detalhado (URGENTE)

1. **Verificar se há código em produção**
   ```bash
   # No Lovable ou servidor:
   - Acessar projeto no Lovable
   - Verificar se há código gerado dinamicamente
   - Exportar projeto completo (não só build)
   ```

2. **Verificar Edge Functions deployadas**
   ```bash
   supabase functions list
   # ou via API REST
   curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/ \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

3. **Verificar esquema completo do banco**
   ```sql
   -- No SQL Editor do Supabase:
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Verificar se existe tabela de pedidos
   ```

4. **Verificar configuração do GGCheckout**
   - Logar no painel do GGCheckout
   - Verificar URL do webhook configurada
   - Testar webhook manualmente (se houver opção)

---

### FASE 2: Implementação do Webhook (CRÍTICO)

**Prioridade**: 🔴 MÁXIMA  
**Tempo Estimado**: 2-4 horas  

**Criar**: `supabase/functions/ggcheckout/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    // 1. LOG DO WEBHOOK (sempre, mesmo se falhar)
    await logWebhook(payload)
    
    // 2. VALIDAR ASSINATURA (se GGCheckout enviar)
    if (!validateWebhook(payload)) {
      throw new Error('Invalid webhook signature')
    }
    
    // 3. VERIFICAR SE É APROVADO
    if (payload.status !== 'approved') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // 4. PROCESSAR PEDIDO (COM IDEMPOTÊNCIA)
    const result = await processOrder(payload)
    
    // 5. RETORNAR SUCESSO
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    
    // ❌ NÃO retornar 200 em caso de erro!
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processOrder(payload: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // Service role para bypass RLS
  )
  
  const { transaction_id, product_id, customer_email, user_id, amount } = payload
  
  // 1. IDEMPOTÊNCIA: Verificar se já processamos
  const { data: existing } = await supabase
    .from('orders')
    .select('id, account_id')
    .eq('transaction_id', transaction_id)
    .single()
  
  if (existing) {
    console.log(`Order ${transaction_id} already processed`)
    
    // Retornar conta já entregue
    const { data: account } = await supabase
      .from('accounts')
      .select('email, password, full_credentials')
      .eq('id', existing.account_id)
      .single()
    
    return { ok: true, credentials: account, idempotent: true }
  }
  
  // 2. CRIAR PEDIDO (status pending)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      transaction_id,
      user_id,
      product_id,
      amount,
      status: 'pending',
      customer_email,
      webhook_payload: payload
    })
    .select()
    .single()
  
  if (orderError) throw orderError
  
  // 3. CLAIM ACCOUNT (com lock)
  const { data: credentials, error: claimError } = await supabase
    .rpc('claim_account_stock', {
      p_product_id: product_id,
      p_user_id: user_id
    })
  
  if (claimError || !credentials) {
    // Marcar pedido como falhou
    await supabase
      .from('orders')
      .update({ status: 'failed', error_message: 'Out of stock' })
      .eq('id', order.id)
    
    throw new Error('No stock available')
  }
  
  // 4. ATUALIZAR PEDIDO (completed)
  await supabase
    .from('orders')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      account_id: credentials.id  // Se a função retornar o ID
    })
    .eq('id', order.id)
  
  // 5. ENVIAR EMAIL (opcional, mas recomendado)
  // await sendEmail(customer_email, credentials)
  
  return { ok: true, order_id: order.id, credentials }
}

async function logWebhook(payload: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  await supabase.from('webhook_logs').insert({
    source: 'ggcheckout',
    event_type: payload.event || 'payment',
    payload: payload,
    processed: false
  })
}

function validateWebhook(payload: any): boolean {
  // TODO: Implementar validação de assinatura do GGCheckout
  // Exemplo (depende do que o GGCheckout envia):
  // const signature = payload.signature
  // const secret = Deno.env.get('GGCHECKOUT_SECRET')
  // return crypto.subtle.verify(...)
  
  return true  // Por enquanto, aceitar tudo (TROCAR depois!)
}
```

**Deploy**:
```bash
supabase functions deploy ggcheckout
```

---

### FASE 3: Criar Tabelas de Auditoria

```sql
-- Executar no SQL Editor do Supabase
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  product_id text NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  account_id uuid REFERENCES accounts(id),
  customer_email text,
  customer_name text,
  webhook_payload jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text,
  payload jsonb,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_webhook_logs_source ON webhook_logs(source, created_at);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);
```

---

### FASE 4: Configurar Webhook no GGCheckout

1. Logar no painel do GGCheckout
2. Ir em Configurações → Webhooks
3. Adicionar URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/ggcheckout
   ```
4. Selecionar eventos: `payment.approved` (ou similar)
5. Copiar secret/chave (se houver) e adicionar ao Supabase:
   ```bash
   supabase secrets set GGCHECKOUT_SECRET=sua_chave_aqui
   ```

---

### FASE 5: Testes

**Teste 1: Webhook Manual**
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/ggcheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "transaction_id": "test123",
    "status": "approved",
    "product_id": "50k",
    "user_id": "USER_UUID_AQUI",
    "customer_email": "teste@example.com",
    "amount": 10.00
  }'
```

**Verificar**:
```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;
SELECT * FROM orders WHERE transaction_id = 'test123';
SELECT * FROM accounts WHERE status = 'sold' ORDER BY sold_at DESC LIMIT 1;
```

**Teste 2: Idempotência**
```bash
# Enviar o mesmo payload 3x
# Verificar que apenas 1 order foi criada
SELECT COUNT(*) FROM orders WHERE transaction_id = 'test123';
-- Deve retornar 1
```

**Teste 3: Concorrência**
```bash
# Enviar 2 requisições simultâneas com transaction_ids diferentes
# mas mesmo product_id
# Verificar que 2 accounts diferentes foram entregues
```

---

## 📚 Documentação de Referência

### GGCheckout
- Documentação de webhooks: [Verificar no site do GGCheckout]
- Formato de payload esperado: [A ser documentado após análise]

### Supabase
- Edge Functions: https://supabase.com/docs/guides/functions
- Database Functions: https://supabase.com/docs/guides/database/functions
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

---

## 🎯 Checklist de Correção

- [ ] **P0 - Webhook Implementado**
  - [ ] Criar `supabase/functions/ggcheckout/index.ts`
  - [ ] Implementar lógica de idempotência
  - [ ] Implementar validação de assinatura
  - [ ] Deploy da Edge Function
  - [ ] Configurar URL no painel GGCheckout

- [ ] **P0 - Tabelas Criadas**
  - [ ] Criar tabela `orders`
  - [ ] Criar tabela `webhook_logs`
  - [ ] Criar índices de performance

- [ ] **P1 - Testes**
  - [ ] Teste manual do webhook
  - [ ] Teste de idempotência
  - [ ] Teste de concorrência
  - [ ] Teste de falta de estoque
  - [ ] Teste end-to-end com pagamento real (valor mínimo)

- [ ] **P2 - Monitoramento**
  - [ ] Configurar alertas no Supabase para erros em Edge Functions
  - [ ] Dashboard de vendas (quantas completadas vs falhadas)
  - [ ] Script para processar webhooks falhados retroativamente

- [ ] **P3 - Melhorias**
  - [ ] Implementar envio de email automático com credenciais
  - [ ] Implementar página /thanks dinâmica (exibir conta comprada)
  - [ ] Adicionar notificações push/email quando estoque baixo
  - [ ] Implementar retry automático para webhooks falhados

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] Validar assinatura do webhook GGCheckout
- [ ] Usar HTTPS em todos os endpoints
- [ ] Service Role Key apenas no servidor (Edge Function)
- [ ] Anon Key apenas no cliente (frontend)
- [ ] RLS habilitado na tabela `orders` (users só veem seus próprios pedidos)
- [ ] Credentials nunca expostas em logs públicos
- [ ] Rate limiting no webhook (evitar DDoS)

---

## 📞 Suporte

**Equipe de Desenvolvimento**  
- Revisar este documento antes de fazer qualquer alteração
- Criar backup do banco antes de executar migrações
- Testar em ambiente de staging antes de produção

**Em caso de dúvidas**:
1. Verificar logs do Supabase Edge Functions
2. Verificar logs do GGCheckout
3. Consultar tabela `webhook_logs`

---

**Gerado em**: 15 de dezembro de 2025  
**Versão**: 1.0  
**Status**: 🔴 Projeto Incompleto - Ação Imediata Necessária
