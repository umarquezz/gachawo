-- Script de Correção e Migração da Tabela 'accounts'
-- Este script vai ajustar a sua tabela existente para funcionar com o sistema de entrega automatica.

-- 1. Adicionar colunas que faltam (sem apagar seus dados)
do $$
begin
    -- Adiciona product_id se não existir
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'product_id') then
        alter table accounts add column product_id text;
    end if;

    -- Adiciona status se não existir
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'status') then
        alter table accounts add column status text default 'available';
    end if;

    -- Adiciona sold_to se não existir
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'sold_to') then
        alter table accounts add column sold_to uuid references auth.users(id);
    end if;

    -- Adiciona full_credentials se não existir (para compatibilidade futura)
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'full_credentials') then
        alter table accounts add column full_credentials jsonb;
    end if;
end $$;

-- 2. Migrar dados antigos (se houver coluna is_sold)
-- Tenta atualizar o status baseado no is_sold, se a coluna existir
do $$
begin
    if exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'is_sold') then
        -- SQL dinâmico para evitar erro de compilação se is_sold não existir
        execute 'update accounts set status = ''sold'' where is_sold = true and status = ''available''';
    end if;
end $$;

-- 3. Criar índice para performance (agora que a coluna status existe com certeza)
drop index if exists idx_accounts_product_status;
create index idx_accounts_product_status on accounts(product_id, status);

-- 4. Atualizar a Função de Entrega (RPC)
create or replace function claim_account_stock(
  p_product_id text,
  p_user_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_stock_id uuid;
  v_email text;
  v_password text;
  v_json_credentials jsonb;
begin
  -- Busca a primeira conta disponível
  select id, email, password, full_credentials into v_stock_id, v_email, v_password, v_json_credentials
  from accounts
  where product_id = p_product_id
    and status = 'available'
  order by created_at asc
  limit 1
  for update skip locked;

  if v_stock_id is null then
    return null;
  end if;

  -- Marca como vendida
  update accounts
  set 
    status = 'sold',
    sold_at = now(),
    sold_to = p_user_id
  where id = v_stock_id;

  -- Retorna as credenciais formatadas
  if v_json_credentials is not null then
      return v_json_credentials;
  else
      return jsonb_build_object('login', v_email, 'senha', v_password);
  end if;
end;
$$;
