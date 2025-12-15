#!/bin/bash

# =====================================================
# Script de Teste do Webhook GGCheckout
# =====================================================
# Testa todos os cenários: sucesso, idempotência,
# falta de estoque, status pendente, etc.
# =====================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuração
SUPABASE_URL="https://zcsyzddfmcvmxqqxqzsk.supabase.co"
WEBHOOK_URL="${SUPABASE_URL}/functions/v1/ggcheckout"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3l6ZGRmbWN2bXhxcXhxenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjM5NTEsImV4cCI6MjA3Njk5OTk1MX0.OK4BkPJ0PWsDldSpNAin1NdzpeFIcKBn6FDgPaOIQhg"

# Contador de testes
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Função para imprimir cabeçalho de teste
print_test_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}TEST $1: $2${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Função para imprimir sucesso
print_success() {
    echo -e "${GREEN}✅ PASSED: $1${NC}"
    ((PASSED_TESTS++))
}

# Função para imprimir falha
print_failure() {
    echo -e "${RED}❌ FAILED: $1${NC}"
    ((FAILED_TESTS++))
}

# Função para imprimir info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Função para enviar webhook
send_webhook() {
    local payload="$1"
    local response
    
    response=$(curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ANON_KEY" \
        -d "$payload")
    
    echo "$response"
}

# =====================================================
# TESTE 1: Pagamento Aprovado (Cenário de Sucesso)
# =====================================================
test_approved_payment() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Pagamento Aprovado - Entrega Automática"
    
    local transaction_id="TEST-APPROVED-$(date +%s)"
    
    payload=$(cat <<EOF
{
  "transaction_id": "$transaction_id",
  "status": "paid",
  "product_id": "50k",
  "amount": 10.00,
  "customer_email": "test@example.com",
  "customer_name": "Test User"
}
EOF
)
    
    print_info "Enviando webhook..."
    response=$(send_webhook "$payload")
    
    print_info "Response: $response"
    
    # Verificar se retornou sucesso
    if echo "$response" | grep -q '"ok":true'; then
        print_success "Webhook processado com sucesso"
    else
        print_failure "Webhook não retornou sucesso"
        return
    fi
    
    # Aguardar um pouco para garantir que foi processado
    sleep 2
    
    print_info "Transaction ID: $transaction_id"
}

# =====================================================
# TESTE 2: Idempotência (Webhook Duplicado)
# =====================================================
test_idempotency() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Idempotência - Webhook Duplicado"
    
    local transaction_id="TEST-IDEMPOTENT-$(date +%s)"
    
    payload=$(cat <<EOF
{
  "transaction_id": "$transaction_id",
  "status": "paid",
  "product_id": "50k",
  "amount": 10.00,
  "customer_email": "idempotent@example.com"
}
EOF
)
    
    print_info "Enviando webhook pela 1ª vez..."
    response1=$(send_webhook "$payload")
    
    sleep 1
    
    print_info "Enviando o MESMO webhook pela 2ª vez..."
    response2=$(send_webhook "$payload")
    
    sleep 1
    
    print_info "Enviando o MESMO webhook pela 3ª vez..."
    response3=$(send_webhook "$payload")
    
    # Verificar se todas as respostas foram ok
    if echo "$response1" | grep -q '"ok":true' && \
       echo "$response2" | grep -q '"ok":true' && \
       echo "$response3" | grep -q '"ok":true'; then
        print_success "Todas as 3 requisições retornaram sucesso (idempotente)"
    else
        print_failure "Alguma requisição falhou"
        return
    fi
    
    print_info "Transaction ID: $transaction_id"
    print_info "Verifique no banco que apenas 1 order foi criada:"
    echo "  SELECT COUNT(*) FROM orders WHERE transaction_id = '$transaction_id';"
}

# =====================================================
# TESTE 3: Status Pendente (Não Deve Entregar)
# =====================================================
test_pending_status() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Status Pendente - Não Deve Entregar Conta"
    
    local transaction_id="TEST-PENDING-$(date +%s)"
    
    payload=$(cat <<EOF
{
  "transaction_id": "$transaction_id",
  "status": "pending",
  "product_id": "50k",
  "amount": 10.00,
  "customer_email": "pending@example.com"
}
EOF
)
    
    print_info "Enviando webhook com status pending..."
    response=$(send_webhook "$payload")
    
    print_info "Response: $response"
    
    if echo "$response" | grep -q '"ok":true'; then
        print_success "Webhook processado (order criada com status pending)"
    else
        print_failure "Webhook falhou"
        return
    fi
    
    print_info "Transaction ID: $transaction_id"
    print_info "Verifique no banco que order tem status='pending' e delivery_status='pending':"
    echo "  SELECT status, delivery_status, account_id FROM orders WHERE transaction_id = '$transaction_id';"
}

# =====================================================
# TESTE 4: Status Cancelado
# =====================================================
test_cancelled_status() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Status Cancelado"
    
    local transaction_id="TEST-CANCELLED-$(date +%s)"
    
    payload=$(cat <<EOF
{
  "transaction_id": "$transaction_id",
  "status": "cancelled",
  "product_id": "50k",
  "amount": 10.00,
  "customer_email": "cancelled@example.com"
}
EOF
)
    
    print_info "Enviando webhook com status cancelled..."
    response=$(send_webhook "$payload")
    
    print_info "Response: $response"
    
    if echo "$response" | grep -q '"ok":true'; then
        print_success "Webhook processado (order marcada como cancelled)"
    else
        print_failure "Webhook falhou"
        return
    fi
    
    print_info "Transaction ID: $transaction_id"
}

# =====================================================
# TESTE 5: Payload Inválido (Faltando Campos)
# =====================================================
test_invalid_payload() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Payload Inválido - Campos Obrigatórios Faltando"
    
    payload=$(cat <<EOF
{
  "status": "paid",
  "amount": 10.00
}
EOF
)
    
    print_info "Enviando webhook SEM transaction_id e product_id..."
    response=$(send_webhook "$payload")
    
    print_info "Response: $response"
    
    # Deve retornar erro mas ainda 200 (para evitar retry)
    if echo "$response" | grep -q 'Invalid payload'; then
        print_success "Webhook rejeitou payload inválido corretamente"
    else
        print_failure "Webhook não validou payload"
    fi
}

# =====================================================
# TESTE 6: Produto Inexistente (Sem Estoque)
# =====================================================
test_out_of_stock() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Produto Sem Estoque"
    
    local transaction_id="TEST-NO-STOCK-$(date +%s)"
    
    payload=$(cat <<EOF
{
  "transaction_id": "$transaction_id",
  "status": "paid",
  "product_id": "999k",
  "amount": 99.00,
  "customer_email": "nostock@example.com"
}
EOF
)
    
    print_info "Enviando webhook para produto sem estoque (999k)..."
    response=$(send_webhook "$payload")
    
    print_info "Response: $response"
    
    if echo "$response" | grep -q '"ok":true'; then
        print_success "Webhook processado (order criada mas marcada como failed)"
    else
        print_failure "Webhook falhou"
        return
    fi
    
    print_info "Transaction ID: $transaction_id"
    print_info "Verifique no banco que order tem delivery_status='failed' e error_message='Out of stock':"
    echo "  SELECT status, delivery_status, error_message FROM orders WHERE transaction_id = '$transaction_id';"
}

# =====================================================
# TESTE 7: Múltiplos Status (Approved, Completed)
# =====================================================
test_multiple_status_formats() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Múltiplos Formatos de Status"
    
    local transaction_id_approved="TEST-APPROVED-$(date +%s)"
    local transaction_id_completed="TEST-COMPLETED-$(date +%s)"
    
    # Teste com status "approved"
    payload1=$(cat <<EOF
{
  "transaction_id": "$transaction_id_approved",
  "status": "approved",
  "product_id": "50k",
  "amount": 10.00
}
EOF
)
    
    # Teste com status "completed"
    payload2=$(cat <<EOF
{
  "transaction_id": "$transaction_id_completed",
  "status": "completed",
  "product_id": "50k",
  "amount": 10.00
}
EOF
)
    
    print_info "Testando status 'approved'..."
    response1=$(send_webhook "$payload1")
    
    sleep 1
    
    print_info "Testando status 'completed'..."
    response2=$(send_webhook "$payload2")
    
    if echo "$response1" | grep -q '"ok":true' && echo "$response2" | grep -q '"ok":true'; then
        print_success "Ambos os formatos de status foram aceitos"
    else
        print_failure "Algum formato de status falhou"
    fi
}

# =====================================================
# TESTE 8: Concorrência (Simular 2 Webhooks Simultâneos)
# =====================================================
test_concurrency() {
    ((TOTAL_TESTS++))
    print_test_header "$TOTAL_TESTS" "Concorrência - 2 Compras Simultâneas"
    
    local transaction_id1="TEST-CONCURRENT-1-$(date +%s)"
    local transaction_id2="TEST-CONCURRENT-2-$(date +%s)"
    
    payload1=$(cat <<EOF
{
  "transaction_id": "$transaction_id1",
  "status": "paid",
  "product_id": "50k",
  "amount": 10.00,
  "customer_email": "concurrent1@example.com"
}
EOF
)
    
    payload2=$(cat <<EOF
{
  "transaction_id": "$transaction_id2",
  "status": "paid",
  "product_id": "50k",
  "amount": 10.00,
  "customer_email": "concurrent2@example.com"
}
EOF
)
    
    print_info "Enviando 2 webhooks simultaneamente..."
    send_webhook "$payload1" &
    send_webhook "$payload2" &
    wait
    
    sleep 2
    
    print_success "2 webhooks enviados (verifique se 2 accounts diferentes foram entregues)"
    print_info "Transaction IDs: $transaction_id1 e $transaction_id2"
    echo "  SELECT transaction_id, account_id FROM orders WHERE transaction_id IN ('$transaction_id1', '$transaction_id2');"
}

# =====================================================
# EXECUTAR TODOS OS TESTES
# =====================================================
main() {
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  🧪 Webhook Test Suite - GGCheckout${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Webhook URL: $WEBHOOK_URL"
    echo ""
    
    # Executar testes
    test_approved_payment
    test_idempotency
    test_pending_status
    test_cancelled_status
    test_invalid_payload
    test_out_of_stock
    test_multiple_status_formats
    test_concurrency
    
    # Resumo
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  📊 Test Results Summary${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed:      ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:      ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Check the output above.${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}📝 Next Steps:${NC}"
    echo "1. Verifique os dados no Supabase:"
    echo "   SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;"
    echo "   SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;"
    echo ""
    echo "2. Verifique os logs da Edge Function no Supabase Dashboard"
    echo ""
    echo "3. Teste com um pagamento real no GGCheckout"
}

# Executar
main
