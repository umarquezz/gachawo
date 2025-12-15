# COPILOT_TASK.md

Objetivo: garantir que 100% das compras aprovadas sejam gravadas no Supabase e consumam 1 conta do estoque (accounts).

Checkout: GCheckout (GGCheckout).

Banco: Supabase (Postgres).

Regra: não mudar UI/visual. Só corrigir gravação do pedido + baixa de estoque + entrega.

Requisitos críticos:

- transação (atomicidade): pedido + account + status juntos
- idempotência: webhook/callback duplicado não pode duplicar pedido nem entregar 2 accounts
- lock/concorrência: 2 compras simultâneas não podem pegar a mesma account
- logs mínimos para auditoria
