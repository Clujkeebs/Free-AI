create extension if not exists pgcrypto;
create extension if not exists supabase_vault with schema vault;

create type public.license_status as enum ('active', 'revoked', 'expired');
create type public.provider_name as enum (
  'ollama',
  'anthropic',
  'openai',
  'groq',
  'deepseek',
  'google'
);

create or replace function public.generate_neon_key()
returns text
language sql
as $$
  select encode(gen_random_bytes(16), 'hex');
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  has_pro boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  stripe_subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.license_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null unique default public.generate_neon_key(),
  status public.license_status not null default 'active',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  constraint neon_key_32_chars check (char_length(key) = 32)
);

create table public.agent_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  default_provider public.provider_name not null default 'ollama',
  rules text not null default '',
  cloud_sync_enabled boolean not null default false,
  provider_api_key_secret_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

comment on column public.agent_settings.provider_api_key_secret_ids is
  'JSON map of provider -> Supabase Vault secret id. Raw API keys must never be stored here.';

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger agent_settings_touch_updated_at
before update on public.agent_settings
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );

  insert into public.license_keys (user_id)
  values (new.id);

  insert into public.agent_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.license_keys enable row level security;
alter table public.agent_settings enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "profiles_update_own_display"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "license_keys_select_own"
on public.license_keys for select
using (auth.uid() = user_id);

create policy "agent_settings_select_own"
on public.agent_settings for select
using (auth.uid() = user_id);

create policy "agent_settings_update_own"
on public.agent_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index license_keys_key_idx on public.license_keys(key);
create index profiles_stripe_customer_idx on public.profiles(stripe_customer_id);

create or replace function public.store_provider_api_key(
  p_user_id uuid,
  p_provider public.provider_name,
  p_secret text
)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  secret_id uuid;
begin
  if p_provider = 'ollama' then
    raise exception 'Ollama does not use API keys';
  end if;

  select vault.create_secret(
    p_secret,
    p_user_id::text || '_' || p_provider::text || '_api_key',
    'NeonForge ' || p_provider::text || ' API key'
  )
  into secret_id;

  update public.agent_settings
  set provider_api_key_secret_ids =
    provider_api_key_secret_ids ||
    jsonb_build_object(p_provider::text, secret_id::text)
  where user_id = p_user_id;

  return secret_id;
end;
$$;

revoke all on function public.store_provider_api_key(uuid, public.provider_name, text)
from public;
grant execute on function public.store_provider_api_key(uuid, public.provider_name, text)
to service_role;
