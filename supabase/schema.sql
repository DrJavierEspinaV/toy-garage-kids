-- TOY GARAGE KIDS | ESQUEMA V1.0 (catálogo + administración)
-- Ejecutar completo en el SQL Editor de un proyecto Supabase nuevo.
-- Las subastas REALES NO están habilitadas por este esquema.

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_tgk_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = (select auth.uid())); $$;

create table if not exists public.toys (
  id uuid primary key default gen_random_uuid(),
  title text not null check(length(trim(title)) between 1 and 90),
  description text not null default '',
  category text not null check(category in ('Vehículos','Peluches','Construcción','Figuras','Juegos','Retro','Especiales')),
  grade text not null check(grade in ('S','A','B','C','D')),
  condition_note text not null default '',
  price integer not null check(price >= 0),
  sale_mode text not null default 'fixed' check(sale_mode in ('fixed','battle')),
  status text not null default 'available' check(status in ('available','reserved','sold','hidden')),
  emoji text not null default '🧸',
  photos jsonb not null default '[]'::jsonb check(jsonb_typeof(photos)='array' and jsonb_array_length(photos) <= 3),
  battle_base integer check(battle_base is null or battle_base >= 0),
  battle_step integer check(battle_step is null or battle_step >= 100),
  battle_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tgk_toys_created_idx on public.toys(created_at desc);
create index if not exists tgk_toys_public_idx on public.toys(status,category,sale_mode);

create table if not exists public.store_settings (
  id smallint primary key default 1 check(id=1),
  tagline text not null default 'Explora juguetes increíbles que buscan nuevos compañeros de juego. ¡Encuentra tu próximo tesoro!',
  whatsapp text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.store_settings(id) values(1) on conflict(id) do nothing;

create or replace function public.set_tgk_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists tgk_toys_updated on public.toys;
create trigger tgk_toys_updated before update on public.toys for each row execute function public.set_tgk_updated_at();
drop trigger if exists tgk_settings_updated on public.store_settings;
create trigger tgk_settings_updated before update on public.store_settings for each row execute function public.set_tgk_updated_at();

alter table public.admins enable row level security;
alter table public.toys enable row level security;
alter table public.store_settings enable row level security;

-- La tabla admins sólo permite a cada autenticado comprobar su propia autorización.
drop policy if exists tgk_admins_read_self on public.admins;
create policy tgk_admins_read_self on public.admins for select to authenticated using(user_id = (select auth.uid()));

-- Inventario público: sólo fichas visibles; ocultas: sólo administradores.
drop policy if exists tgk_toys_public_read on public.toys;
create policy tgk_toys_public_read on public.toys for select to anon,authenticated using(status<>'hidden' or (select public.is_tgk_admin()));
drop policy if exists tgk_toys_admin_insert on public.toys;
create policy tgk_toys_admin_insert on public.toys for insert to authenticated with check((select public.is_tgk_admin()));
drop policy if exists tgk_toys_admin_update on public.toys;
create policy tgk_toys_admin_update on public.toys for update to authenticated using((select public.is_tgk_admin())) with check((select public.is_tgk_admin()));
drop policy if exists tgk_toys_admin_delete on public.toys;
create policy tgk_toys_admin_delete on public.toys for delete to authenticated using((select public.is_tgk_admin()));

-- Sólo la configuración de contacto comercial es pública. No incluir datos sensibles.
drop policy if exists tgk_settings_public_read on public.store_settings;
create policy tgk_settings_public_read on public.store_settings for select to anon,authenticated using(true);
drop policy if exists tgk_settings_admin_insert on public.store_settings;
create policy tgk_settings_admin_insert on public.store_settings for insert to authenticated with check((select public.is_tgk_admin()));
drop policy if exists tgk_settings_admin_update on public.store_settings;
create policy tgk_settings_admin_update on public.store_settings for update to authenticated using((select public.is_tgk_admin())) with check((select public.is_tgk_admin()));

-- Permisos SQL explícitos; la capa RLS agrega la comprobación de autorización.
revoke all on public.admins from anon,authenticated;
grant select on public.admins to authenticated;
revoke all on public.toys from anon,authenticated;
grant select on public.toys to anon,authenticated;
grant insert,update,delete on public.toys to authenticated;
revoke all on public.store_settings from anon,authenticated;
grant select on public.store_settings to anon,authenticated;
grant insert,update on public.store_settings to authenticated;
grant execute on function public.is_tgk_admin() to anon,authenticated;

-- Fotos públicas (sólo de los juguetes), subida reservada a administradores.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('toy-photos','toy-photos',true,4000000,array['image/jpeg'])
on conflict(id) do update set public=true,file_size_limit=4000000,allowed_mime_types=array['image/jpeg'];

drop policy if exists tgk_photos_admin_insert on storage.objects;
create policy tgk_photos_admin_insert on storage.objects for insert to authenticated
with check(bucket_id='toy-photos' and (select public.is_tgk_admin()));
drop policy if exists tgk_photos_admin_update on storage.objects;
create policy tgk_photos_admin_update on storage.objects for update to authenticated
using(bucket_id='toy-photos' and (select public.is_tgk_admin()))
with check(bucket_id='toy-photos' and (select public.is_tgk_admin()));
drop policy if exists tgk_photos_admin_delete on storage.objects;
create policy tgk_photos_admin_delete on storage.objects for delete to authenticated
using(bucket_id='toy-photos' and (select public.is_tgk_admin()));

-- PASO MANUAL obligatorio:
-- 1. En Supabase Authentication > Users, crea un usuario ADULTO con email/contraseña.
-- 2. Copia su UID y ejecuta ESTO sustituyendo UUID_REAL:
-- insert into public.admins(user_id) values ('UUID_REAL') on conflict do nothing;
-- 3. Nunca crees una política que permita INSERT anónimo sobre admins o toys.