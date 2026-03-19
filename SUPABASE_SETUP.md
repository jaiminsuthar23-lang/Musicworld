# Supabase Setup for MUSICWORLD by J

Follow these steps to enable your Cloud Music Vault:

## 1. Create Storage Bucket
1. Go to **Storage** in your Supabase Dashboard.
2. Click **New Bucket**.
3. Name it: `guitar-pro-files`.
4. Set it to **Public** (or add a policy allowing authenticated users to upload/download).

## 2. Create Database Table
Go to the **SQL Editor** and run this script:

```sql
-- 1. Create the guitar_tabs table (if not already created)
create table if not exists guitar_tabs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  file_path text not null,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table guitar_tabs enable row level security;

-- 3. DROP old policies to avoid conflicts
drop policy if exists "Users can see their own tabs" on guitar_tabs;
drop policy if exists "Users can insert their own tabs" on guitar_tabs;
drop policy if exists "Users can delete their own tabs" on guitar_tabs;
drop policy if exists "Users can see their own or public tabs" on guitar_tabs;

-- 4. Create NEW policies for the table
create policy "Users can see their own tabs"
  on guitar_tabs for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own tabs"
  on guitar_tabs for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own tabs"
  on guitar_tabs for delete
  using ( auth.uid() = user_id );

-- 5. Set up Storage Bucket and Policies
insert into storage.buckets (id, name, public) 
values ('guitar-pro-files', 'guitar-pro-files', true)
on conflict (id) do nothing;

create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'guitar-pro-files');

create policy "Allow authenticated select"
on storage.objects for select
to authenticated
using (bucket_id = 'guitar-pro-files');
```

## 3. Storage Policies (Optional but Recommended)
If you want to keep files private, add these policies to the `guitar-pro-files` bucket:
- **SELECT**: `(role() = 'authenticated'::text)`
- **INSERT**: `(role() = 'authenticated'::text)`
- **DELETE**: `(role() = 'authenticated'::text)`
