-- 1. Create the Stock Table
create table if not exists accounts_stock (
  id uuid default gen_random_uuid() primary key,
  product_id text not null, -- '50k', '60k', '70k', '80k', '90k', '115k'
  credentials jsonb not null, -- Ex: {"login": "...", "password": "..."}
  status text not null default 'available', -- 'available', 'sold'
  sold_at timestamptz,
  sold_to uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Index for performance
create index if not exists idx_accounts_stock_product_status on accounts_stock(product_id, status);

-- 2. Create an RPC function to safely claim stock (Atomic operation)
create or replace function claim_account_stock(
  p_product_id text,
  p_user_id uuid
)
returns jsonb
language plpgsql
as $$
declare
  v_stock_id uuid;
  v_credentials jsonb;
begin
  -- Find the first available stock item for this product using optimistic locking logic
  -- FOR UPDATE SKIP LOCKED is the best way to handle concurrency
  select id, credentials into v_stock_id, v_credentials
  from accounts_stock
  where product_id = p_product_id
    and status = 'available'
  order by created_at asc
  limit 1
  for update skip locked;

  -- If no stock found, return null
  if v_stock_id is null then
    return null;
  end if;

  -- Mark as sold
  update accounts_stock
  set 
    status = 'sold',
    sold_at = now(),
    sold_to = p_user_id
  where id = v_stock_id;

  -- Return the credentials
  return v_credentials;
end;
$$;
