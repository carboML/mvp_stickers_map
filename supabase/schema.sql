-- Ejecuta esto en Supabase: SQL Editor → New query → Run

create table if not exists public.stickers (
  id uuid primary key,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  nfc_id text not null unique,
  lot_id text not null,
  lot_name text not null,
  lot_sticker_number integer not null,
  author_name text,
  note text,
  photo_data_url text,
  created_at timestamptz not null default now()
);

alter table public.stickers enable row level security;

-- MVP: lectura/escritura pública con anon key (ajusta en producción)
create policy "stickers_select_anon" on public.stickers for select using (true);
create policy "stickers_insert_anon" on public.stickers for insert with check (true);
