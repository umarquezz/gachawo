-- SCRIPT MÁGICO DE CORREÇÃO E POPULAÇÃO DE ESTOQUE
-- Copie TUDO e rode no SQL Editor do Supabase.

-- 1. Garante que a tabela 'accounts' tem a estrutura correta (sem apagar dados vendidos)
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  email text,
  password text,
  full_credentials jsonb,
  status text not null default 'available',
  sold_at timestamptz,
  sold_to uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Adiciona colunas se faltarem (migração segura)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'product_id') then
        alter table accounts add column product_id text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'status') then
        alter table accounts add column status text default 'available';
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'sold_to') then
        alter table accounts add column sold_to uuid references auth.users(id);
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'accounts' and column_name = 'full_credentials') then
        alter table accounts add column full_credentials jsonb;
    end if;
end $$;

-- 2. Recria a Função de Entrega (Garante que a lógica esteja 100%)
create or replace function claim_account_stock(p_product_id text, p_user_id uuid)
returns jsonb language plpgsql as $$
declare
  v_stock_id uuid;
  v_email text;
  v_pass text;
  v_json jsonb;
begin
  -- Busca conta disponível
  select id, email, password, full_credentials into v_stock_id, v_email, v_pass, v_json
  from accounts
  where product_id = p_product_id and status = 'available'
  order by created_at asc limit 1 for update skip locked;

  if v_stock_id is null then return null; end if;

  -- Marca como vendida
  update accounts set status = 'sold', sold_at = now(), sold_to = p_user_id where id = v_stock_id;

  -- Retorna credenciais
  if v_json is not null then return v_json;
  else return jsonb_build_object('login', v_email, 'senha', v_pass);
  end if;
end;
$$;

-- 3. INSERE SUA CONTA DE 50k NO ESTOQUE
-- (Verifica se já existe essa conta para não duplicar, baseada no email)
INSERT INTO accounts (product_id, email, password, status, full_credentials)
SELECT '50k', 'db654328b3487WR7@2925.com', 'CX34877Z5', 'available', 
       jsonb_build_object('login', 'db654328b3487WR7@2925.com', 'senha', 'CX34877Z5')
WHERE NOT EXISTS (
    SELECT 1 FROM accounts WHERE email = 'db654328b3487WR7@2925.com'
);

-- Confirmação
SELECT count(*) as total_contas_50k_disponiveis FROM accounts WHERE product_id = '50k' AND status = 'available';
