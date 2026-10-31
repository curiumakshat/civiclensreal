-- Run this in Supabase SQL Editor. The issue-photos bucket is private by default;
-- public read is intentional here so community issue cards can show attachments.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null default ('CL-' || floor(random() * 9000 + 1000)::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  neighborhood text,
  photo_url text,
  status text not null default 'Submitted' check (status in ('Submitted','In progress','Resolved')),
  votes integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;

create policy "Profiles are visible to their owner" on public.profiles for select using (auth.uid() = id);
create policy "Users create their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Anyone can read reports" on public.reports for select using (true);
create policy "Authenticated users create reports" on public.reports for insert with check (auth.uid() = user_id);
create policy "Owners update their reports" on public.reports for update using (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('issue-photos', 'issue-photos', true) on conflict (id) do update set public = true;
create policy "Public can view issue photos" on storage.objects for select using (bucket_id = 'issue-photos');
create policy "Users upload their own issue photos" on storage.objects for insert to authenticated with check (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users delete their own issue photos" on storage.objects for delete to authenticated using (bucket_id = 'issue-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))) on conflict (id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
