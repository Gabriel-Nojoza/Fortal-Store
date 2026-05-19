create table if not exists public.products (
  id text primary key,
  name text not null,
  team text not null,
  price numeric(10, 2) not null check (price >= 0),
  description text not null default '',
  sizes jsonb not null default '[]'::jsonb,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_created_at_idx
  on public.products (created_at desc);

create table if not exists public.orders (
  id text primary key,
  customer jsonb not null,
  payment_method text not null check (payment_method in ('pix', 'cartao')),
  delivery_method text not null check (delivery_method in ('moto-uber', 'retirada')),
  address jsonb,
  notes text not null default '',
  items jsonb not null default '[]'::jsonb,
  total_items integer not null default 0 check (total_items >= 0),
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  status text not null default 'novo' check (status in ('novo', 'visualizado')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create table if not exists public.order_notes (
  id text primary key,
  title text not null,
  reference text not null default '',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_id text,
  customer_name text
);

create index if not exists order_notes_updated_at_idx
  on public.order_notes (updated_at desc);

create table if not exists public.push_subscriptions (
  id text primary key,
  endpoint text not null unique,
  subscription jsonb not null,
  device_name text not null,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_updated_at_idx
  on public.push_subscriptions (updated_at desc);
