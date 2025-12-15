-- 1. Create the Stock Table (Adapted to match user's preferred column style)
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  product_id text not null, -- '50k', '60k', '70k', '80k', '90k', '115k'
  email text,    -- Login/Email
  password text, -- Senha
  full_credentials jsonb, -- Campo extra para guardar tudo junto se precisar (opcional, mas bom pra compatibilidade)
  status text not null default 'available', -- 'available', 'sold'
  sold_at timestamptz,
  sold_to uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Index
create index if not exists idx_accounts_product_status on accounts(product_id, status);

-- 2. Create/Update RPC function to work with THIS table structure
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
  -- Find first available
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

  -- Mark as sold
  update accounts
  set 
    status = 'sold',
    sold_at = now(),
    sold_to = p_user_id
  where id = v_stock_id;

  -- Return formatted JSON for the frontend to use
  -- Se tiver JSON pronto usa ele, senão monta com email/password
  if v_json_credentials is not null then
      return v_json_credentials;
  else
      return jsonb_build_object('login', v_email, 'senha', v_password);
  end if;
end;
$$;
