#!/bin/bash

# =====================================================
# Script de Teste Local - GGCheckout Webhook
# =====================================================
# Este script testa o webhook localmente enviando
# payloads de teste e validando idempotência.
# =====================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:54321/functions/v1/ggcheckout}"
ANON_KEY="${SUPABASE_ANON_KEY:-}"
TIMESTAMP=$(date +%s)

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "\n${BLUE}► $1${NC}"
}

# Função para enviar webhook
send_webhook() {
    local payload="$1"
    local description="$2"
    
    print_step "$description"
    echo "Payload:"
    echo "$payload" | jq '.'
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ANON_KEY" \
        -d "$payload")
    
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    echo -e "\nStatus: $status"
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    
    if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
        print_success "Request successful"
    else
        print_error "Request failed"
    fi
    
    return $status
}

# =====================================================
# VALIDAÇÃO INICIAL
# =====================================================

print_header "INICIANDO TESTES DO WEBHOOK GGCHECKOUT"

if [ -z "$ANON_KEY" ]; then
    print_error "SUPABASE_ANON_KEY não definida"
    echo "Configure com: export SUPABASE_ANON_KEY='sua-chave'"
    exit 1
fi

print_info "Webhook URL: $WEBHOOK_URL"
print_info "Timestamp: $TIMESTAMP"

# =====================================================
# TESTE 1: PAGAMENTO APROVADO (PRIMEIRA VEZ)
# =====================================================

print_header "TESTE 1: Pagamento Aprovado (Primeira Chamada)"

EXTERNAL_ID="TEST-${TIMESTAMP}"
PAYLOAD_APPROVED=$(cat <<EOF
{
  "transaction_id": "$EXTERNAL_ID",
  "status": "approved",
  "product_id": "50k-gemas",
  "amount": 29.90,
  "currency": "BRL",
  "customer_email": "teste@example.com",
  "customer_name": "Cliente Teste",
  "customer_document": "12345678900",
  "customer_phone": "+5511999999999",
  "event": "payment.approved",
  "payment_method": "pix",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "paid_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metadata": {
    "test": true,
    "script_version": "1.0"
  }
}
EOF
)

send_webhook "$PAYLOAD_APPROVED" "Enviando pagamento aprovado..."

print_info "Resultado esperado:"
echo "  - Pedido criado com status 'completed'"
echo "  - Delivery_status 'delivered'"
echo "  - Account reservada do estoque"
echo "  - Webhook registrado em webhook_logs"

sleep 2

# =====================================================
# TESTE 2: IDEMPOTÊNCIA (MESMO PAYLOAD)
# =====================================================

print_header "TESTE 2: Idempotência (Segunda Chamada - Mesmo Payload)"

send_webhook "$PAYLOAD_APPROVED" "Reenviando mesmo pagamento..."

print_info "Resultado esperado:"
echo "  - Pedido NÃO duplicado"
echo "  - Retorna pedido existente"
echo "  - Account_id permanece o mesmo"
echo "  - Constraint UNIQUE (external_id) previne duplicação"

sleep 2

# =====================================================
# TESTE 3: PAGAMENTO PENDENTE
# =====================================================

print_header "TESTE 3: Pagamento Pendente"

EXTERNAL_ID_PENDING="TEST-PENDING-${TIMESTAMP}"
PAYLOAD_PENDING=$(cat <<EOF
{
  "order_id": "$EXTERNAL_ID_PENDING",
  "status": "pending",
  "product_id": "100k-gemas",
  "amount": 49.90,
  "currency": "BRL",
  "customer_email": "pendente@example.com",
  "customer_name": "Cliente Pendente",
  "customer_phone": "+5511988888888",
  "event": "payment.pending",
  "payment_method": "pix",
  "qr_code": "00020126580014br.gov.bcb.pix0136...",
  "expires_at": "$(date -u -d '+30 minutes' +%Y-%m-%dT%H:%M:%SZ)",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

send_webhook "$PAYLOAD_PENDING" "Enviando pagamento pendente..."

print_info "Resultado esperado:"
echo "  - Pedido criado com status 'pending'"
echo "  - Delivery_status 'pending'"
echo "  - Account NÃO reservada (aguardando aprovação)"
echo "  - Pedido pode ser atualizado depois com status approved"

sleep 2

# =====================================================
# TESTE 4: PAGAMENTO CANCELADO
# =====================================================

print_header "TESTE 4: Pagamento Cancelado"

EXTERNAL_ID_CANCELLED="TEST-CANCELLED-${TIMESTAMP}"
PAYLOAD_CANCELLED=$(cat <<EOF
{
  "external_id": "$EXTERNAL_ID_CANCELLED",
  "status": "cancelled",
  "product_id": "200k-gemas",
  "amount": 99.90,
  "currency": "BRL",
  "customer_email": "cancelado@example.com",
  "customer_name": "Cliente Cancelado",
  "customer_document": "98765432100",
  "event": "payment.cancelled",
  "cancelled_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "cancellation_reason": "timeout",
  "created_at": "$(date -u -d '-5 minutes' +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

send_webhook "$PAYLOAD_CANCELLED" "Enviando pagamento cancelado..."

print_info "Resultado esperado:"
echo "  - Pedido criado com status 'cancelled'"
echo "  - Delivery_status 'pending'"
echo "  - Account NÃO reservada"
echo "  - Pedido não processado"

sleep 2

# =====================================================
# TESTE 5: PAYLOAD INVÁLIDO (SEM EMAIL)
# =====================================================

print_header "TESTE 5: Validação - Payload Inválido"

EXTERNAL_ID_INVALID="TEST-INVALID-${TIMESTAMP}"
PAYLOAD_INVALID=$(cat <<EOF
{
  "transaction_id": "$EXTERNAL_ID_INVALID",
  "status": "approved",
  "product_id": "produto-teste",
  "amount": 29.90
}
EOF
)

send_webhook "$PAYLOAD_INVALID" "Enviando payload sem customer_email..."

print_info "Resultado esperado:"
echo "  - Erro 400 (Bad Request)"
echo "  - Mensagem: customer_email is required"
echo "  - Pedido NÃO criado"

sleep 2

# =====================================================
# TESTE 6: CAMPOS ALTERNATIVOS (order_id)
# =====================================================

print_header "TESTE 6: Compatibilidade - Campo order_id"

EXTERNAL_ID_ALT="TEST-ORDERID-${TIMESTAMP}"
PAYLOAD_ALT=$(cat <<EOF
{
  "order_id": "$EXTERNAL_ID_ALT",
  "status": "paid",
  "product_id": "500k-gemas",
  "amount": 149.90,
  "currency": "BRL",
  "customer_email": "alternativo@example.com",
  "customer_name": "Cliente Alternativo",
  "customer_document": "11122233344",
  "customer_phone": "+5511977777777",
  "event": "payment.paid",
  "payment_method": "credit_card",
  "installments": 3,
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "paid_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

send_webhook "$PAYLOAD_ALT" "Enviando com order_id em vez de transaction_id..."

print_info "Resultado esperado:"
echo "  - Pedido criado normalmente"
echo "  - External_id = order_id"
echo "  - Status 'paid' mapeado para 'completed'"
echo "  - Account reservada"

# =====================================================
# RESUMO E CONSULTAS SQL
# =====================================================

print_header "RESUMO DOS TESTES"

print_info "Para verificar os pedidos criados, execute no Supabase:"

echo ""
echo "-- Verificar pedido aprovado original"
echo "SELECT id, external_id, status, delivery_status, account_id, created_at"
echo "FROM orders"
echo "WHERE external_id = '$EXTERNAL_ID';"
echo ""

echo "-- Verificar que não há duplicatas (deve retornar 1)"
echo "SELECT COUNT(*) FROM orders WHERE external_id = '$EXTERNAL_ID';"
echo ""

echo "-- Verificar pedido pendente"
echo "SELECT id, external_id, status, delivery_status, account_id"
echo "FROM orders"
echo "WHERE external_id = '$EXTERNAL_ID_PENDING';"
echo ""

echo "-- Verificar pedido cancelado"
echo "SELECT id, external_id, status, delivery_status, account_id"
echo "FROM orders"
echo "WHERE external_id = '$EXTERNAL_ID_CANCELLED';"
echo ""

echo "-- Verificar pedido com order_id"
echo "SELECT id, external_id, status, delivery_status, account_id"
echo "FROM orders"
echo "WHERE external_id = '$EXTERNAL_ID_ALT';"
echo ""

echo "-- Verificar logs de webhooks"
echo "SELECT id, external_id, event_type, status, created_at"
echo "FROM webhook_logs"
echo "WHERE external_id LIKE 'TEST-${TIMESTAMP}%'"
echo "ORDER BY created_at DESC;"
echo ""

echo "-- Verificar entregas realizadas"
echo "SELECT * FROM get_pending_deliveries();"
echo ""

print_header "TESTES CONCLUÍDOS"

print_success "Todos os testes foram executados"
print_info "Verifique os logs da Edge Function para detalhes"
print_info "Execute as consultas SQL acima no Supabase para validar"

echo ""
echo "Para ver logs da Edge Function em tempo real:"
echo "  supabase functions logs ggcheckout --follow"
